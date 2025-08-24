import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { generateInvoicePdfBuffer } from '@/lib/invoice'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Haal factuur op uit database
    const invoice = await FirebaseService.getDocument('invoices', invoiceId)
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Genereer PDF met originele layout en achtergrond
    const orderForPdf = { 
      ...invoice, 
      orderNumber: (invoice as any).order_number // Zorg dat orderNumber beschikbaar is voor PDF generatie
    }
    
    const pdfBuffer = await generateInvoicePdfBuffer(orderForPdf)
    
    // Return PDF als blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factuur-${(invoice as any).invoice_number}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
