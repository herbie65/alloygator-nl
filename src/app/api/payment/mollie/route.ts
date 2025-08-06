import { NextRequest, NextResponse } from 'next/server'

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

    // For now, simulate Mollie payment creation
    // TODO: Implement actual Mollie API integration
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('Creating payment:', {
      amount,
      description,
      orderId,
      customerId
    })

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      checkoutUrl: redirectUrl, // For now, redirect directly
      status: 'open'
    })

  } catch (error) {
    console.error('Payment creation error:', error)
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

    // For now, simulate payment status
    // TODO: Implement actual Mollie API call
    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      status: 'paid', // Simulate successful payment
      amount: { currency: 'EUR', value: '0.00' },
      description: 'Test payment'
    })

  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment status' 
      },
      { status: 500 }
    )
  }
} 