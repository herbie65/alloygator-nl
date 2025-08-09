import PDFDocument from 'pdfkit'
import path from 'path'
import { promises as fs } from 'fs'
import { db, FirebaseService } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection } from 'firebase/firestore'
import { EmailService } from './email'

export type OrderRecord = any

export async function generateInvoicePdfBuffer(order: OrderRecord): Promise<Buffer> {
  return await new Promise<Buffer>((resolve) => {
    const buffers: Buffer[] = []
    const pdf = new PDFDocument({ size: 'A4', margin: 40 })
    pdf.on('data', (c) => buffers.push(c as Buffer))
    pdf.on('end', () => resolve(Buffer.concat(buffers)))

    // Optional letterhead background (wysiwyg/pdf/invoice.pdf)
    try {
      const letterheadPath = path.join(process.cwd(), 'wysiwyg', 'pdf', 'invoice.pdf')
      // Draw the first page of the letterhead PDF as background by embedding
      // pdfkit kan geen PDF importeren; kies daarom een rasterized fallback (PNG) indien aanwezig
      // Probeer invoice.png als fallback
      const letterheadPng = path.join(process.cwd(), 'wysiwyg', 'forms', 'invoice.png')
      fs.stat(letterheadPng).then(() => {
        try { pdf.image(letterheadPng, 0, 0, { width: pdf.page.width, height: pdf.page.height }) } catch {}
      }).catch(()=>{})
      // Als je een SVG/PNG aanlevert, renderen we die; PDF import is niet native ondersteund in pdfkit
    } catch {}

    // Header
    pdf.fontSize(20).text('Factuur', { align: 'right' })
    pdf.moveDown(0.5)
    pdf.fontSize(10).text(`Datum: ${new Date(order.createdAt || Date.now()).toLocaleDateString('nl-NL')}`, { align: 'right' })
    pdf.text(`Factuurnummer: ${order.invoice_number || order.orderNumber}`, { align: 'right' })

    // Seller
    pdf.moveDown(1)
    pdf.fontSize(12).text('AlloyGator Nederland')
    pdf.fontSize(10).text('Kweekgrasstraat 36')
    pdf.text('1313 BX Almere, Nederland')
    pdf.text('info@alloygator.nl  |  085-3033400')

    // Buyer
    const c = order.customer || {}
    pdf.moveDown(1)
    pdf.fontSize(12).text('Factuur aan:')
    pdf.fontSize(10).text(`${c.voornaam || ''} ${c.achternaam || ''}`.trim())
    if (c.bedrijfsnaam) pdf.text(c.bedrijfsnaam)
    pdf.text(c.adres || '')
    pdf.text(`${c.postcode || ''} ${c.plaats || ''}`.trim())
    pdf.text(c.land || '')
    if (c.email) pdf.text(`Email: ${c.email}`)

    // Items
    pdf.moveDown(1)
    pdf.fontSize(12).text('Producten', { underline: true })
    pdf.moveDown(0.5)
    pdf.fontSize(10)
    const items = Array.isArray(order.items) ? order.items : []
    items.forEach((it: any) => {
      const lineTotal = (it.price || 0) * (it.quantity || 0)
      pdf.text(`${it.name || 'Item'}  x${it.quantity || 1}  —  €${lineTotal.toFixed(2)}`)
    })

    pdf.moveDown(0.5)
    pdf.text(`Subtotaal: €${(order.subtotal || 0).toFixed(2)}`)
    pdf.text(`BTW: €${(order.vat_amount || 0).toFixed(2)}`)
    if (order.shipping_cost) pdf.text(`Verzendkosten: €${(order.shipping_cost || 0).toFixed(2)}`)
    pdf.fontSize(12).text(`Totaal: €${(order.total || 0).toFixed(2)}`)

    if (order.payment_method === 'invoice') {
      pdf.moveDown(0.5)
      const due = order.due_at ? new Date(order.due_at).toLocaleDateString('nl-NL') : ''
      pdf.fontSize(10).text(`Betaalvoorwaarden: ${order.payment_terms_days || 14} dagen${due ? ` (vóór ${due})` : ''}`)
    }

    pdf.end()
  })
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
  // Read order
  const orderSnap = await getDoc(doc(db as any, 'orders', orderId))
  if (!orderSnap.exists()) throw new Error('Order not found')
  const order = { id: orderSnap.id, ...(orderSnap.data() as any) }

  // If already has invoice, just return URL
  if (order.invoice_number && order.invoice_url) {
    return { url: order.invoice_url, number: order.invoice_number }
  }

  // Assign invoice number
  const invoiceNumber = await nextInvoiceNumber()
  order.invoice_number = invoiceNumber

  // Generate + save
  const pdf = await generateInvoicePdfBuffer(order)
  const url = await saveInvoicePdf(order, pdf)

  // Persist on order
  await setDoc(doc(db as any, 'orders', orderId), { invoice_number: invoiceNumber, invoice_url: url, updatedAt: new Date().toISOString() }, { merge: true })

  // Email invoice to customer and admin
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


