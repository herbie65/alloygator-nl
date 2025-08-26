import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { generateCreditPdfBuffer } from '@/lib/invoice'

export const dynamic = "force-static"

export async function generateStaticParams() {
  return []
}

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
      credit_number: (creditInvoice as any).credit_number || creditId,
      orderNumber: (creditInvoice as any).order_number || creditId,
      customer: (creditInvoice as any).customer || {},
      items: (creditInvoice as any).items || [],
      createdAt: (creditInvoice as any).created_at || new Date().toISOString()
    }
    
    const pdfBuffer = await generateCreditPdfBuffer(creditForPdf)
    
    // Return PDF als blob
    return new NextResponse(pdfBuffer as any, {
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
