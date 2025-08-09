import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { DHLService } from '@/lib/dhl'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postal_code')
    const country = searchParams.get('country') || 'NL'

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Postal code is required' },
        { status: 400 }
      )
    }

    // Get DHL settings from Firebase
    const settingsResponse = await FirebaseService.getSettings()
    if (!settingsResponse || settingsResponse.length === 0) {
      return NextResponse.json(
        { error: 'DHL settings not configured' },
        { status: 500 }
      )
    }

    const settings = settingsResponse[0]
    
    // Check if DHL is enabled
    if (!settings.enabledCarriers?.includes('dhl')) {
      return NextResponse.json(
        { error: 'DHL carrier not enabled' },
        { status: 400 }
      )
    }

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

    console.log('Getting DHL pickup locations for:', {
      postalCode,
      country,
      testMode: dhlSettings.testMode
    })

    const locations = await DHLService.getPickupLocations(
      postalCode,
      country,
      dhlSettings
    )

    return NextResponse.json({
      success: true,
      data: locations
    })
  } catch (error: any) {
    console.error('Error getting DHL pickup locations:', error)
    
    let errorMessage = 'Unknown error occurred'
    let statusCode = 500

    if (error.message.includes('DHL API key is invalid')) {
      errorMessage = 'DHL API key is invalid or expired'
      statusCode = 401
    } else if (error.message.includes('DHL API access denied')) {
      errorMessage = 'DHL API access denied'
      statusCode = 403
    } else if (error.message.includes('No pickup locations found')) {
      errorMessage = error.message
      statusCode = 404
    } else if (error.message.includes('Invalid request parameters')) {
      errorMessage = error.message
      statusCode = 400
    } else {
      errorMessage = error.message || 'Failed to get pickup locations'
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
