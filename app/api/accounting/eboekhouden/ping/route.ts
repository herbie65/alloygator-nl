import { NextRequest, NextResponse } from 'next/server';
import { eBoekhoudenClientInstance } from '@/services/eBoekhouden/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if credentials are configured
    const username = process.env.EBOEKHOUDEN_USERNAME;
    const securityCode1 = process.env.EBOEKHOUDEN_SECURITY_CODE_1;
    const securityCode2 = process.env.EBOEKHOUDEN_SECURITY_CODE_2;

    if (!username || !securityCode1 || !securityCode2) {
      return NextResponse.json({
        ok: false,
        error: 'e-Boekhouden credentials not configured',
        message: 'Please set EBOEKHOUDEN_USERNAME, EBOEKHOUDEN_SECURITY_CODE_1, and EBOEKHOUDEN_SECURITY_CODE_2 in environment variables'
      }, { status: 500 });
    }

    // Test connection
    const isConnected = await eBoekhoudenClientInstance.testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        ok: true,
        message: 'e-Boekhouden connection successful',
        timestamp: new Date().toISOString(),
        testMode: process.env.EBOEKHOUDEN_TEST_MODE === 'true'
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: 'e-Boekhouden connection failed',
        message: 'Could not establish connection with e-Boekhouden'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('e-Boekhouden ping error:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'e-Boekhouden ping failed',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
