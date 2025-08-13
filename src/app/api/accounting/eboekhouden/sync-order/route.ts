import { NextRequest, NextResponse } from 'next/server'
import { eBoekhoudenClientInstance } from '@/services/eBoekhouden/client'
import { FirebaseService } from '@/lib/firebase'

// Type definitions
interface Order {
  id: string
  order_number?: string
  payment_status: 'open' | 'paid' | 'failed'
  customer_id: string
  items: Array<{
    name?: string
    product_name?: string
    price: number
    price_excl_vat?: number
    vat_rate?: number
    quantity: number
    cost_price?: number
    sku?: string
    product_id?: string
  }>
}

interface Customer {
  id: string
  company_name?: string
  name?: string
  address?: string
  postal_code?: string
  city?: string
  country?: string
  phone?: string
  email: string
  vat_number?: string
  kvk_number?: string
}

// BTW codes mapping volgens officiële handleiding
const BTW_CODES = {
  '21%': 'HOOG_VERK_21',
  '9%': 'LAAG_VERK_9',
  '0%': 'BI_EU_VERK',
  'none': 'GEEN'
}

// Grootboekrekeningen mapping
const GROOTBOEK_REKENINGEN = {
  OMZET: '8000',      // Omzet
  DEBITEUREN: '1300', // Debiteuren
  VOORRAAD: '3000',   // Voorraad
  COGS: '7000',       // Kostprijs verkopen
  KRUISPOST: '1100'   // Kruispost
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { ok: false, message: 'Order ID is verplicht' },
        { status: 400 }
      )
    }

    // Haal order en klant op uit Firestore
    const orderData = await FirebaseService.getOrderById(orderId)
    if (!orderData) {
      return NextResponse.json(
        { ok: false, message: 'Order niet gevonden' },
        { status: 404 }
      )
    }
    const order = orderData as Order

    const customerData = await FirebaseService.getCustomerById(order.customer_id)
    if (!customerData) {
      return NextResponse.json(
        { ok: false, message: 'Klant niet gevonden' },
        { status: 404 }
      )
    }
    const customer = customerData as Customer

    // Controleer of order al betaald is
    console.log('Order data:', JSON.stringify(order, null, 2))
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { ok: false, message: 'Order moet betaald zijn om te synchroniseren' },
        { status: 400 }
      )
    }

    // Open e-boekhouden sessie
    const session = await eBoekhoudenClientInstance.openSession()

    try {
      // 1. Maak/update klant in e-boekhouden
      const relatieCode = `CUST-${customer.id}`
      const relatie = {
        Code: relatieCode,
        Bedrijf: customer.company_name || customer.name || '',
        BP: (customer.company_name ? 'B' : 'P') as 'B' | 'P', // B = Bedrijf, P = Particulier
        Naam: customer.name || '',
        Adres: customer.address || '',
        Postcode: customer.postal_code || '',
        Plaats: customer.city || '',
        Land: customer.country || 'NL',
        Telefoon: customer.phone || '',
        Email: customer.email,
        BTWNummer: customer.vat_number || '',
        KvKNummer: customer.kvk_number || ''
      }

      await eBoekhoudenClientInstance.addRelatie(session, relatie)

      // 2. Verkoopmutatie (FactuurVerstuurd)
      const verkoopMutatie = {
        Soort: 'FactuurVerstuurd',
        Datum: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        RelatieCode: relatieCode,
        Factuurnummer: order.order_number || orderId,
        Omschrijving: `Verkoop ${order.order_number || orderId}`,
        InExBTW: 'EX' as 'EX', // Exclusief BTW
        MutatieRegels: {
          cMutatieRegel: order.items.map((item: any) => {
            const btwPercentage = item.vat_rate || 21
            const btwCode = btwPercentage === 21 ? 'HOOG_VERK_21' : 
                           btwPercentage === 9 ? 'LAAG_VERK_9' : 'BI_EU_VERK'
            
            return {
              BedragExclBTW: parseFloat((item.price_excl_vat || item.price / (1 + btwPercentage / 100)).toFixed(2)),
              BTW: parseFloat((item.price - (item.price_excl_vat || item.price / (1 + btwPercentage / 100))).toFixed(2)),
              BedragInclBTW: parseFloat(item.price.toFixed(2)),
              BTWCode: btwCode,
              TegenrekeningCode: GROOTBOEK_REKENINGEN.OMZET,
              Omschrijving: item.name || item.product_name,
              Referentie: item.sku || item.product_id || ''
            }
          })
        },
        Boekstuk: order.order_number || orderId,
        Referentie: orderId
      }

      const verkoopMutatieId = await eBoekhoudenClientInstance.addMutatie(session, verkoopMutatie)

      // 3. COGS + Voorraad mutatie (Memoriaal) - Perpetual inventory
      const totalCostExclVat = order.items.reduce((total: number, item: any) => {
        const cost = item.cost_price || item.price_excl_vat || (item.price / 1.21)
        return total + (cost * item.quantity)
      }, 0)

      const cogsVoorraadMutatie = {
        Soort: 'Memoriaal',
        Datum: new Date().toISOString().split('T')[0],
        RelatieCode: '', // Geen relatie voor voorraadmutatie
        Omschrijving: `COGS ${order.order_number || orderId}`,
        InExBTW: 'EX' as 'EX',
        MutatieRegels: {
          cMutatieRegel: [
            // COGS (debet) - kosten stijgen
            {
              BedragExclBTW: parseFloat(totalCostExclVat.toFixed(2)),
              BTW: 0,
              BedragInclBTW: parseFloat(totalCostExclVat.toFixed(2)),
              BTWCode: 'GEEN',
              TegenrekeningCode: GROOTBOEK_REKENINGEN.COGS,
              Omschrijving: `COGS ${order.order_number || orderId}`,
              Referentie: orderId
            },
            // Voorraad (credit) - voorraad daalt
            {
              BedragExclBTW: parseFloat(totalCostExclVat.toFixed(2)),
              BTW: 0,
              BedragInclBTW: parseFloat(totalCostExclVat.toFixed(2)),
              BTWCode: 'GEEN',
              TegenrekeningCode: GROOTBOEK_REKENINGEN.VOORRAAD,
              Omschrijving: `Voorraad ${order.order_number || orderId}`,
              Referentie: orderId
            }
          ]
        },
        Boekstuk: `COGS-${order.order_number || orderId}`,
        Referentie: orderId
      }

      const cogsMutatieId = await eBoekhoudenClientInstance.addMutatie(session, cogsVoorraadMutatie)

      // Sluit sessie
      await eBoekhoudenClientInstance.closeSession(session.client, session.sessionId)

      // Log succesvolle synchronisatie
      await FirebaseService.addDocument('accounting_sync', {
        order_id: orderId,
        order_number: order.order_number,
        customer_id: customer.id,
        sync_timestamp: new Date(),
        status: 'success',
        verkoop_mutatie_id: verkoopMutatieId,
        cogs_mutatie_id: cogsMutatieId,
        message: 'Order succesvol gesynchroniseerd naar e-boekhouden'
      })

      return NextResponse.json({
        ok: true,
        message: 'Order succesvol gesynchroniseerd naar e-boekhouden',
        data: {
          verkoop_mutatie_id: verkoopMutatieId,
          cogs_mutatie_id: cogsMutatieId,
          order_number: order.order_number || orderId
        }
      })

    } catch (error: any) {
      // Sluit sessie bij fout
      try {
        await eBoekhoudenClientInstance.closeSession(session.client, session.sessionId)
      } catch (closeError) {
        console.error('Failed to close session after error:', closeError)
      }

      // Log fout
      await FirebaseService.addDocument('accounting_sync', {
        order_id: orderId,
        order_number: order.order_number,
        customer_id: customer.id,
        sync_timestamp: new Date(),
        status: 'error',
        error_message: error.message,
        message: 'Fout bij synchroniseren naar e-boekhouden'
      })

      throw error
    }

  } catch (error: any) {
    console.error('e-Boekhouden sync-order error:', error)
    return NextResponse.json({
      ok: false,
      message: `Synchronisatie mislukt: ${error.message || 'Onbekende fout'}`
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    message: 'Alleen POST requests worden ondersteund'
  }, { status: 405 })
}
