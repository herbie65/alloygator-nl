import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envVars = {
      NEXT_PUBLIC_MOLLIE_TEST_MODE: process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE,
      NEXT_PUBLIC_MOLLIE_TEST_API_KEY: process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY ? '✅ Aanwezig' : '❌ Niet aanwezig',
      NEXT_PUBLIC_MOLLIE_API_KEY: process.env.NEXT_PUBLIC_MOLLIE_API_KEY ? '✅ Aanwezig' : '❌ Niet aanwezig',
      NEXT_PUBLIC_MOLLIE_PROFILE_ID: process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID ? '✅ Aanwezig' : '❌ Niet aanwezig',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? '✅ Ja' : '❌ Nee'
    }

    return NextResponse.json({
      success: true,
      message: 'Mollie environment variabelen status',
      environment: envVars
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Fout bij ophalen environment variabelen',
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
