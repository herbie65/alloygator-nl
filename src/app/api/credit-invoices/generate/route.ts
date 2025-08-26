import { NextRequest, NextResponse } from 'next/server'
export const dynamic = "force-static"
import { FirebaseService } from '@/lib/firebase'
import { generateCreditPdfBuffer, saveCreditPdf } from '@/lib/invoice'

export async function POST(request: NextRequest) {
  try {
    const creditData = await request.json()
    
    if (!creditData || !creditData.orderId) {
      return NextResponse.json({ error: 'Credit data and order ID are required' }, { status: 400 })
    }

    const orderId = creditData.orderId
    const order = creditData // Gebruik de data uit de request body

    // Genereer een uniek credit factuur nummer
    const creditNumber = await generateCreditNumber()
    
    // Maak credit factuur object
    const creditInvoice = {
      credit_number: creditNumber,
      order_id: orderId,
      order_number: order.order_number || order.orderNumber,
      customer: order.customer,
      items: order.items,
      rma_id: order.rma_id,
      created_at: new Date().toISOString(),
      status: 'open',
      eboekhouden_sync: null
    }

    // Sla credit factuur op in Firestore
    const creditResult = await FirebaseService.addDocument('credit_notes', creditInvoice)
    
    if (!creditResult || !creditResult.id) {
      return NextResponse.json({ error: 'Failed to create credit invoice' }, { status: 500 })
    }
    
    const creditId = creditResult.id

    // Genereer PDF met originele layout en achtergrond
    const creditForPdf = { 
      ...order, 
      credit_number: creditNumber,
      orderNumber: order.order_number // Zorg dat orderNumber beschikbaar is voor PDF generatie
    }
    
    try {
      const pdfBuffer = await generateCreditPdfBuffer(creditForPdf)
      const pdfUrl = await saveCreditPdf(creditNumber, pdfBuffer)
      
      // Update credit factuur met PDF URL
      await FirebaseService.updateDocument('credit_notes', creditId, {
        pdf_url: pdfUrl
      })

      // Return success response
      return NextResponse.json({ 
        success: true, 
        credit_id: creditId,
        credit_number: creditNumber,
        pdf_url: pdfUrl
      })
    } catch (pdfError) {
      console.error('Error generating credit PDF:', pdfError)
      
      // Als PDF generatie faalt, return nog steeds success maar zonder PDF
      return NextResponse.json({ 
        success: true, 
        credit_id: creditId,
        credit_number: creditNumber,
        message: 'Credit factuur aangemaakt maar PDF generatie gefaald'
      })
    }
  } catch (error) {
    console.error('Error generating credit invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Functie om een uniek credit factuur nummer te genereren
async function generateCreditNumber(): Promise<string> {
  try {
    // Haal alle bestaande credit facturen op om het hoogste nummer te vinden
    const existingCredits = await FirebaseService.getDocuments('credit_notes')
    
    let highestNumber = 0
    
    if (existingCredits && Array.isArray(existingCredits)) {
      // Zoek naar bestaande credit nummers in het formaat C-XXXXX
      existingCredits.forEach(credit => {
        if (credit.credit_number && credit.credit_number.startsWith('C-')) {
          const numberPart = credit.credit_number.replace('C-', '')
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
    
    return `C-${formattedNumber}`
  } catch (error) {
    console.error('Error generating credit number:', error)
    // Fallback naar timestamp-gebaseerd nummer als database lookup faalt
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substr(2, 9)
    return `C-${timestamp.toString().slice(-5)}-${randomPart}`
  }
}
