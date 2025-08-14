import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is verplicht' }, { status: 400 })
    }

    // Get order from Firebase
    const order = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
    }

    // Get customer from Firebase
    const customer = await FirebaseService.getDocument('customers', order.customer_id)
    if (!customer) {
      return NextResponse.json({ error: 'Klant niet gevonden' }, { status: 404 })
    }

    // Generate invoice data
    const invoiceData = {
      order_id: orderId,
      customer_id: order.customer_id,
      invoice_number: `INV-${Date.now()}`,
      amount: order.total_amount || order.total,
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


