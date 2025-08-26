import { NextRequest, NextResponse } from 'next/server'
export const dynamic = "force-static"
import { FirebaseService } from '@/lib/firebase'
import { generateInvoicePdfBuffer, saveInvoicePdf } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    if (!orderData || !orderData.orderId) {
      return NextResponse.json({ error: 'Order data and ID are required' }, { status: 400 })
    }

    const orderId = orderData.orderId
    const order = orderData // Gebruik de data uit de request body

    // Genereer een uniek factuur nummer
    const invoiceNumber = await generateInvoiceNumber()
    
    // Bereken vervaldatum (standaard 14 dagen)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (order.payment_terms_days || 14))
    
    // Maak factuur object
    const invoice = {
      invoice_number: invoiceNumber,
      order_id: orderId,
      order_number: order.order_number || order.orderNumber,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      vat_amount: order.vat_amount,
      shipping_cost: order.shipping_cost,
      total: order.total,
      shipping_method: order.shipping_method,
      payment_status: 'open',
      payment_method: order.payment_method,
      payment_terms_days: order.payment_terms_days || 14,
      due_at: dueDate.toISOString(),
      created_at: new Date().toISOString(),
      status: 'open',
      invoice_sent: false,
      invoice_sent_date: null
    }

    // Sla factuur op in Firestore
    const invoiceResult = await FirebaseService.addDocument('invoices', invoice)
    
    if (!invoiceResult || !invoiceResult.id) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }
    
    const invoiceId = invoiceResult.id

    // Update order met factuur informatie
    await FirebaseService.updateDocument('orders', orderId, {
      invoice_number: invoiceNumber,
      invoice_id: invoiceId,
      invoice_sent: true,
      invoice_sent_date: new Date().toISOString()
    })

    // Genereer PDF met originele layout en achtergrond
    const orderForPdf = { 
      ...order, 
      invoice_number: invoiceNumber,
      orderNumber: order.order_number // Zorg dat orderNumber beschikbaar is voor PDF generatie
    }
    
    try {
      const pdfBuffer = await generateInvoicePdfBuffer(orderForPdf)
      const pdfUrl = await saveInvoicePdf(orderForPdf, pdfBuffer)
      
      // Update order met PDF URL
      await FirebaseService.updateDocument('orders', orderId, {
        invoice_url: pdfUrl
      })

      // Return success response
      return NextResponse.json({ 
        success: true, 
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        invoice_url: pdfUrl
      })
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError)
      
      // Als PDF generatie faalt, return nog steeds success maar zonder PDF
      return NextResponse.json({ 
        success: true, 
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        message: 'Factuur aangemaakt maar PDF generatie gefaald'
      })
    }
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Functie om een uniek factuur nummer te genereren
async function generateInvoiceNumber(): Promise<string> {
  try {
    // Haal alle bestaande facturen op om het hoogste nummer te vinden
    const existingInvoices = await FirebaseService.getDocuments('invoices')
    
    let highestNumber = 0
    
    if (existingInvoices && Array.isArray(existingInvoices)) {
      // Zoek naar bestaande factuur nummers in het formaat F-XXXXX
      existingInvoices.forEach(invoice => {
        if (invoice.invoice_number && invoice.invoice_number.startsWith('F-')) {
          const numberPart = invoice.invoice_number.replace('F-', '')
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
    
    return `F-${formattedNumber}`
  } catch (error) {
    console.error('Error generating invoice number:', error)
    // Fallback naar timestamp-gebaseerd nummer als database lookup faalt
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substr(2, 9)
    return `F-${timestamp.toString().slice(-5)}-${randomPart}`
  }
}
