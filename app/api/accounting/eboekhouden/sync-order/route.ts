import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// BTW codes mapping (volgens e-Boekhouden handleiding)
const BTW_CODES = {
  '21': 'HOOG_VERK_21',    // 21% verkoop
  '9': 'LAAG_VERK_9',      // 9% verkoop
  '0': 'GEEN',             // 0% (geen BTW)
  'EU': 'BI_EU_VERK',      // EU verkoop
  'INT': 'BU_EU_VERK'      // Internationale verkoop
};

// Grootboekrekeningen (perpetual method)
const GROOTBOEK_REKENINGEN = {
  OMZET: '8000',           // Omzet
  DEBITEUREN: '1300',      // Debiteuren
  VOORRAAD: '3000',        // Voorraad (balans)
  COGS: '7000',            // Inkoopwaarde van de omzet
  BANK: '1100'             // Bank
};

interface SyncOrderRequest {
  orderId: string;
}

interface SyncResult {
  success: boolean;
  orderId: string;
  eBoekhoudenIds: {
    verkoopMutatie?: string;
    cogsMutatie?: string;
    relatieId?: string;
  };
  errors?: string[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  let session: any | null = null; // Changed type to any as eBoekhoudenSession is no longer imported
  
  try {
    const { orderId }: SyncOrderRequest = await request.json();
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 });
    }

    console.log(`🔄 Starting e-Boekhouden sync for order: ${orderId}`);

    // 1. Get order and customer data from Firestore
    const { FirebaseClientService } = await import('@/lib/firebase-client');
    const order = await FirebaseClientService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Type assertion for order data
    const orderData = order as any;

    const customer = await FirebaseClientService.getCustomerById(orderData.customer_id);
    if (!customer) {
      throw new Error(`Customer not found for order: ${orderId}`);
    }

    // Type assertion for customer data
    const customerData = customer as any;

    // 2. Open e-Boekhouden session
    const { eBoekhoudenClientInstance } = await import('@/services/eBoekhouden/client');
    session = await eBoekhoudenClientInstance.openSession();
    console.log('✅ e-Boekhouden session opened');

    // 3. Add/update customer relation
    const relatie = {
      Code: `CUST-${customerData.id}`,
      Bedrijf: customerData.company_name || customerData.name,
      BP: (customerData.is_dealer ? 'B' : 'P') as 'B' | 'P',
      Naam: customerData.name,
      Adres: customerData.address,
      Postcode: customerData.postal_code,
      Plaats: customerData.city,
      Land: customerData.country || 'NL',
      Telefoon: customerData.phone,
      Email: customerData.email,
      BTWNummer: customerData.vat_number,
      KvKNummer: customerData.kvk_number
    };

    const relatieId = await eBoekhoudenClientInstance.addRelatie(session, relatie);
    console.log('✅ Customer relation added/updated:', relatieId);

    // 4. Create sales mutation (FactuurVerstuurd)
    const verkoopRegels = orderData.items.map((item: any) => {
      const btwPercentage = item.vat_rate || 21;
      const btwCode = BTW_CODES[btwPercentage.toString() as keyof typeof BTW_CODES] || BTW_CODES['21'];
      
      return {
        BedragExclBTW: Number(item.price_excl_vat || item.price),
        BTW: Number(item.vat_amount || 0),
        BedragInclBTW: Number(item.price),
        BTWCode: btwCode,
        TegenrekeningCode: GROOTBOEK_REKENINGEN.OMZET,
        Omschrijving: item.name,
        Referentie: item.id
      };
    });

    const verkoopMutatie = {
      Soort: 'FactuurVerstuurd',
      Datum: new Date(orderData.created_at).toISOString().split('T')[0], // YYYY-MM-DD
      RelatieCode: `CUST-${customerData.id}`,
      Factuurnummer: orderData.order_number || orderId,
      Omschrijving: `Verkoop ${orderData.order_number || orderId}`,
      InExBTW: 'EX' as const,
      MutatieRegels: {
        cMutatieRegel: verkoopRegels
      },
      Boekstuk: `ORD-${orderId}`,
      Referentie: orderId
    };

    const verkoopMutatieId = await eBoekhoudenClientInstance.addMutatie(session, verkoopMutatie);
    console.log('✅ Sales mutation added:', verkoopMutatieId);

    // 5. Create COGS + Inventory mutation (Memoriaal) - Perpetual method
    const totalCost = orderData.items.reduce((sum: number, item: any) => {
      return sum + (Number(item.cost_price || 0) * Number(item.quantity || 1));
    }, 0);

    if (totalCost > 0) {
      const cogsRegels = [
        {
          BedragExclBTW: totalCost,
          BTW: 0,
          BedragInclBTW: totalCost,
          BTWCode: BTW_CODES['0'],
          TegenrekeningCode: GROOTBOEK_REKENINGEN.COGS,
          Omschrijving: `COGS ${orderData.order_number || orderId}`,
          Referentie: orderId
        },
        {
          BedragExclBTW: totalCost,
          BTW: 0,
          BedragInclBTW: totalCost,
          BTWCode: BTW_CODES['0'],
          TegenrekeningCode: GROOTBOEK_REKENINGEN.VOORRAAD,
          Omschrijving: `Voorraad afname ${orderData.order_number || orderId}`,
          Referentie: orderId
        }
      ];

      const cogsMutatie = {
        Soort: 'Memoriaal',
        Datum: new Date(orderData.created_at).toISOString().split('T')[0],
        RelatieCode: `CUST-${customerData.id}`,
        Omschrijving: `COGS + Voorraad ${orderData.order_number || orderId}`,
        InExBTW: 'EX' as const,
        MutatieRegels: {
          cMutatieRegel: cogsRegels
        },
        Boekstuk: `COGS-${orderId}`,
        Referentie: orderId
      };

      const cogsMutatieId = await eBoekhoudenClientInstance.addMutatie(session, cogsMutatie);
      console.log('✅ COGS mutation added:', cogsMutatieId);
    }

    // 6. Log sync result
    const syncResult: SyncResult = {
      success: true,
      orderId,
      eBoekhoudenIds: {
        verkoopMutatie: verkoopMutatieId,
        cogsMutatie: totalCost > 0 ? 'created' : 'not_applicable',
        relatieId
      },
      timestamp: new Date().toISOString()
    };

    // TODO: Save sync result to Firestore accounting_sync collection
    
    console.log('✅ Order sync completed successfully:', syncResult);
    
    return NextResponse.json(syncResult);

  } catch (error: any) {
    console.error('❌ Order sync failed:', error);
    
    const syncResult: SyncResult = {
      success: false,
      orderId: 'unknown',
      eBoekhoudenIds: {},
      errors: [error.message || 'Unknown error'],
      timestamp: new Date().toISOString()
    };

    // TODO: Save failed sync result to Firestore
    
    return NextResponse.json(syncResult, { status: 500 });

  } finally {
    // Always close session
    if (session) {
      try {
        const { eBoekhoudenClientInstance } = await import('@/services/eBoekhouden/client');
        await eBoekhoudenClientInstance.closeSession(session.client, session.sessionId);
        console.log('✅ e-Boekhouden session closed');
      } catch (closeError) {
        console.error('❌ Failed to close e-Boekhouden session:', closeError);
      }
    }
  }
}
