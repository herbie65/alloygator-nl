import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { ensureInvoice } from '@/lib/invoice'

// Simple secure link to mark orders as paid from accounting system
// Usage: GET /api/orders/mark-paid?id=ORDER_ID&token=YOUR_ADMIN_TOKEN

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

    const expected = process.env.ADMIN_PAYMENT_TOKEN || ''
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = {
      payment_status: 'paid',
      status: 'processing',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await FirebaseService.updateDocument('orders', id, update)
    try { await ensureInvoice(id) } catch (e) { console.error('ensureInvoice after mark-paid error', e) }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('mark-paid error', e)
    return NextResponse.json({ error: 'Failed to mark as paid' }, { status: 500 })
  }
}


