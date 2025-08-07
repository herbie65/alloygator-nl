import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { orderData, customerEmail } = await request.json()

    if (!orderData || !customerEmail) {
      return NextResponse.json(
        { error: 'Order data en customer email zijn verplicht' },
        { status: 400 }
      )
    }

    // TODO: Integrate with real email service (SendGrid, Mailgun, etc.)
    // For now, we'll simulate email sending
    
    console.log('📧 Order confirmation email would be sent to:', customerEmail)
    console.log('📦 Order details:', JSON.stringify(orderData, null, 2))

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully',
      orderNumber: orderData.orderNumber
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het versturen van de email' },
      { status: 500 }
    )
  }
} 