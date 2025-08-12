import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { DHLService } from '@/lib/dhl'

export async function POST(request: NextRequest) {
  try {
    const { apiUserId, apiKey, accountId, testMode } = await request.json()

    if (!apiUserId || !apiKey) {
      return NextResponse.json(
        { error: 'DHL API UserId and API Key are required' },
        { status: 400 }
      )
    }

    const dhlSettings = {
      apiUserId,
      apiKey,
      accountId: accountId || '',
      testMode: testMode || true
    }

    console.log('Testing DHL eCommerce authentication with:', {
      apiUserId: dhlSettings.apiUserId,
      apiKey: dhlSettings.apiKey.substring(0, 10) + '...',
      accountId: dhlSettings.accountId,
      testMode: dhlSettings.testMode
    })

    // Test authentication by trying to get services
    const services = await DHLService.getServices(dhlSettings)

    return NextResponse.json({
      success: true,
      message: 'DHL eCommerce authentication successful',
      data: {
        servicesFound: services.length,
        testMode: dhlSettings.testMode,
        apiUrl: 'https://api-gw.dhlparcel.nl'
      }
    })
  } catch (error: any) {
    console.error('DHL authentication test failed:', error)
    
    let errorMessage = 'Unknown error occurred'
    let statusCode = 500

    if (error.message.includes('DHL API credentials are invalid')) {
      errorMessage = 'DHL API credentials are invalid or expired'
      statusCode = 401
    } else if (error.message.includes('DHL API access denied')) {
      errorMessage = 'DHL API access denied'
      statusCode = 403
    } else if (error.message.includes('API UserId and API Key are required')) {
      errorMessage = 'DHL API UserId and API Key are required'
      statusCode = 400
    } else {
      errorMessage = error.message || 'Authentication test failed'
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
