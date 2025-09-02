import { NextRequest, NextResponse } from 'next/server'
import { DHLService } from '@/lib/dhl'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is verplicht' 
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

    // Genereer DHL verzendlabel
    const labelResult = await DHLService.generateLabel(orderId, dhlSettings)
    
    return NextResponse.json({
      success: true,
      message: 'DHL verzendlabel succesvol gegenereerd',
      labelUrl: labelResult.labelUrl,
      trackingNumber: labelResult.trackingNumber
    })

  } catch (error) {
    console.error('Error generating DHL label:', error)
    return NextResponse.json({
      success: false,
      error: 'Fout bij genereren DHL verzendlabel',
      details: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
