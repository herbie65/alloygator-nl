import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

export const dynamic = "force-static"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, orderId, redirectUrl, webhookUrl, cardToken, idealIssuer } = body

    // Haal Mollie instellingen op uit environment variabelen
    const mollieApiKey = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true' 
      ? process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY 
      : process.env.NEXT_PUBLIC_MOLLIE_API_KEY
    const mollieProfileId = process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID

    if (!mollieApiKey) {
      return NextResponse.json({
        success: false,
        message: 'Mollie API key niet geconfigureerd'
      }, { status: 400 })
    }

    if (!mollieProfileId) {
      return NextResponse.json({
        success: false,
        message: 'Mollie Profile ID niet geconfigureerd'
      }, { status: 400 })
    }

    // Maak Mollie client aan met de officiële library
    const mollieClient = createMollieClient({ apiKey: mollieApiKey });

    // Maak betalingsdata object
    const paymentData: any = {
      amount: {
        currency: currency || 'EUR',
        value: amount.toString()
      },
      description: description || `Bestelling ${orderId}`,
      redirectUrl: redirectUrl,
      webhookUrl: webhookUrl,
      profileId: mollieProfileId,
      metadata: {
        orderId: orderId
      }
    };

    // Voeg card token toe als deze beschikbaar is (voor creditcard betalingen)
    if (cardToken) {
      paymentData.method = 'creditcard';
      paymentData.cardToken = cardToken;
    }
    
    // Voeg iDEAL issuer toe als deze beschikbaar is
    if (idealIssuer) {
      paymentData.method = 'ideal';
      paymentData.issuer = idealIssuer;
    }

    // Maak betaling aan met de officiële library
    const payment = await mollieClient.payments.create(paymentData);

    return NextResponse.json({
      success: true,
      message: 'Betaling succesvol aangemaakt',
      payment: {
        id: payment.id,
        status: payment.status,
        checkoutUrl: payment.getCheckoutUrl(),
        orderId: orderId
      }
    })

  } catch (error) {
    console.error('Error creating Mollie payment:', error)
    return NextResponse.json({
      success: false,
      message: 'Interne server fout',
      error: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
