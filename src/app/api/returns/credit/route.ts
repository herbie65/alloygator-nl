import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { generateCreditPdfBuffer, saveCreditPdf } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const { orderId, rmaId, items, restock } = await request.json()
    
    if (!orderId || !rmaId || !items) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, rmaId, items' },
        { status: 400 }
      )
    }

    // Haal order op via order_id (dit is de juiste referentie)
    const order = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Haal RMA op
    const rma = await FirebaseService.getDocument('returns', rmaId)
    if (!rma) {
      return NextResponse.json(
        { error: 'RMA not found' },
        { status: 404 }
      )
    }

    // Genereer creditnota nummer
    const creditNumber = await generateCreditNumber()
    
    // Maak creditnota object
    const creditInvoice = {
      credit_number: creditNumber,
      creditNumber: creditNumber, // Voor compatibiliteit
      order_id: orderId,
      order_number: order.order_number,
      orderNumber: order.order_number, // Voor compatibiliteit
      rma_id: rmaId,
      rmaId: rmaId, // Voor compatibiliteit
      customer: order.customer,
      customer_name: order.customer.contact_first_name || order.customer.voornaam + ' ' + order.customer.contact_last_name || order.customer.achternaam,
      customerName: order.customer.contact_first_name || order.customer.voornaam + ' ' + order.customer.contact_last_name || order.customer.achternaam, // Voor compatibiliteit
      items: items.map((item: any) => {
        // Zoek het originele order item op om product informatie te krijgen
        const orderItem = order.items.find((oi: any) => 
          String(oi.id || oi.product_id) === String(item.product_id)
        )
        
        return {
          product_id: item.product_id,
          productId: item.product_id, // Voor compatibiliteit
          name: orderItem?.name || `Product ${item.product_id}`,
          quantity: item.quantity || 0,
          qty_credit: item.quantity || 0,
          qty_received: item.qty_received || 0,
          qty_restock: item.qty_restock || 0,
          unit_price: orderItem?.price || 0,
          unitPrice: orderItem?.price || 0, // Voor compatibiliteit
          total: (item.quantity || 0) * (orderItem?.price || 0),
          totalPrice: (item.quantity || 0) * (orderItem?.price || 0) // Voor compatibiliteit
        }
      }),
      total: items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0),
      totalAmount: items.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0), // Voor compatibiliteit
      status: 'open',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(), // Voor compatibiliteit
      restock: restock || false
    }

    // Sla creditnota op in database
    const creditDoc = await FirebaseService.addDocument('credit_notes', creditInvoice)
    
    // Genereer PDF
    try {
      const pdfBuffer = await generateCreditPdfBuffer(creditInvoice)
      const pdfUrl = await saveCreditPdf(creditNumber, pdfBuffer)
      
      // Update creditnota met PDF URL
      await FirebaseService.updateDocument('credit_notes', creditDoc.id, {
        pdf_url: pdfUrl,
        pdfUrl: pdfUrl // Voor compatibiliteit
      })
      
      // Update RMA status
      await FirebaseService.updateDocument('returns', rmaId, {
        status: 'credited',
        credit_id: creditDoc.id,
        creditId: creditDoc.id, // Voor compatibiliteit
        credit_number: creditNumber,
        creditNumber: creditNumber // Voor compatibiliteit
      })
      
      return NextResponse.json({
        success: true,
        credit: {
          id: creditDoc.id,
          credit_number: creditNumber,
          creditNumber: creditNumber, // Voor compatibiliteit
          url: pdfUrl
        }
      })
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      // Creditnota is opgeslagen, maar PDF generatie mislukt
      return NextResponse.json({
        success: true,
        credit: {
          id: creditDoc.id,
          credit_number: creditNumber,
          creditNumber: creditNumber, // Voor compatibiliteit
          url: null
        },
        warning: 'Creditnota aangemaakt, maar PDF generatie mislukt'
      })
    }
  } catch (error) {
    console.error('Creditnota creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateCreditNumber(): Promise<string> {
  try {
    const credits = await FirebaseService.getDocuments('credit_notes')
    const numbers = credits
      .map(doc => doc.credit_number || doc.creditNumber)
      .filter(num => num && num.startsWith('C-'))
      .map(num => parseInt(num.replace('C-', '')) || 0)
    
    const nextNumber = Math.max(0, ...numbers) + 1
    return `C-${nextNumber.toString().padStart(5, '0')}`
  } catch (error) {
    console.error('Error generating credit number:', error)
    return `C-${Date.now()}`
  }
}
