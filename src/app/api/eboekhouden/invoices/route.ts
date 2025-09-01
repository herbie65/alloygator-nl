import { NextRequest, NextResponse } from 'next/server';
import { getEBoekhoudenClient } from '@/lib/eboekhouden';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getEBoekhoudenClient();
    const sessionId = await client.openSession();
    
    try {
      const invoiceNumber = await client.addInvoice(sessionId, body);
      return NextResponse.json({
        success: true,
        invoiceNumber: invoiceNumber,
        message: 'Factuur succesvol toegevoegd aan E-boekhouden'
      });
    } finally {
      await client.closeSession(sessionId);
    }
  } catch (error) {
    console.error('E-boekhouden add invoice error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij toevoegen factuur'
    }, { status: 500 });
  }
}
