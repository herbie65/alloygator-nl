import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';
import { 
  openSession, 
  closeSession, 
  addRelatie, 
  addMemoriaal 
} from '@/services/accounting/eboekhouden';
import { mapOrderToBookings, mapOrderToBookingsFlexible, validateBookingBalance, normalizeOrderForAccounting } from '@/services/accounting/orderToBookings';

export async function POST(request: NextRequest) {
  let orderId: string;
  
  try {
    const body = await request.json();
    orderId = body.orderId;
    
    if (!orderId) {
      return NextResponse.json(
        { ok: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Haal order en klant op uit Firestore
    const orderData = await FirebaseService.getDocument('orders', orderId);
    if (!orderData) {
      return NextResponse.json(
        { ok: false, message: 'Order niet gevonden' },
        { status: 404 }
      );
    }

    const order = orderData as any;
    
    // Controleer of order betaald is
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { ok: false, message: 'Order is nog niet betaald' },
        { status: 400 }
      );
    }

    // Haal klant op
    let customerData = order.customer_id 
      ? await FirebaseService.getDocument('customers', order.customer_id) 
      : null;
    // Fallback: probeer klant te vinden op e-mail als customer_id ontbreekt
    if (!customerData && order.customer?.email) {
      const byEmail = await FirebaseService.getDocuments('customers', [{ field: 'email', operator: '==', value: order.customer.email }]);
      if (Array.isArray(byEmail) && byEmail.length) customerData = byEmail[0];
    }
    if (!customerData) {
      return NextResponse.json(
        { ok: false, message: 'Klant niet gevonden' },
        { status: 404 }
      );
    }

    const customer = customerData as any;

    // Open e-Boekhouden sessie
    const sessionId = await openSession();
    
    try {
      // Voeg/update klant als relatie
      const relatieResult = await addRelatie(sessionId, {
        Code: customer.id,
        Bedrijf: customer.company_name,
        Email: customer.email,
        BP: customer.company_name ? 'B' : 'P',
        Adres: customer.address,
        Postcode: customer.postal_code,
        Plaats: customer.city
      });

      // Map order naar boekingsregels
      // Gebruik flexibele mapper die wisselende schemas en quantities ondersteunt
      const normalized = normalizeOrderForAccounting(order);
      const bookings = mapOrderToBookingsFlexible(normalized, customer);
      
      // Valideer dat debet = credit
      if (!validateBookingBalance(bookings.verkoop.regels)) {
        throw new Error('Verkoop boekingen zijn niet in balans');
      }
      
      if (!validateBookingBalance(bookings.cogsVoorraad.regels)) {
        throw new Error('COGS/Voorraad boekingen zijn niet in balans');
      }

      // Maak verkoop boeking
      const verkoopResult = await addMemoriaal(sessionId, bookings.verkoop);
      
      // Maak COGS/Voorraad boeking
      const cogsVoorraadResult = await addMemoriaal(sessionId, bookings.cogsVoorraad);

      // Sla sync resultaat op in Firebase
      const syncResult = {
        order_id: orderId,
        session_id: sessionId,
        verkoop_mutatie_id: verkoopResult.mutatienummer,
        cogs_mutatie_id: cogsVoorraadResult.mutatienummer,
        verkoop_xml: verkoopResult.raw,
        cogs_xml: cogsVoorraadResult.raw,
        status: 'success',
        sync_timestamp: new Date().toISOString(),
        error_message: null
      };

      await FirebaseService.addDocument('accounting_sync', syncResult);

      return NextResponse.json({
        ok: true,
        message: 'Order succesvol gesynchroniseerd',
        verkoop_mutatie_id: verkoopResult.mutatienummer,
        cogs_mutatie_id: cogsVoorraadResult.mutatienummer,
        debug: {
          order_id: orderId,
          customer_id: customer.id,
          order_payment_status: order.payment_status,
          normalized_order: normalized,
          verkoop_xml_preview: typeof verkoopResult.raw === 'string' ? verkoopResult.raw.slice(0, 2000) : null,
          cogs_xml_preview: typeof cogsVoorraadResult.raw === 'string' ? cogsVoorraadResult.raw.slice(0, 2000) : null
        }
      });

    } finally {
      // Sluit sessie altijd
      await closeSession(sessionId);
    }

  } catch (error) {
    console.error('e-Boekhouden sync-order error:', error);
    
    // Sla error op in Firebase
    try {
      const errorResult = {
        order_id: orderId,
        status: 'error',
        sync_timestamp: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        session_id: null,
        verkoop_mutatie_id: null,
        cogs_mutatie_id: null,
        verkoop_xml: null,
        cogs_xml: null
      };
      
      await FirebaseService.addDocument('accounting_sync', errorResult);
    } catch (firebaseError) {
      console.error('Failed to save error to Firebase:', firebaseError);
    }

    try {
      // Provide a bit more debug context in the error response (best effort)
      const order: any = orderId ? await FirebaseService.getDocument('orders', orderId) : null;
      return NextResponse.json({
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        debug: {
          order_id: orderId,
          order_payment_status: order?.payment_status,
          has_customer_id: !!order?.customer_id,
          customer_email: order?.customer?.email || null,
        }
      }, { status: 500 });
    } catch (_) {
      return NextResponse.json({
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }, { status: 500 });
    }
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
