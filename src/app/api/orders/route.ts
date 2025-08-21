import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const orders = await FirebaseService.getDocuments('orders')
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    const newOrder = await FirebaseService.addDocument('orders', orderData)
    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...update } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is verplicht' },
        { status: 400 }
      )
    }

    update.updatedAt = new Date().toISOString()

    await FirebaseService.updateDocument('orders', id, update)

    // Best effort: als order op betaald staat, leeg client cart via header-hint (front-end kan dit oppikken)
    try {
      if ((update as any).payment_status === 'paid') {
        // no-op: response hint
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de bestelling' },
      { status: 500 }
    )
  }
}
