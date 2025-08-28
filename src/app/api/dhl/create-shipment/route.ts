import { NextRequest, NextResponse } from 'next/server'
import { DHLService } from '@/lib/dhl'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is verplicht' 
      }, { status: 400 })
    }

    // Haal order op uit Firebase
    const order = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order niet gevonden' 
      }, { status: 404 })
    }

    // Haal DHL instellingen op uit environment variabelen
    const dhlSettings = {
      apiUserId: process.env.NEXT_PUBLIC_DHL_API_USER_ID,
      apiKey: process.env.NEXT_PUBLIC_DHL_API_KEY,
      accountId: process.env.NEXT_PUBLIC_DHL_ACCOUNT_ID,
      testMode: process.env.NEXT_PUBLIC_DHL_TEST_MODE === 'true'
    }

    // Controleer of alle vereiste instellingen aanwezig zijn
    if (!dhlSettings.apiUserId || !dhlSettings.apiKey || !dhlSettings.accountId) {
      return NextResponse.json({
        success: false,
        error: 'DHL API instellingen zijn niet volledig geconfigureerd',
        details: {
          hasUserId: !!dhlSettings.apiUserId,
          hasApiKey: !!dhlSettings.apiKey,
          hasAccountId: !!dhlSettings.accountId,
          testMode: dhlSettings.testMode
        }
      }, { status: 400 })
    }

    // Maak DHL verzending aan
    const shipmentResult = await DHLService.createShipment(order, dhlSettings)
    
    // Update order met DHL tracking informatie
    await FirebaseService.updateDocument('orders', orderId, {
      dhl_tracking_number: shipmentResult.trackingNumber,
      dhl_shipment_id: shipmentResult.shipmentId,
      shipping_label_url: shipmentResult.labelUrl,
      status: 'verzonden',
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'DHL verzending succesvol aangemaakt',
      trackingNumber: shipmentResult.trackingNumber,
      shipmentId: shipmentResult.shipmentId,
      labelUrl: shipmentResult.labelUrl
    })

  } catch (error) {
    console.error('Error creating DHL shipment:', error)
    return NextResponse.json({
      success: false,
      error: 'Fout bij aanmaken DHL verzending',
      details: error instanceof Error ? error.message : 'Onbekende fout'
    }, { status: 500 })
  }
}
