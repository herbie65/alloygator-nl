import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { generateCreditPdfBuffer } from '@/lib/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: creditId } = await params
    
    if (!creditId) {
      return NextResponse.json({ error: 'Credit invoice ID is required' }, { status: 400 })
    }

    // Haal credit factuur op uit database
    const creditInvoice = await FirebaseService.getDocument('credit_notes', creditId)
    
    if (!creditInvoice) {
      return NextResponse.json({ error: 'Credit invoice not found' }, { status: 404 })
    }

    // Genereer PDF met originele layout en achtergrond
    const creditForPdf = { 
      ...creditInvoice, 
      orderNumber: (creditInvoice as any).order_number // Zorg dat orderNumber beschikbaar is voor PDF generatie
    }
    
    const pdfBuffer = await generateCreditPdfBuffer(creditForPdf)
    
    // Return PDF als blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="credit-${(creditInvoice as any).credit_number}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating credit invoice PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
