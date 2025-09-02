import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

// POST endpoint voor het aanmaken van een nieuwe Mollie betaling
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
      ? process.env.MOLLIE_TEST_API_KEY  // Server-side alleen (geen NEXT_PUBLIC_)
      : process.env.MOLLIE_API_KEY;
    
    // FIX: Profile ID moet ook server-side zijn (geen NEXT_PUBLIC_)
    const profileId = process.env.MOLLIE_PROFILE_ID;

    if (!apiKey) {
      console.error('Mollie API key missing. Test mode:', isTestMode);
      return NextResponse.json({ 
        success: false, 
        message: 'Mollie API key niet geconfigureerd' 
      }, { status: 500 });
    }

    // Amount is al in euro's, niet in centen
    const mollieAmount = parseFloat(amount.toString()).toFixed(2);

    console.log('Creating Mollie payment:', {
      amount: mollieAmount,
      currency,
      description,
      redirectUrl,
      isTestMode,
      profileId: profileId ? 'configured' : 'not configured'
    });

    // Bereid payment payload voor
    const paymentData: any = {
      amount: {
        currency: currency,
        value: mollieAmount
      },
      description: description,
      redirectUrl: redirectUrl,
      metadata: metadata || {}
    };

    // Voeg optionele velden toe
    if (webhookUrl) {
      paymentData.webhookUrl = webhookUrl;
    }

    if (profileId) {
      paymentData.profileId = profileId;
    }

    // Filter lege/onbekende payment methods
    if (methods && Array.isArray(methods) && methods.length > 0) {
      const validMethods = methods.filter(method => 
        ['ideal', 'bancontact', 'paypal', 'creditcard', 'sofort', 'giropay', 'eps'].includes(method)
      );
      if (validMethods.length > 0) {
        paymentData.methods = validMethods;
      }
    }

    // Maak Mollie betaling aan
    const mollieResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const responseText = await mollieResponse.text();
    console.log('Mollie API response status:', mollieResponse.status);

    if (!mollieResponse.ok) {
      console.error('Mollie API error:', responseText);
      let errorMessage = 'Onbekende fout bij Mollie';
      
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.title) {
          errorMessage = errorData.title;
        }
      } catch (e) {
        errorMessage = responseText;
      }

      return NextResponse.json({ 
        success: false, 
        message: `Mollie fout: ${errorMessage}` 
      }, { status: mollieResponse.status });
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

    console.log('Mollie payment created successfully:', payment.id);

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
      console.error('Mollie API key missing for GET request');
      return NextResponse.json({ 
        success: false, 
        message: 'Mollie API key niet geconfigureerd' 
      }, { status: 500 });
    }

    console.log('Fetching payment status for:', paymentId);

    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mollieResponse.ok) {
      const errorText = await mollieResponse.text();
      console.error('Mollie payment fetch error:', errorText);
      return NextResponse.json({ 
        success: false, 
        message: 'Payment niet gevonden bij Mollie' 
      }, { status: 404 });
    }

    const payment = await mollieResponse.json();
    console.log('Payment status retrieved:', payment.status);
    
    // Update order status in Firebase als betaling is voltooid
    if (payment.status === 'paid' && payment.metadata?.orderId) {
      try {
        await FirebaseService.updateOrder(payment.metadata.orderId, {
          payment_status: 'paid',
          status: 'processing',
          mollie_payment_id: payment.id,
          paid_at: new Date().toISOString()
        });
        console.log('Order updated after successful payment:', payment.metadata.orderId);
      } catch (error) {
        console.error('Failed to update order after payment:', error);
        // Don't fail the request if order update fails
      }
    }
    
    return NextResponse.json({
      success: true,
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      metadata: payment.metadata
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error bij ophalen payment status' 
    }, { status: 500 });
  }
}