import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

export const dynamic = "force-static"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id

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
      return NextResponse.json({
        success: false,
        message: 'Mollie API key niet geconfigureerd'
      }, { status: 500 })
    }

    // Maak Mollie client aan met de officiële library
    const mollieClient = createMollieClient({ apiKey: mollieApiKey });

    // Haal betalingsstatus op van Mollie
    const payment = await mollieClient.payments.get(paymentId);

    return NextResponse.json({
      success: true,
      message: 'Betalingsstatus opgehaald',
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        description: payment.description,
        orderId: payment.metadata?.orderId,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        expiredAt: payment.expiredAt,
        canceledAt: payment.canceledAt,
        checkoutUrl: payment.getCheckoutUrl()
      }
    })

  } catch (error) {
    console.error('Error checking payment status:', error)
    return NextResponse.json({
      success: false,
      message: 'Interne server fout',
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
