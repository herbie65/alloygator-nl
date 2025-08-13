import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'

const emailService = new EmailService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      customerEmail,
      customerName,
      paymentMethod,
      paymentStatus,
      total,
      createdAt,
      dueAt
    } = body

    // Validate required fields
    if (!orderNumber || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get payment method display name
    const getPaymentMethodName = (method: string) => {
      switch (method) {
        case 'cash': return 'Contant 💰'
        case 'pin': return 'Pinnen 💳'
        case 'invoice': return 'Op rekening 📄'
        default: return method
      }
    }

    // Send payment confirmation email
    await emailService.sendPaymentConfirmation(
      customerEmail,
      {
        orderNumber,
        customerName,
        paymentMethod: getPaymentMethodName(paymentMethod),
        paymentStatus,
        total: total?.toFixed(2) || '0.00',
        paymentDate: new Date().toLocaleDateString('nl-NL'),
        orderDate: createdAt ? new Date(createdAt).toLocaleDateString('nl-NL') : 'Onbekend'
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Payment confirmation email sent successfully' 
    })

  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send payment confirmation email' },
      { status: 500 }
    )
  }
}
