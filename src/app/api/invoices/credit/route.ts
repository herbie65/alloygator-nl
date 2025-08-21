import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { EmailService } from '@/lib/email'
import { generateCreditPdfBuffer, nextCreditNumber, saveCreditPdf } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rmaId, orderId, items, restock } = body || {}

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: 'orderId en items zijn verplicht' }, { status: 400 })
    }

    // Fetch order
    const order: any = await FirebaseService.getDocument('orders', orderId)
    if (!order) return NextResponse.json({ ok: false, error: 'Order niet gevonden' }, { status: 404 })

    // Idempotency: if credit already created for this rma/order, return existing
    if (rmaId) {
      const existing = await FirebaseService.getDocuments('credit_notes', [{ field: 'rma_id', operator: '==', value: rmaId }])
      if (existing && existing[0]?.pdf_url) return NextResponse.json({ ok: true, credit: existing[0] })
    }

    const creditNumber = await nextCreditNumber()

    // Build credit lines using order item net prices
    const orderItems: any[] = Array.isArray(order.items) ? order.items : []
    const rateFor = (cat?: string) => {
      if (cat === 'reduced') return Number(order.vatLowRate || 9)
      if (cat === 'zero') return 0
      return Number(order.vatHighRate || order.vat_rate || 21)
    }
    const lines = items.map((req: any) => {
      const match = orderItems.find((it:any)=> String(it.id||it.productId) === String(req.product_id)) || {}
      const unit = Number(match.price || req.unit_price || 0)
      const vat = rateFor(match.vat_category)
      return { name: match.name || req.name || 'Item', quantity: Number(req.qty || req.quantity || 0), unit_price: unit, vat_rate: vat }
    }).filter((l:any)=> l.quantity > 0)

    if (lines.length === 0) return NextResponse.json({ ok: false, error: 'Geen geldige creditregels' }, { status: 400 })

    // Generate PDF
    const pdf = await generateCreditPdfBuffer({
      credit_number: creditNumber,
      orderNumber: order.orderNumber || order.order_number || order.id,
      customer: order.customer || {},
      items: lines,
      createdAt: new Date().toISOString()
    })
    const url = await saveCreditPdf(creditNumber, pdf)

    // Save credit note document
    const record = await FirebaseService.addDocument('credit_notes', {
      order_id: orderId,
      rma_id: rmaId || null,
      credit_number: creditNumber,
      items: lines,
      pdf_url: url,
      created_at: new Date().toISOString()
    })

    // Optional restock
    try {
      if (restock === true || restock === 'all') {
        for (const l of lines) {
          const products = orderItems
          const match = products.find((it:any)=> String(it.id||it.productId) === String((l as any).product_id || (l as any).id)) || {}
          const productId = String(match.id || match.productId || '')
          if (!productId) continue
          try {
            const prod = await FirebaseService.getDocument('products', productId)
            const current = Number((prod as any)?.stock_quantity ?? 0)
            const next = Math.max(0, current + Number(l.quantity || 0))
            await FirebaseService.updateDocument('products', productId, { stock_quantity: next, updated_at: new Date().toISOString() })
          } catch {}
        }
      }
    } catch {}

    // Email customer
    try {
      const email = new EmailService()
      // await email.init?.() // Commented out as init method doesn't exist
      const customer = order.customer || {}
      await (email as any).transporter.sendMail?.({
        from: `AlloyGator <${process.env.SMTP_USER || ''}>`,
        to: customer.invoice_email || customer.email,
        subject: `Creditnota ${creditNumber} – Order #${order.orderNumber || order.id}`,
        html: `<p>Beste ${customer.voornaam || customer.name || 'klant'},</p><p>In de bijlage vindt u de creditnota ${creditNumber}.</p>`,
        attachments: [{ filename: `credit-${creditNumber}.pdf`, content: pdf }]
      })
    } catch (e) { console.error('credit email error', e) }

    return NextResponse.json({ ok: true, credit: { id: record.id, credit_number: creditNumber, url } })
  } catch (e) {
    console.error('credit api error', e)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


