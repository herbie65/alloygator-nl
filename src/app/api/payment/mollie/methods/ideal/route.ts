import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

export async function GET(request: NextRequest) {
  try {
    // Haal Mollie instellingen op uit environment variabelen
    const mollieApiKey = process.env.NEXT_PUBLIC_MOLLIE_API_KEY || process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY;
    const mollieTestMode = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true';
    
    if (!mollieApiKey) {
      return NextResponse.json({
        success: false,
        message: 'Mollie API key is niet geconfigureerd',
        details: {
          hasApiKey: false,
          testMode: mollieTestMode,
          status: 'API key ontbreekt'
        }
      }, { status: 400 })
    }

    // Maak Mollie client aan met de officiële library
    const mollieClient = createMollieClient({ apiKey: mollieApiKey });

    // Haal iDEAL methode op
    const method = await mollieClient.methods.get('ideal');
    
    // Haal banken op met de officiële library
    const issuers = await mollieClient.methods.get('ideal', { include: 'issuers' });
    const banks = issuers.issuers || [];

    return NextResponse.json({
      success: true,
      message: 'iDEAL banken succesvol opgehaald',
      details: {
        hasApiKey: true,
        testMode: mollieTestMode,
        methodId: method.id,
        methodName: method.description,
        banksCount: banks.length,
        status: 'Succesvol'
      },
      banks: banks
    });

  } catch (error) {
    console.error('Error fetching iDEAL banks:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Interne server fout bij ophalen van iDEAL banken',
      details: {
        hasApiKey: true,
        testMode: process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true',
        error: error instanceof Error ? error.message : 'Onbekende fout',
        status: 'Server fout'
      }
    }, { status: 500 })
  }
}
