import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase';
import { 
  openSession, 
  closeSession, 
  addRelatie, 
  addMemoriaal 
} from '@/services/accounting/eboekhouden';
import { mapOrderToBookings, validateBookingBalance } from '@/services/accounting/orderToBookings';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { ok: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Haal order en klant op uit Firestore
    const orderData = await FirebaseService.getOrderById(orderId);
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
    const customerData = await FirebaseService.getCustomerById(order.customer_id);
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
      const bookings = mapOrderToBookings(order, customer);
      
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
        timestamp: new Date().toISOString(),
        error: null
      };

      await FirebaseService.addDocument('accounting_sync', syncResult);

      return NextResponse.json({
        ok: true,
        message: 'Order succesvol gesynchroniseerd',
        verkoop_mutatie_id: verkoopResult.mutatienummer,
        cogs_mutatie_id: cogsVoorraadResult.mutatienummer
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
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
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

    return NextResponse.json({
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
