import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const rmaData = await request.json()
    
    if (!rmaData || !rmaData.orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 })
    }

    // Genereer een uniek RMA nummer
    const rmaNumber = await generateRmaNumber()
    
    // Haal order op uit database om klantgegevens te krijgen
    const orders = await FirebaseService.getDocuments('orders')
    const order = orders.find((o: any) => o.order_number === rmaData.orderNumber)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Maak RMA object - alleen essentiële referenties
    const rma = {
      rma_number: rmaNumber,
      rmaNumber: rmaNumber, // Voor compatibiliteit met UI
      order_id: order.id,
      order_number: order.order_number,
      orderNumber: order.order_number, // Voor compatibiliteit met UI
      customer_id: order.customer.id || order.customer.email, // Alleen ID of email als referentie
      customer_name: rmaData.customerName,
      customerName: rmaData.customerName, // Voor compatibiliteit met UI
      email: rmaData.email,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reason: 'Retouraanvraag gestart',
      // Alleen essentiële item referenties
      items: (order.items || []).map(item => ({
        product_id: item.id || item.product_id,
        quantity: item.quantity,
        // Verwijder onnodige velden zoals name, price, vat_category
      })),
      total_amount: order.total || 0
    }

    // Sla RMA op in Firestore
    const rmaResult = await FirebaseService.addDocument('returns', rma)
    
    if (!rmaResult || !rmaResult.id) {
      return NextResponse.json({ error: 'Failed to create RMA' }, { status: 500 })
    }
    
    const rmaId = rmaResult.id

    // Update order met RMA nummer
    await FirebaseService.updateDocument('orders', order.id, {
      rma_number: rmaNumber,
      rma_id: rmaId,
      updated_at: new Date().toISOString()
    })

    // Return success response
    return NextResponse.json({ 
      success: true, 
      rma_id: rmaId,
      rma_number: rmaNumber,
      message: 'RMA succesvol aangemaakt'
    })
    
  } catch (error) {
    console.error('Error creating RMA:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Haal alle RMA's op uit de database
    const returns = await FirebaseService.getDocuments('returns')
    
    if (!returns || returns.length === 0) {
      return NextResponse.json([])
    }
    
    // Sorteer op datum (nieuwste eerst)
    returns.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    return NextResponse.json(returns)
    
  } catch (error) {
    console.error('Error fetching returns:', error)
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}

// Functie om een uniek RMA nummer te genereren
async function generateRmaNumber(): Promise<string> {
  try {
    // Haal alle bestaande RMA's op om het hoogste nummer te vinden
    const existingRmas = await FirebaseService.getDocuments('returns')
    
    let highestNumber = 0
    
    if (existingRmas && Array.isArray(existingRmas)) {
      // Zoek naar bestaande RMA nummers in het formaat RMA-XXXX
      existingRmas.forEach(rma => {
        if (rma.rma_number && rma.rma_number.startsWith('RMA-')) {
          const numberPart = rma.rma_number.replace('RMA-', '')
          const number = parseInt(numberPart, 10)
          if (!isNaN(number) && number > highestNumber) {
            highestNumber = number
          }
        }
      })
    }
    
    // Genereer het volgende nummer
    const nextNumber = highestNumber + 1
    
    // Formatteer naar 4 cijfers met leading zeros
    const formattedNumber = nextNumber.toString().padStart(4, '0')
    
    return `RMA-${formattedNumber}`
  } catch (error) {
    console.error('Error generating RMA number:', error)
    // Fallback naar timestamp-gebaseerd nummer als database lookup faalt
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substr(2, 9)
    return `RMA-${timestamp.toString().slice(-4)}-${randomPart}`
  }
}
