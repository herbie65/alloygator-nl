import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { FirebaseService, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

async function fetchOrder(orderId: string): Promise<any> {
  const ref = doc(db as any, 'orders', orderId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as any) }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const token = searchParams.get('token') || request.headers.get('x-admin-token') || ''
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

    // Simple protection: require admin token unless explicitly disabled via env (for local dev)
    const expected = process.env.ADMIN_PAYMENT_TOKEN || process.env.ADMIN_INVOICE_TOKEN || ''
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await fetchOrder(id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const buffers: Buffer[] = []
    const docPdf = new PDFDocument({ size: 'A4', margin: 40 })
    docPdf.on('data', (chunk) => buffers.push(chunk as Buffer))

    // Header
    docPdf.fontSize(20).text('Factuur', { align: 'right' })
    docPdf.moveDown(0.5)
    docPdf.fontSize(10).text(`Datum: ${new Date(order.createdAt || Date.now()).toLocaleDateString('nl-NL')}`, { align: 'right' })
    docPdf.text(`Factuurnummer: ${order.orderNumber}`, { align: 'right' })

    // Seller
    docPdf.moveDown(1)
    docPdf.fontSize(12).text('AlloyGator Nederland')
    docPdf.fontSize(10).text('Kweekgrasstraat 36')
    docPdf.text('1313 BX Almere, Nederland')
    docPdf.text('info@alloygator.nl  |  085-3033400')

    // Buyer
    const c = order.customer || {}
    docPdf.moveDown(1)
    docPdf.fontSize(12).text('Factuur aan:')
    docPdf.fontSize(10).text(`${c.voornaam || ''} ${c.achternaam || ''}`.trim())
    docPdf.text(c.adres || '')
    docPdf.text(`${c.postcode || ''} ${c.plaats || ''}`.trim())
    docPdf.text(c.land || '')
    if (c.email) docPdf.text(`Email: ${c.email}`)

    // Items table
    docPdf.moveDown(1)
    docPdf.fontSize(12).text('Producten', { underline: true })
    docPdf.moveDown(0.5)
    docPdf.fontSize(10)
    const items = Array.isArray(order.items) ? order.items : []
    items.forEach((it: any) => {
      const lineTotal = (it.price || 0) * (it.quantity || 0)
      docPdf.text(`${it.name || 'Item'}  x${it.quantity || 1}  —  €${lineTotal.toFixed(2)}`)
    })

    docPdf.moveDown(0.5)
    docPdf.text(`Subtotaal: €${(order.subtotal || 0).toFixed(2)}`)
    docPdf.text(`BTW: €${(order.vat_amount || 0).toFixed(2)}`)
    if (order.shipping_cost) docPdf.text(`Verzendkosten: €${(order.shipping_cost || 0).toFixed(2)}`)
    docPdf.fontSize(12).text(`Totaal: €${(order.total || 0).toFixed(2)}`)

    // Payment terms for invoice
    if (order.payment_method === 'invoice') {
      docPdf.moveDown(0.5)
      const due = order.due_at ? new Date(order.due_at).toLocaleDateString('nl-NL') : ''
      docPdf.fontSize(10).text(`Betaalvoorwaarden: ${order.payment_terms_days || 14} dagen${due ? ` (vóór ${due})` : ''}`)
    }

    docPdf.end()
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      docPdf.on('end', () => resolve(Buffer.concat(buffers)))
    })

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factuur-${order.orderNumber}.pdf"`
      }
    })
  } catch (e) {
    console.error('invoice generate error', e)
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 })
  }
}


