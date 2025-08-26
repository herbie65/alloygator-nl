import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Haal Mollie instellingen op uit environment variabelen
    const mollieLiveApiKey = process.env.NEXT_PUBLIC_MOLLIE_API_KEY
    const mollieTestApiKey = process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY
    const mollieTestMode = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true'
    const mollieProfileId = process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID
    
    // Kies de juiste API key op basis van test mode
    const mollieApiKey = mollieTestMode ? mollieTestApiKey : mollieLiveApiKey

    // Controleer of de API key is geconfigureerd
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

    // Test Mollie API verbinding door een eenvoudige request te doen
    const testUrl = mollieTestMode 
      ? 'https://api.mollie.com/v2/methods' // Test URL
      : 'https://api.mollie.com/v2/methods' // Productie URL (zelfde endpoint)

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mollieApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: '✅ Mollie API verbinding succesvol!',
        details: {
          status: response.status,
          testMode: mollieTestMode,
          hasApiKey: true,
          methodsCount: data._embedded?.methods?.length || 0,
          note: 'Betaalmethodes succesvol opgehaald van Mollie API'
        }
      })
    } else if (response.status === 401) {
      return NextResponse.json({
        success: false,
        message: '❌ Mollie API key is ongeldig of verlopen',
        details: {
          status: response.status,
          testMode: mollieTestMode,
          hasApiKey: true,
          error: 'Unauthorized - API key is ongeldig'
        }
      }, { status: 401 })
    } else {
      const errorData = await response.text()
      return NextResponse.json({
        success: false,
        message: `❌ Mollie API fout: HTTP ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          testMode: mollieTestMode,
          hasApiKey: true,
          error: errorData
        }
      }, { status: response.status })
    }

  } catch (error) {
    console.error('Error testing Mollie API:', error)
    return NextResponse.json({
      success: false,
      message: '❌ Fout bij testen van Mollie API. Controleer je internetverbinding.',
      details: {
        error: error instanceof Error ? error.message : 'Onbekende fout',
        hasApiKey: !!process.env.NEXT_PUBLIC_MOLLIE_API_KEY,
        testMode: process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true'
      }
    }, { status: 500 })
  }
}
