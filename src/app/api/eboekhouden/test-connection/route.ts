import { NextRequest, NextResponse } from 'next/server';
import { getEBoekhoudenClient } from '@/lib/eboekhouden';

export async function POST(request: NextRequest) {
  try {
    const client = getEBoekhoudenClient();
    const result = await client.testConnection();
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('E-boekhouden test connection error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Onbekende fout bij testen verbinding'
    }, { status: 500 });
  }
}
