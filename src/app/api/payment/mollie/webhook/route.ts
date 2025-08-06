import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'
import { FirebaseService } from '@/lib/firebase'

// Initialize Mollie client
const mollieClient = createMollieClient({ 
  apiKey: process.env.MOLLIE_API_KEY || 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: paymentId } = body

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID required' },
        { status: 400 }
      )
    }

    // Get payment details from Mollie
    const payment = await mollieClient.payments.get(paymentId)
    
    // Extract order information from metadata
    const { orderId, customerId } = payment.metadata || {}
    
    if (!orderId) {
      console.error('No order ID found in payment metadata')
      return NextResponse.json(
        { success: false, error: 'Order ID not found' },
        { status: 400 }
      )
    }

    // Update order status based on payment status
    let orderStatus = 'nieuw'
    let paymentStatus = 'pending'

    switch (payment.status) {
      case 'paid':
        orderStatus = 'betaald'
        paymentStatus = 'paid'
        break
      case 'failed':
        orderStatus = 'geannuleerd'
        paymentStatus = 'failed'
        break
      case 'expired':
        orderStatus = 'geannuleerd'
        paymentStatus = 'expired'
        break
      case 'cancelled':
        orderStatus = 'geannuleerd'
        paymentStatus = 'cancelled'
        break
      default:
        orderStatus = 'nieuw'
        paymentStatus = 'pending'
    }

    // Update order in Firebase
    try {
      await FirebaseService.updateOrder(orderId, {
        payment_status: paymentStatus,
        payment_id: paymentId,
        status: orderStatus,
        updated_at: new Date().toISOString()
      })

      console.log(`Order ${orderId} updated with status: ${orderStatus}`)

      // If payment is successful, send confirmation email
      if (payment.status === 'paid') {
        await sendOrderConfirmationEmail(orderId, customerId)
      }

    } catch (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function sendOrderConfirmationEmail(orderId: string, customerId: string) {
  try {
    // Get order and customer details
    const order = await FirebaseService.getOrderById(orderId)
    const customer = await FirebaseService.getCustomerById(customerId)

    if (!order || !customer) {
      console.error('Order or customer not found for email confirmation')
      return
    }

    // TODO: Implement email sending logic
    // This could use SendGrid, Mailgun, or Firebase Functions
    console.log(`Sending confirmation email for order ${orderId} to ${customer.email}`)

    // For now, just log the confirmation
    console.log('Order confirmation email would be sent here')

  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
} 