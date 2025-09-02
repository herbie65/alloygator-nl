import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

// Functie om een uniek ordernummer te genereren in het formaat AGO-05006
async function generateOrderNumber(): Promise<string> {
  try {
    // Haal alle bestaande orders op om het hoogste nummer te vinden
    const existingOrders = await FirebaseService.getDocuments('orders')
    
    let highestNumber = 0
    
    if (existingOrders && Array.isArray(existingOrders)) {
      // Zoek naar bestaande ordernummers in het formaat AGO-XXXXX
      existingOrders.forEach(order => {
        if (order.order_number && order.order_number.startsWith('AGO-')) {
          const numberPart = order.order_number.replace('AGO-', '')
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && number > highestNumber) {
            highestNumber = number
          }
        }
      })
    }
    
    // Genereer het volgende nummer
    const nextNumber = highestNumber + 1
    
    // Formatteer naar 5 cijfers met leading zeros
    const formattedNumber = nextNumber.toString().padStart(5, '0')
    
    return `AGO-${formattedNumber}`
  } catch (error) {
    console.error('Error generating order number:', error)
    // Fallback naar timestamp-gebaseerd nummer als database lookup faalt
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substr(2, 4)
    return `AGO-${timestamp.toString().slice(-5)}-${randomPart}`
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '100'
    
    console.log('Orders API called with params:', { status, limit })
    
    // Haal alle bestellingen op uit de database
    const orders = await FirebaseService.getDocuments('orders')
    
    if (!orders || orders.length === 0) {
      console.log('No orders found in database')
      return NextResponse.json([])
    }
    
    console.log(`Found ${orders.length} orders`)
    
    // Filter op status als status parameter is opgegeven
    let filteredOrders = orders
    
    if (status) {
      filteredOrders = orders.filter(order => {
        const orderStatus = order.status?.toLowerCase()
        const requestedStatus = status.toLowerCase()
        return orderStatus === requestedStatus
      })
    }
    
    // Pas limit toe
    if (limit && !isNaN(parseInt(limit))) {
      filteredOrders = filteredOrders.slice(0, parseInt(limit))
    }
    
    console.log(`Returning ${filteredOrders.length} filtered orders`)
    
    return NextResponse.json(filteredOrders)
    
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    if (!orderData) {
      return NextResponse.json({ error: 'Order data is required' }, { status: 400 })
    }

    // Genereer een uniek ordernummer in het formaat AGO-05006
    const orderNumber = await generateOrderNumber()
    
    // Voeg metadata toe aan de bestelling
    const orderWithMetadata = {
      ...orderData,
      order_number: orderNumber,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending'
    }

    // Sla de bestelling op in Firestore
    const orderResult = await FirebaseService.addDocument('orders', orderWithMetadata)
    
    if (!orderResult || !orderResult.id) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
    
    const orderId = orderResult.id

    return NextResponse.json({ 
      success: true, 
      order_id: orderId, 
      order_number: orderNumber 
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    if (!orderData || !orderData.id) {
      return NextResponse.json({ error: 'Order data and ID are required' }, { status: 400 })
    }

    // Update de bestelling in Firestore
    const success = await FirebaseService.updateDocument('orders', orderData.id, orderData)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
