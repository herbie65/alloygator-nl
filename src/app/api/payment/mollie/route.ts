import { NextRequest, NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'



export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, description, orderId, redirectUrl, webhookUrl, cardToken, idealIssuer } = body
    
    console.log('Mollie payment request:', { amount, currency, description, orderId, amountType: typeof amount })

    // Haal Mollie instellingen op uit environment variabelen
    const mollieApiKey = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true' 
      ? process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY 
      : process.env.NEXT_PUBLIC_MOLLIE_API_KEY



    if (!mollieApiKey) {
      return NextResponse.json({
        success: false,
        message: 'Mollie API key niet geconfigureerd'
      }, { status: 400 })
    }





    // Maak Mollie client aan met de officiële library
    const mollieClient = createMollieClient({ apiKey: mollieApiKey });

    // Converteer bedrag naar Mollie formaat (XX.XX als string)
    const amountFormatted = parseFloat(amount).toFixed(2);
    
    // Maak betalingsdata object volgens Mollie API specificatie
    const paymentData: any = {
      amount: {
        currency: currency || 'EUR',
        value: amountFormatted
      },
      description: description || `Bestelling ${orderId}`,
      redirectUrl: redirectUrl,
      webhookUrl: webhookUrl,
      metadata: {
        orderId: orderId
      }
    };
    
    // Valideer dat het bedrag een geldig nummer is
    if (!paymentData.amount.value || isNaN(paymentData.amount.value)) {
      return NextResponse.json({
        success: false,
        message: 'Ongeldig bedrag formaat',
        error: `Bedrag moet een geldig nummer zijn, ontvangen: ${amount}`
      }, { status: 400 })
    }
    
    // Valideer webhook URL (moet Vercel domein zijn)
    if (webhookUrl && !webhookUrl.includes('alloygator-nl.vercel.app')) {
      return NextResponse.json({
        success: false,
        message: 'Ongeldige webhook URL',
        error: 'Webhook URL moet het Vercel domein gebruiken'
      }, { status: 400 })
    }
    
    console.log('Payment data being sent to Mollie:', paymentData);
    console.log('Amount details:', { 
      original: amount, 
      parsed: parseFloat(amount), 
      formatted: amountFormatted,
      final: paymentData.amount.value 
    });

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

// GET endpoint voor het ophalen van payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        message: 'Payment ID is verplicht'
      }, { status: 400 })
    }

    const isTestMode = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true'
    const apiKey = isTestMode 
      ? process.env.MOLLIE_TEST_API_KEY 
      : process.env.MOLLIE_API_KEY

    if (!apiKey) {
      console.error('Mollie API key missing for GET request')
      return NextResponse.json({
        success: false,
        message: 'Mollie API key niet geconfigureerd'
      }, { status: 500 })
    }

    console.log('Fetching payment status for:', paymentId)

    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mollieResponse.ok) {
      const errorText = await mollieResponse.text()
      console.error('Mollie payment fetch error:', errorText)
      return NextResponse.json({
        success: false,
        message: 'Payment niet gevonden bij Mollie'
      }, { status: 404 })
    }

    const payment = await mollieResponse.json()
    console.log('Payment status retrieved:', payment.status)
    
    return NextResponse.json({
      success: true,
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    })

  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({
      success: false,
      message: 'Server error bij ophalen payment status'
    }, { status: 500 })
  }
}
