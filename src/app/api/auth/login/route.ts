import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-static"
import { FirebaseClientService } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔍 Login attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'E-mail en wachtwoord zijn verplicht' 
      }, { status: 400 });
    }

    // Haal gebruiker op uit database
    console.log('🔍 Fetching customers from database...');
    const customers = await FirebaseClientService.getCustomersByEmail(email);
    console.log('🔍 Customers found:', customers ? customers.length : 0);
    
    if (!customers || customers.length === 0) {
      console.log('❌ No customers found for email:', email);
      return NextResponse.json({ 
        success: false, 
        message: 'Gebruiker niet gevonden' 
      }, { status: 401 });
    }

    const user = customers[0] as any; // Type as any to handle dynamic fields
    console.log('🔍 User found:', { 
      id: user.id, 
      email: user.email, 
      hasPassword: !!user.password,
      passwordField: user.password,
      userFields: Object.keys(user)
    });
    
    // Controleer of gebruiker een wachtwoord heeft
    if (!user.password) {
      console.log('❌ User has no password field, redirecting to password reset:', email);
      return NextResponse.json({ 
        success: false, 
        message: 'Dit account heeft nog geen wachtwoord ingesteld. Gebruik "Wachtwoord vergeten?" om een nieuw wachtwoord in te stellen.' 
      }, { status: 401 });
    }
    
    // Controleer wachtwoord
    if (user.password !== password) {
      console.log('❌ Password mismatch for user:', email);
      return NextResponse.json({ 
        success: false, 
        message: 'Onjuist wachtwoord' 
      }, { status: 401 });
    }

    console.log('✅ Login successful for user:', email);

    // Return gebruiker data
    return NextResponse.json({ 
      success: true, 
      message: 'Inloggen succesvol',
      user: {
        id: user.id || user.email,
        voornaam: user.first_name || user.voornaam || user.name || '',
        achternaam: user.last_name || user.achternaam || '',
        email: user.email,
        telefoon: user.phone || user.telefoon || '',
        adres: user.address || user.adres || '',
        postcode: user.postal_code || user.postcode || '',
        plaats: user.city || user.plaats || '',
        land: user.country || user.land || 'Nederland',
        company_name: user.company_name || user.company || user.name || '',
        invoice_email: user.invoice_email || user.email,
        vat_number: user.vat_number || '',
        separate_shipping_address: !!user.separate_shipping_address,
        shipping_address: user.shipping_address || '',
        shipping_postal_code: user.shipping_postal_code || '',
        shipping_city: user.shipping_city || '',
        shipping_country: user.shipping_country || '',
        is_dealer: !!user.is_dealer,
        dealer_group: user.dealer_group || ''
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Er is een fout opgetreden. Probeer het later opnieuw.' 
    }, { status: 500 });
  }
}
