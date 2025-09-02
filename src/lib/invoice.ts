import path from 'path'
import { promises as fs, existsSync } from 'fs'
import { FirebaseService, db } from '@/lib/firebase'
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
  if (c.bedrijfsnaam) linesLeft.push(String(c.bedrijfsnaam))
  if (billName) linesLeft.push(billName)
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

// ===== CREDIT NOTE SUPPORT =====
export async function nextCreditNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const ref = doc(db as any, 'counters', 'credit')
  const snap = await getDoc(ref)
  const last = snap.exists() ? (snap.data() as any)[String(year)] || 0 : 0
  const next = last + 1
  await setDoc(ref, { [String(year)]: next }, { merge: true })
  const padded = String(next).padStart(5, '0')
  return `${year}-${padded}`
}

export async function generateCreditPdfBuffer(args: {
  credit_number: string
  orderNumber: string
  customer: any
  items: Array<{ name: string; quantity: number; unit_price: number; vat_rate: number }>
  createdAt?: string
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  // Optional background (same als facturen)
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
  } catch (e) { console.error('[credit] background draw error', e) }
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
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
  // Header
  drawText('CREDITNOTA', pw / 2 - font.widthOfTextAtSize('CREDITNOTA', 16) / 2, ph - 60, 16)
  let metaY = ph - 110
  drawText(`Creditnr.: ${args.credit_number}`, margin, metaY); metaY -= 12
  drawText(`Datum: ${new Date(args.createdAt || Date.now()).toLocaleDateString('nl-NL')}`, margin, metaY); metaY -= 12
  if (args.orderNumber) { drawText(`Ordernr.: ${args.orderNumber}`, margin, metaY); metaY -= 16 }

  // Customer block
  const c = args.customer || {}
  let addrY = ph - 210
  drawText('Klant:', margin, addrY, 10); addrY -= 14
  const nameLine = `${c.voornaam || ''} ${c.achternaam || ''}`.trim() || c.name || ''
  if (nameLine) { drawText(String(nameLine), margin, addrY); addrY -= 12 }
  if (c.adres) { drawText(String(c.adres), margin, addrY); addrY -= 12 }
  const line2 = `${c.postcode || ''} ${c.plaats || ''}`.trim()
  if (line2) { drawText(line2, margin, addrY); addrY -= 12 }
  if (c.land) { drawText(String(c.land), margin, addrY); addrY -= 12 }

  // Table
  let y = addrY - 20
  const labelX = pw - margin - 120
  const amountRight = pw - margin
  drawText('Product', margin, y); drawRight('Netto', labelX, y); drawRight('Aantal', amountRight, y); y -= 14
  page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5 }); y -= 14

  let netTotal = 0
  let vatTotal = 0
  for (const it of (args.items || [])) {
    const qty = Number(it.quantity || 0)
    const unit = Number(it.unit_price || 0)
    const rate = Number(it.vat_rate || 0)
    netTotal += unit * qty
    vatTotal += unit * qty * (rate/100)
    drawText(String(it.name || 'Item'), margin, y)
    drawRight(`€${unit.toFixed(2)}`, labelX, y)
    drawRight(`${qty}`, amountRight, y)
    y -= 14
  }
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: pw - margin, y }, thickness: 0.5 }); y -= 18
  const addRow = (label: string, amount: number) => {
    drawRight(label + ':', labelX, y)
    drawRight(`€${amount.toFixed(2)}`, amountRight, y)
    y -= 14
  }
  addRow('Netto te crediteren', netTotal * -1)
  addRow('BTW', vatTotal * -1)
  y -= 2
  page.drawLine({ start: { x: pw - margin - 120, y }, end: { x: pw - margin, y }, thickness: 0.5 }); y -= 14
  drawRight('Totaal credit:', labelX, y, 12)
  drawRight(`€${(netTotal + vatTotal) * -1 .toFixed ? ((netTotal + vatTotal) * -1).toFixed(2) : (-(netTotal + vatTotal)).toFixed(2)}`, amountRight, y, 12)

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}

export async function saveCreditPdf(creditNumber: string, pdfBuffer: Buffer): Promise<string> {
  const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
  await fs.mkdir(invoicesDir, { recursive: true })
  const fileName = `credit-${creditNumber}.pdf`
  const filePath = path.join(invoicesDir, fileName)
  await fs.writeFile(filePath, pdfBuffer)
  return `/invoices/${fileName}`
}

export async function saveInvoicePdf(order: OrderRecord, pdfBuffer: Buffer): Promise<string> {
  const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
  await fs.mkdir(invoicesDir, { recursive: true })
  const fileName = `factuur-${order.invoice_number || order.orderNumber}.pdf`
  const filePath = path.join(invoicesDir, fileName)
  await fs.writeFile(filePath, pdfBuffer)
  return `/invoices/${fileName}`
}

