import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Debug alle environment variables die beginnen met EBOEK
    const envVars = {
      EBOEKHOUDEN_USERNAME: process.env.EBOEKHOUDEN_USERNAME ? '✅ Aanwezig' : '❌ Niet aanwezig',
      EBOEKHOUDEN_SECURITY_CODE_1: process.env.EBOEKHOUDEN_SECURITY_CODE_1 ? '✅ Aanwezig' : '❌ Niet aanwezig',
      EBOEKHOUDEN_SECURITY_CODE_2: process.env.EBOEKHOUDEN_SECURITY_CODE_2 ? '✅ Aanwezig' : '❌ Niet aanwezig',
      // Ook de oude namen checken
      EBOEK_USERNAME: process.env.EBOEK_USERNAME ? '✅ Aanwezig' : '❌ Niet aanwezig',
      EBOEK_SECURITY_CODE_1: process.env.EBOEK_SECURITY_CODE_1 ? '✅ Aanwezig' : '❌ Niet aanwezig',
      EBOEK_SECURITY_CODE_2: process.env.EBOEK_SECURITY_CODE_2 ? '✅ Aanwezig' : '❌ Niet aanwezig',
      // Alle environment variables die EBOEK bevatten
      allEboekVars: Object.keys(process.env).filter(key => key.includes('EBOEK')),
      // Node environment
      NODE_ENV: process.env.NODE_ENV,
      // Vercel specifiek
      VERCEL: process.env.VERCEL ? '✅ Vercel' : '❌ Niet Vercel',
      VERCEL_ENV: process.env.VERCEL_ENV || 'Niet ingesteld'
    };

    return NextResponse.json(envVars, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Fout bij ophalen environment variables',
      details: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 });
  }
}
