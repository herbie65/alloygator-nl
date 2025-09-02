import { NextRequest, NextResponse } from 'next/server'

// Webhook endpoint voor Mollie payment updates
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
      ? process.env.MOLLIE_TEST_API_KEY  // Geen NEXT_PUBLIC_ voor server-side!
      : process.env.MOLLIE_API_KEY;
    
    const profileId = process.env.MOLLIE_PROFILE_ID; // Geen NEXT_PUBLIC_ voor server-side!

    if (!apiKey) {
      console.error('Mollie API key missing. Test mode:', isTestMode);
      return NextResponse.json({ 
        success: false, 
        message: 'Mollie API key niet geconfigureerd' 
      }, { status: 500 });
    }

    // FIX: Amount is al in euro's, niet in centen!
    const mollieAmount = parseFloat(amount.toString()).toFixed(2);

    console.log('Creating Mollie payment:', {
      amount: mollieAmount,
      currency,
      description,
      redirectUrl,
      isTestMode
    });

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
          value: mollieAmount // Direct gebruiken - al in euro's
        },
        description: description,
        redirectUrl: redirectUrl,
        webhookUrl: webhookUrl,
        metadata: metadata || {},
        methods: methods && methods.length > 0 ? methods : ['ideal', 'bancontact', 'paypal', 'creditcard']
      })
    });

    const responseText = await mollieResponse.text();
    console.log('Mollie API response status:', mollieResponse.status);
    console.log('Mollie API response:', responseText);

    if (!mollieResponse.ok) {
      console.error('Mollie API error:', responseText);
      return NextResponse.json({ 
        success: false, 
        message: `Fout bij aanmaken Mollie betaling: ${responseText}` 
      }, { status: 500 });
    }

    const payment = JSON.parse(responseText);
    
    // Controleer of checkout link bestaat
    if (!payment._links?.checkout?.href) {
      console.error('No checkout URL in Mollie response:', payment);
      return NextResponse.json({ 
        success: false, 
        message: 'Geen checkout URL ontvangen van Mollie' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: payment._links.checkout.href,
      paymentId: payment.id,
      status: payment.status
    });

  } catch (error) {
    console.error('Error creating Mollie payment:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}

// GET endpoint voor het ophalen van payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment ID is verplicht' 
      }, { status: 400 });
    }

    const isTestMode = process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true';
    const apiKey = isTestMode 
      ? process.env.MOLLIE_TEST_API_KEY 
      : process.env.MOLLIE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mollie API key niet geconfigureerd' 
      }, { status: 500 });
    }

    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mollieResponse.ok) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment niet gevonden' 
      }, { status: 404 });
    }

    const payment = await mollieResponse.json();
    
    return NextResponse.json({
      success: true,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het ophalen van de betaling' 
    }, { status: 500 });
  }
}