// Invoice generation functions
export async function ensureInvoice(orderId: string) {
  try {
    // Get order from Firebase
    const order = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Get customer from Firebase (robust id resolution)
    const orderAny: any = order as any
    // Idempotency: if invoice already exists and file is present, reuse it
    try {
      const existingNumber: string | undefined = orderAny.invoice_number || orderAny.invoiceNumber
      if (existingNumber) {
        const invoicesDir = path.join(process.cwd(), 'public', 'invoices')
        const fileName = `factuur-${existingNumber}.pdf`
        const filePath = path.join(invoicesDir, fileName)
        if (existsSync(filePath)) {
          return {
            url: `/invoices/${fileName}`,
            number: existingNumber
          }
        }
      }
    } catch (e) {
      // continue to generate a new invoice if check fails
    }
    const customerId: string | undefined =
      orderAny.customer_id || orderAny.customerId || orderAny.customer?.id || undefined
    // Fallback: gebruik embedded klantgegevens wanneer er geen aparte customer-record is
    let customer: any = null
    if (customerId) {
      customer = await FirebaseService.getDocument('customers', customerId)
    }
    if (!customer) {
      customer = orderAny.customer || null
    }
    if (!customer) {
      // Als er echt geen klantdata is, maak alsnog een factuur met minimale gegevens
      customer = { name: 'Onbekende Klant', email: '' }
    }

    // Generate invoice number using counter
    const invoiceNumber = await nextInvoiceNumber()

    // Create invoice data
    const invoiceData = {
      order_id: orderId,
      customer_id: customerId || (customer?.id || 'anonymous'),
      invoice_number: invoiceNumber,
      amount: orderAny.total_amount || orderAny.total || orderAny.amount || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    }

    // Save invoice to Firebase
    const newInvoice = await FirebaseService.addDocument('invoices', invoiceData)

    // Update order with invoice reference
    await FirebaseService.updateDocument('orders', orderId, {
      invoice_id: newInvoice.id,
      invoice_number: invoiceNumber,
      updated_at: new Date().toISOString()
    })

    // Generate PDF and save
    const orderForPdf = { ...orderAny, invoice_number: invoiceNumber, customer }
    const pdfBuffer = await generateInvoicePdfBuffer(orderForPdf)
    const url = await saveInvoicePdf({ invoice_number: invoiceNumber, orderNumber: orderAny.orderNumber }, pdfBuffer)

    // Email PDF to customer and admin
    try {
      const email = new EmailService()
      // await email.init() // Commented out as init method doesn't exist
      await email.sendInvoiceEmail(
        {
          orderNumber: String(orderAny.orderNumber || orderId),
          customerName: customer?.name || customer?.contact_first_name || `${customer?.voornaam || ''} ${customer?.achternaam || ''}`.trim() || 'Klant',
          customerEmail: customer?.invoice_email || customer?.email || ''
        },
        pdfBuffer,
        invoiceNumber
      )
    } catch (e) { console.error('invoice email send error', e) }

    // Persist invoice_url on the order for Admin > Facturen download link
    try {
      await FirebaseService.updateDocument('orders', orderId, {
        invoice_url: url,
        updated_at: new Date().toISOString()
      })
    } catch (e) { console.error('failed to persist invoice_url on order', e) }

    // Adjust product stock once per paid order (idempotent)
    try {
      if (!orderAny.stock_adjusted) {
        const items: any[] = Array.isArray(orderAny.items) ? orderAny.items : []
        for (const it of items) {
          const productId = String(it.productId || it.id || '').trim()
          const qty = Number(it.quantity || 0)
          if (!productId || qty <= 0) continue
          try {
            const prod = await FirebaseService.getDocument('products', productId)
            const current = Number((prod as any)?.stock_quantity ?? (prod as any)?.stock ?? 0)
            const next = Math.max(0, current - qty)
            await FirebaseService.updateDocument('products', productId, { stock_quantity: next, updated_at: new Date().toISOString() })
          } catch (e) {
            console.error(`[stock] update failed for product ${productId}`, e)
          }
        }
        try {
          await FirebaseService.updateDocument('orders', orderId, { stock_adjusted: true, stock_adjusted_at: new Date().toISOString() })
        } catch (e) { console.error('failed to mark stock_adjusted on order', e) }
      }
    } catch (e) {
      console.error('stock adjustment error', e)
    }

    return {
      url,
      number: invoiceNumber
    }

  } catch (error) {
    console.error('Invoice generation error:', error)
    throw error
  }
}


