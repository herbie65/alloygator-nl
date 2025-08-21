import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { DHLService } from '@/lib/dhl'

export async function GET(request: NextRequest) {
  try {
    // Get DHL settings from Firebase
    const settingsResponse = await FirebaseService.getSettings()
    if (!settingsResponse || settingsResponse.length === 0) {
      return NextResponse.json(
        { error: 'DHL settings not configured' },
        { status: 500 }
      )
    }

    const settings = settingsResponse[0]
    
    // Check if DHL API credentials are configured
    if (!settings.dhlApiUserId || !settings.dhlApiKey) {
      return NextResponse.json(
        { error: 'DHL API UserId and API Key are required' },
        { status: 500 }
      )
    }

    const dhlSettings = {
      apiUserId: settings.dhlApiUserId,
      apiKey: settings.dhlApiKey,
      accountId: settings.dhlAccountId || '',
      testMode: settings.dhlTestMode || true
    }

    console.log('Getting DHL services with test mode:', dhlSettings.testMode)

    const services = await DHLService.getServices(dhlSettings)

    return NextResponse.json({
      success: true,
      data: services
    })
  } catch (error: any) {
    console.error('Error getting DHL services:', error)
    
    let errorMessage = 'Unknown error occurred'
    let statusCode = 500

    if (error.message.includes('DHL API key is invalid')) {
      errorMessage = 'DHL API key is invalid or expired'
      statusCode = 401
    } else if (error.message.includes('DHL API access denied')) {
      errorMessage = 'DHL API access denied'
      statusCode = 403
    } else {
      errorMessage = error.message || 'Failed to get DHL services'
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message
      },
      { status: statusCode }
    )
  }
}
