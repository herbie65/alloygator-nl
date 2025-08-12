import path from 'path'
import { promises as fs, existsSync } from 'fs'
import { db, FirebaseService } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { EmailService } from './email'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export type OrderRecord = any

async function loadBackgroundImage(): Promise<{ bytes: Uint8Array | null; type: 'png' | 'jpg' | null }> {
  const publicDir = path.join(process.cwd(), 'public', 'wysiwyg', 'forms')
  const rootDir = path.join(process.cwd(), 'wysiwyg', 'forms')
  const png = existsSync(path.join(publicDir, 'invoice.png'))
    ? path.join(publicDir, 'invoice.png')
    : (existsSync(path.join(rootDir, 'invoice.png')) ? path.join(rootDir, 'invoice.png') : '')
  const jpg = existsSync(path.join(publicDir, 'invoice.jpg'))
    ? path.join(publicDir, 'invoice.jpg')
    : (existsSync(path.join(rootDir, 'invoice.jpg')) ? path.join(rootDir, 'invoice.jpg') : '')
  const jpeg = existsSync(path.join(publicDir, 'invoice.jpeg'))
    ? path.join(publicDir, 'invoice.jpeg')
    : (existsSync(path.join(rootDir, 'invoice.jpeg')) ? path.join(rootDir, 'invoice.jpeg') : '')
  const pick = png || jpg || jpeg
  if (!pick) return { bytes: null, type: null }
  const buf = await fs.readFile(pick)
  const bytes = new Uint8Array(buf)
  const type: 'png' | 'jpg' = pick.endsWith('.png') ? 'png' : 'jpg'
  return { bytes, type }
}

export async function generateInvoicePdfBuffer(order: OrderRecord): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 in points

  // Background
  try {
    const bg = await loadBackgroundImage()
    if (bg.bytes) {
      if (bg.type === 'png') {
        const img = await pdfDoc.embedPng(bg.bytes)
        page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
      } else {
        const img = await pdfDoc.embedJpg(bg.bytes)
        page.drawImage(img, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() })
      }
    }
  } catch (e) { console.error('[invoice] background draw error', e) }

  // Fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Helpers
  const drawText = (text: string, x: number, y: number, size = 10) => {
    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) })
  }
  const drawRight = (text: string, rightX: number, y: number, size = 10) => {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: rightX - w, y, size, font, color: rgb(0, 0, 0) })
  }

  const pw = page.getWidth()
  const ph = page.getHeight()
  const margin = 40

  // Title centered
  drawText('FACTUUR', pw / 2 - font.widthOfTextAtSize('FACTUUR', 16) / 2, ph - 60, 16)

  // Header meta (linksboven, klein)
  let metaY = ph - 110
  const orderNumber = order.invoice_number || order.orderNumber || ''
  drawText(`Factuurnummer: ${orderNumber}`, margin, metaY); metaY -= 12
  drawText(`Factuurdatum: ${new Date(order.createdAt || Date.now()).toLocaleDateString('nl-NL')}`, margin, metaY); metaY -= 12
  if (order.orderNumber) { drawText(`Ordernr.: ${order.orderNumber}`, margin, metaY); metaY -= 12 }
  if (order.createdAt) { drawText(`Besteldatum: ${new Date(order.createdAt).toLocaleDateString('nl-NL')}`, margin, metaY); metaY -= 16 }

  // Addresses: billing left, shipping right
  const c = order.customer || {}
  const shipStreet = c.shippingAdres || c.shipping_address || ''
  const shipPC = c.shippingPostcode || c.shipping_postal_code || ''
  const shipCity = c.shippingPlaats || c.shipping_city || ''
  const shipCountry = c.shippingLand || c.shipping_country || c.land || ''
  const billVat = c.vat_number || c.btwNummer || c.btw || ''

  let addrY = ph - 220
  // Billing block left
  const linesLeft: string[] = []
  const billName = `${(c.voornaam || '')} ${(c.achternaam || '')}`.trim()
  if (billName) linesLeft.push(billName)
  if (c.bedrijfsnaam) linesLeft.push(String(c.bedrijfsnaam))
  if (c.adres) linesLeft.push(String(c.adres))
  linesLeft.push(`${c.postcode || ''} ${c.plaats || ''}`.trim())
  if (c.land) linesLeft.push(String(c.land))
  if (billVat) linesLeft.push(`BTW: ${billVat}`)

  drawText('Verkocht aan:', margin, addrY, 10); addrY -= 14
  linesLeft.forEach(l => { if (l) { drawText(l, margin, addrY); addrY -= 12 } })

  // Shipping block right
  let shipY = ph - 220
  drawText('Verzenden naar:', pw/2 + 20, shipY, 10); shipY -= 14
  const shipLines: string[] = []
  const shipFirst = c.shippingVoornaam || c.shipping_first_name || ''
  const shipLast = c.shippingAchternaam || c.shipping_last_name || ''
  const shipCompany = c.shippingBedrijfsnaam || c.shipping_company || ''
  const shipName = `${shipFirst} ${shipLast}`.trim() || billName || ''
  if (shipName) shipLines.push(shipName)
  if (shipCompany) shipLines.push(shipCompany)
  if (shipStreet) shipLines.push(shipStreet)
  const shipCityLine = `${shipPC} ${shipCity}`.trim()
  if (shipCityLine) shipLines.push(shipCityLine)
  if (shipCountry) shipLines.push(shipCountry)
  shipLines.forEach(l => { if (l) { drawText(l, pw/2 + 20, shipY); shipY -= 12 } })

  // Payment & Shipping method (klein)
  const methodY = Math.min(addrY, shipY) - 16
  drawText('Betaalmethode', margin, methodY, 10)
  const pmRaw = String(order.payment_method || '').toLowerCase()
  const paymentLabel = pmRaw === 'invoice' ? 'Op rekening' : (pmRaw === 'ideal' ? 'iDEAL' : (order.payment_method || '—'))
  drawText(String(paymentLabel), margin, methodY - 12)
  drawText('Bezorgmethode', pw/2 + 20, methodY, 10)
  const shipMethod = order.shipping_method || '—'
  drawText(String(shipMethod), pw/2 + 20, methodY - 12)

  // Table header
  let y = methodY - 40
  const colLeft = margin
  const colPriceRight = pw - margin
  drawText('Product', colLeft, y, 10)
  drawRight('prijs', colPriceRight - 150, y, 10)
  drawRight('Aantal', colPriceRight, y, 10)
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5 })
  y -= 14

  // Items
  const items = Array.isArray(order.items) ? order.items : []
  items.forEach((it: any) => {
    const qty = Number(it.quantity || 1)
    const unit = Number(it.price || 0)
    const lineTotal = unit * qty
    const name = String(it.name || 'Item')

    drawText(name, colLeft, y)
    drawRight(`€${unit.toFixed(2)}`, colPriceRight - 150, y)
    drawRight(`${qty}`, colPriceRight, y)
    y -= 14
  })

  // Divider before totals
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5 })
  y -= 18

  // Totals block (right aligned)
  const labelX = pw - margin - 120
  const amountRight = pw - margin
  const addRow = (label: string, amount: number) => {
    drawRight(label + ':', labelX, y)
    drawRight(`€${amount.toFixed(2)}`, amountRight, y)
    y -= 14
  }
  addRow('Subtotaal', Number(order.subtotal || 0))
  if (order.shipping_cost) addRow('Verzending en verwerking', Number(order.shipping_cost || 0))
  addRow('BTW', Number(order.vat_amount || 0))
  y -= 2
  page.drawLine({ start: { x: pw - margin - 120, y }, end: { x: pw - margin, y }, thickness: 0.5 })
  y -= 14
  drawRight('Eindtotaal:', labelX, y, 12)
  drawRight(`€${Number(order.total || 0).toFixed(2)}`, amountRight, y, 12)

  // Bottom centered note for invoices (unpaid)
  if (pmRaw === 'invoice') {
    // Determine due date
    let due: Date | null = null
    if (order.due_at) {
      due = new Date(order.due_at)
    } else {
      const base = order.createdAt ? new Date(order.createdAt) : new Date()
      const days = Number(order.payment_terms_days || 14)
      due = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
    }
    const dueStr = due ? due.toLocaleDateString('nl-NL') : ''
    const note = `Betaling nog niet voldaan. Graag betalen voor ${dueStr}.`
    const size = 10
    const w = font.widthOfTextAtSize(note, size)
    const noteY = Math.max(y - 56, margin) // ~2 cm onder eindtotaal
    page.drawText(note, { x: pw / 2 - w / 2, y: noteY, size, font, color: rgb(0, 0, 0) })
  }

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const ref = doc(db as any, 'counters', 'invoice')
  const snap = await getDoc(ref)
  const last = snap.exists() ? (snap.data() as any)[String(year)] || 0 : 0
  const next = last + 1
  await setDoc(ref, { [String(year)]: next }, { merge: true })
  const padded = String(next).padStart(5, '0')
  return `${year}-${padded}`
}

