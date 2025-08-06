import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

// Initialize Mollie client
const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY || 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      description, 
      redirectUrl, 
      webhookUrl, 
      metadata,
      customerId,
      orderId 
    } = body

    // Create payment
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2) // Mollie expects amount in cents
      },
      description: description,
      redirectUrl: redirectUrl,
      webhookUrl: webhookUrl,
      metadata: {
        orderId: orderId,
        customerId: customerId,
        ...metadata
      },
      methods: ['ideal', 'creditcard', 'banktransfer'],
      locale: 'nl_NL'
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      checkoutUrl: payment.getCheckoutUrl(),
      status: payment.status
    })

  } catch (error) {
    console.error('Mollie payment error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Payment creation failed' 
      },
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
        { success: false, error: 'Payment ID required' },
        { status: 400 }
      )
    }

    // Get payment status
    const payment = await mollieClient.payments.get(paymentId)

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    })

  } catch (error) {
    console.error('Mollie payment status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment status' 
      },
      { status: 500 }
    )
  }
} 