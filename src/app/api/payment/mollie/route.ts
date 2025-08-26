import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, description, redirectUrl, webhookUrl, metadata, methods } = body;

    // Valideer verplichte velden
    if (!amount || !currency || !description || !redirectUrl) {
      return NextResponse.json({ 
        success: false, 
        message: 'Verplichte velden ontbreken' 
      }, { status: 400 });
    }

    // Haal Mollie API key op uit environment variables
    const isTestMode = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true';
    const apiKey = isTestMode 
      ? process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY 
      : process.env.NEXT_PUBLIC_MOLLIE_API_KEY;
    
    const profileId = process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mollie API key niet geconfigureerd' 
      }, { status: 500 });
    }

    // Maak Mollie betaling aan
    const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: {
          currency: currency,
          value: (amount / 100).toFixed(2) // Mollie verwacht bedrag in centen
        },
        description: description,
        redirectUrl: redirectUrl,
        webhookUrl: webhookUrl,
        metadata: metadata,
        methods: methods || ['ideal', 'bancontact', 'paypal'],
        profileId: profileId
      })
    });

    if (!mollieResponse.ok) {
      const error = await mollieResponse.json().catch(() => ({}));
      console.error('Mollie API error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Fout bij aanmaken Mollie betaling' 
      }, { status: 500 });
    }

    const payment = await mollieResponse.json();
    
    return NextResponse.json({
      success: true,
      checkoutUrl: payment._links.checkout.href,
      paymentId: payment.id
    });

  } catch (error) {
    console.error('Error creating Mollie payment:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het aanmaken van de betaling' 
    }, { status: 500 });
  }
}
