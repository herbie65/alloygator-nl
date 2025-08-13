import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

// Mollie API configuration
const MOLLIE_API_URL = 'https://api.mollie.com/v2'

async function getMollieApiKey(): Promise<string> {
  // Prefer env var; fallback to settings in Firestore
  const envKey = process.env.MOLLIE_API_KEY
  if (envKey && envKey.trim().length > 0) return envKey
  try {
    const settingsArray = await FirebaseService.getSettings()
    if (settingsArray && settingsArray.length > 0) {
      const s = settingsArray[0] as any
      return s.mollieApiKey || s.mollie_api_key || 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
  } catch {}
  return 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, redirectUrl, webhookUrl, metadata, methods } = body

    // Validate required fields
    if (!amount || !currency || !description || !redirectUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create payment request to Mollie
    const paymentData = {
      amount: {
        currency: currency.toUpperCase(),
        value: amount.toFixed(2) // Mollie expects amount in cents as string
      },
      description,
      redirectUrl,
      webhookUrl,
      metadata: metadata || {},
      methods: Array.isArray(methods) && methods.length > 0 ? methods : ['ideal'],
      locale: 'nl_NL'
    }

    const apiKey = await getMollieApiKey()

    // Development/local simulation: always simulate on localhost or when simulate=1 present
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || (redirectUrl && redirectUrl.includes('localhost'))
    const wantsSim = !!(redirectUrl && redirectUrl.includes('simulate=1'))
    if (isLocal || wantsSim) {
      console.log('🔧 Localhost/Simulation mode: Simulating Mollie payment')
      console.log('📊 Payment data:', {
        amount: amount,
        currency: currency,
        description: description,
        methods: methods,
        redirectUrl: redirectUrl
      })

      const simulatedCheckoutUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}simulate=1`

      // Simulate different payment statuses for testing
      const testStatuses = ['open', 'pending', 'paid', 'failed']
      const randomStatus = testStatuses[Math.floor(Math.random() * testStatuses.length)]

      return NextResponse.json({
        id: 'tr_test_simulated',
        status: randomStatus,
        checkoutUrl: simulatedCheckoutUrl,
        simulated: true,
        testData: {
          amount: amount,
          currency: currency,
          description: description,
          methods: methods
        }
      })
    }

    const response = await fetch(`${MOLLIE_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      let errorBody: any = null
      try { errorBody = await response.json() } catch { errorBody = await response.text() }
      console.error('Mollie API error:', errorBody)
      return NextResponse.json(
        { error: 'Failed to create payment', details: errorBody },
        { status: response.status }
      )
    }

    const payment = await response.json()

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      checkoutUrl: payment.links?.checkout?.href,
      webhookUrl: payment.links?.webhookUrl?.href
    })

  } catch (error) {
    console.error('Error creating Mollie payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing payment ID' },
        { status: 400 }
      )
    }

    // Get payment status from Mollie
    const apiKey = await getMollieApiKey()

    const response = await fetch(`${MOLLIE_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mollie API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get payment status' },
        { status: response.status }
      )
    }

    const payment = await response.json()

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      cancelledAt: payment.cancelledAt,
      expiredAt: payment.expiredAt,
      failedAt: payment.failedAt
    })

  } catch (error) {
    console.error('Error getting payment status:', error)
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}