export async function saveInvoicePdf(order: OrderRecord, pdfBuffer: Buffer): Promise<string> {
  const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
  await fs.mkdir(invoicesDir, { recursive: true })
  const fileName = `factuur-${order.invoice_number || order.orderNumber}.pdf`
  const filePath = path.join(invoicesDir, fileName)
  await fs.writeFile(filePath, pdfBuffer)
  return `/invoices/${fileName}`
}

export async function ensureInvoice(orderId: string): Promise<{ url: string; number: string }> {
  const orderSnap = await getDoc(doc(db as any, 'orders', orderId))
  if (!orderSnap.exists()) throw new Error('Order not found')
  const order = { id: orderSnap.id, ...(orderSnap.data() as any) }

  if (order.invoice_number && order.invoice_url) {
    return { url: order.invoice_url, number: order.invoice_number }
  }

  const invoiceNumber = await nextInvoiceNumber()
  order.invoice_number = invoiceNumber

  const pdf = await generateInvoicePdfBuffer(order)
  const url = await saveInvoicePdf(order, pdf)

  await setDoc(doc(db as any, 'orders', orderId), { invoice_number: invoiceNumber, invoice_url: url, updatedAt: new Date().toISOString() }, { merge: true })

  try {
    const settingsArray = await FirebaseService.getSettings()
    const settings = settingsArray && settingsArray.length > 0 ? settingsArray[0] : undefined
    const emailService = new EmailService(settings as any)
    await emailService.sendInvoiceEmail({
      orderNumber: order.orderNumber,
      customerName: `${order.customer?.voornaam || ''} ${order.customer?.achternaam || ''}`.trim(),
      customerEmail: order.customer?.email || ''
    }, pdf, invoiceNumber)
  } catch (e) {
    console.error('Failed to email invoice', e)
  }

  return { url, number: invoiceNumber }
}


