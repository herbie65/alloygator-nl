import { NextResponse } from 'next/server'
export const dynamic = "force-static"

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Google Maps API key niet geconfigureerd' 
      }, { status: 400 })
    }
    
    // Test de Google Maps API key door een eenvoudige geocoding request te doen
    const testAddress = 'Amsterdam, Netherlands'
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`
    
    const response = await fetch(testUrl)
    const data = await response.json()
    
    if (data.status === 'OK') {
      return NextResponse.json({ 
        ok: true, 
        message: '✅ Google Maps API key werkt correct! Verbinding succesvol.',
        details: {
          status: data.status,
          results: data.results?.length || 0,
          testAddress: testAddress
        }
      })
    } else if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json({ 
        ok: false, 
        message: '❌ Google Maps API key geweigerd. Controleer of de key correct is en de juiste APIs zijn geactiveerd.',
        details: {
          status: data.status,
          error: data.error_message || 'Onbekende fout'
        }
      }, { status: 400 })
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      return NextResponse.json({ 
        ok: false, 
        message: '⚠️ Google Maps API quotum overschreden. Probeer het later opnieuw.',
        details: {
          status: data.status
        }
      }, { status: 429 })
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: `❌ Google Maps API fout: ${data.status}`,
        details: {
          status: data.status,
          error: data.error_message || 'Onbekende fout'
        }
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error testing Google Maps API:', error)
    return NextResponse.json({ 
      ok: false, 
      message: '❌ Fout bij testen van Google Maps API. Controleer je internetverbinding.',
      details: {
        error: error instanceof Error ? error.message : 'Onbekende fout'
      }
    }, { status: 500 })
  }
}
