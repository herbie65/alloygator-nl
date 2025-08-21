import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { ensureInvoice } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is verplicht' }, { status: 400 })
    }

    // Get order from Firebase
    const order: any = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
    }

    // Resolve customer id robustly
    const customerId: string | undefined =
      order.customer_id || order.customerId || order.customer?.id || order.customer || undefined

    if (!customerId) {
      return NextResponse.json({ error: 'Klant ID ontbreekt in order' }, { status: 400 })
    }

    // Get customer from Firebase
    const customer = await FirebaseService.getDocument('customers', customerId)
    if (!customer) {
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 })
    }

    // Generate invoice data
    const invoiceData = {
      order_id: orderId,
      customer_id: customerId,
      invoice_number: `INV-${Date.now()}`,
      amount: order.total_amount || order.total || order.amount || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
    }

    // Save invoice to Firebase
    const newInvoice = await FirebaseService.addDocument('invoices', invoiceData)

    return NextResponse.json({
      success: true,
      invoice: newInvoice
    })

  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json({ error: 'Fout bij genereren factuur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || searchParams.get('orderId')
    if (!id) {
      return NextResponse.json({ error: 'Order ID is verplicht' }, { status: 400 })
    }
    // Genereer of hergebruik factuur en redirect naar de PDF
    const result = await ensureInvoice(id)
    return NextResponse.redirect(new URL(result.url, request.url))
  } catch (error) {
    console.error('Invoice generation (GET) error:', error)
    return NextResponse.json({ error: 'Fout bij genereren factuur' }, { status: 500 })
  }
}


