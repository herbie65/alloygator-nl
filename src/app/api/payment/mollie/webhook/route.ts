import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '../../../../../lib/firebase'

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

    // For now, simulate payment processing
    // TODO: Implement actual Mollie webhook processing
    console.log('Processing webhook for payment:', paymentId)

    // Simulate order update
    try {
      // Extract order ID from payment ID (in real implementation, get from metadata)
      const orderId = paymentId.split('_')[1] // Simple extraction for demo
      
      if (orderId) {
        await FirebaseService.updateOrder(orderId, {
          payment_status: 'paid',
          payment_id: paymentId,
          status: 'betaald',
          updated_at: new Date().toISOString()
        })

        console.log(`Order ${orderId} updated with status: betaald`)
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