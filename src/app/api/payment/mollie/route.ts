import { NextRequest, NextResponse } from 'next/server'

// Mollie API configuration
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY || 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
const MOLLIE_API_URL = 'https://api.mollie.com/v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, redirectUrl, webhookUrl, metadata } = body

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
      methods: ['ideal', 'creditcard', 'banktransfer'], // Supported payment methods
      locale: 'nl_NL'
    }

    const response = await fetch(`${MOLLIE_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mollie API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to create payment' },
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
    const response = await fetch(`${MOLLIE_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
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
