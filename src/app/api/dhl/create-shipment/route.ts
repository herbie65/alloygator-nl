import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { DHLService } from '@/lib/dhl'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get order from Firebase
    const order = await FirebaseService.getDocument('orders', orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get DHL settings from Firebase
    const settingsResponse = await FirebaseService.getSettings()
    if (!settingsResponse || settingsResponse.length === 0) {
      return NextResponse.json(
        { error: 'DHL settings not configured' },
        { status: 500 }
      )
    }

    const settings = settingsResponse[0]
    
    // Check if DHL API credentials are configured
    if (!settings.dhlApiUserId || !settings.dhlApiKey) {
      return NextResponse.json(
        { error: 'DHL API UserId and API Key are required' },
        { status: 500 }
      )
    }

    const dhlSettings = {
      apiUserId: settings.dhlApiUserId,
      apiKey: settings.dhlApiKey,
      accountId: settings.dhlAccountId || '',
      testMode: settings.dhlTestMode || true
    }

    console.log('Creating DHL shipment for order:', orderId)

    // Create shipment with DHL
    const shipmentResult = await DHLService.createShipment(order, dhlSettings)

    // Update order with DHL tracking information
    const updatedOrder = {
      ...order,
      dhl_tracking_number: shipmentResult.tracking_number,
      dhl_shipment_id: shipmentResult.shipment_id,
      shipping_label_url: shipmentResult.label_url,
      status: 'shipped',
      shipped_at: new Date().toISOString()
    }

    await FirebaseService.updateDocument('orders', orderId, updatedOrder)

    return NextResponse.json({
      success: true,
      data: {
        tracking_number: shipmentResult.tracking_number,
        shipment_id: shipmentResult.shipment_id,
        label_url: shipmentResult.label_url
      }
    })
  } catch (error: any) {
    console.error('Error creating DHL shipment:', error)
    
    let errorMessage = 'Unknown error occurred'
    let statusCode = 500

    if (error.message.includes('DHL API key is invalid')) {
      errorMessage = 'DHL API key is invalid or expired'
      statusCode = 401
    } else if (error.message.includes('DHL API access denied')) {
      errorMessage = 'DHL API access denied'
      statusCode = 403
    } else if (error.message.includes('account number')) {
      errorMessage = 'DHL account number is required'
      statusCode = 400
    } else {
      errorMessage = error.message || 'Failed to create shipment'
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message
      },
      { status: statusCode }
    )
  }
}
