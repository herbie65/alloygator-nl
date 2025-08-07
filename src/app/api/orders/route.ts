import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Klant en producten zijn verplicht' },
        { status: 400 }
      )
    }

    // Add timestamp
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending',
      orderNumber: `ORD-${Date.now()}`
    }

    const docRef = await addDoc(collection(db, 'orders'), order)

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      orderNumber: order.orderNumber
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de bestelling' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is verplicht' },
        { status: 400 }
      )
    }

    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('customer.id', '==', customerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)

    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({
      success: true,
      orders
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van bestellingen' },
      { status: 500 }
    )
  }
}
