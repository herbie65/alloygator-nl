import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = "force-static"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const paymentId = request.nextUrl.searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID ontbreekt'
      }, { status: 400 })
    }

    // Haal Mollie API key op
    const mollieApiKey = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true' 
      ? process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY 
      : process.env.NEXT_PUBLIC_MOLLIE_API_KEY

    if (!mollieApiKey) {
      console.error('Mollie API key niet geconfigureerd')
      return NextResponse.json({
        success: false,
        message: 'API key niet geconfigureerd'
      }, { status: 500 })
    }

    // Maak Mollie client aan met de officiële library
    const mollieClient = createMollieClient({ apiKey: mollieApiKey });

    // Haal betalingsstatus op van Mollie
    const payment = await mollieClient.payments.get(paymentId);
    const orderId = payment.metadata?.orderId;
    const status = payment.status;

    if (!orderId) {
      console.error('Order ID ontbreekt in betalingsmetadata')
      return NextResponse.json({
        success: false,
        message: 'Order ID ontbreekt'
      }, { status: 400 })
    }

    // Update order status in database
    try {
      await FirebaseService.updateOrderStatus(orderId, {
        payment_status: status,
        payment_id: paymentId,
        payment_method: 'mollie',
        updated_at: new Date().toISOString()
      })

      console.log(`Order ${orderId} status bijgewerkt naar: ${status}`)

      // Stuur e-mail notificatie bij succesvolle betaling
      if (status === 'paid') {
        // Hier kun je e-mail notificatie toevoegen
        console.log(`Betaling succesvol voor order ${orderId}`)
      }

    } catch (dbError) {
      console.error('Fout bij bijwerken order status:', dbError)
      // Log de fout maar return success om Mollie te laten weten dat de webhook is ontvangen
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook verwerkt',
      orderId: orderId,
      status: status
    })

  } catch (error) {
    console.error('Error processing Mollie webhook:', error)
    return NextResponse.json({
      success: false,
      message: 'Interne server fout',
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
