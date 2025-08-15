import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/services/accounting/eboekhouden';

export async function POST(request: NextRequest) {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({ 
        ok: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: result.message 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ 
      ok: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
