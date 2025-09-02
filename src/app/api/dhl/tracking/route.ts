import { NextRequest, NextResponse } from 'next/server'
import { DHLService } from '@/lib/dhl'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('trackingNumber')
    
    if (!trackingNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tracking number is verplicht' 
      }, { status: 400 })
    }

    // Haal DHL instellingen op uit environment variabelen
    const dhlSettings = {
      apiUserId: process.env.NEXT_PUBLIC_DHL_API_USER_ID,
      apiKey: process.env.NEXT_PUBLIC_DHL_API_KEY,
      accountId: process.env.NEXT_PUBLIC_DHL_ACCOUNT_ID,
      testMode: process.env.NEXT_PUBLIC_DHL_TEST_MODE === 'true'
    }

    // Controleer of alle vereiste instellingen aanwezig zijn
    if (!dhlSettings.apiUserId || !dhlSettings.apiKey || !dhlSettings.accountId) {
      return NextResponse.json({
        success: false,
        error: 'DHL API instellingen zijn niet volledig geconfigureerd'
      }, { status: 400 })
    }

    // Haal DHL verzending status op
    const trackingResult = await DHLService.getShipmentStatus(trackingNumber, dhlSettings)
    
    return NextResponse.json({
      success: true,
      trackingNumber,
      status: trackingResult.status,
      details: trackingResult
    })

  } catch (error) {
    console.error('Error getting DHL tracking status:', error)
    return NextResponse.json({
      success: false,
      error: 'Fout bij ophalen DHL tracking status',
      details: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
