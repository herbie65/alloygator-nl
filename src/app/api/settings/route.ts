import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET() {
  try {
    const settings = await FirebaseService.getSettings()
    return NextResponse.json(settings || [])
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    
    // Ensure shipping methods have the correct structure
    if (settings.shippingMethods) {
      settings.shippingMethods = settings.shippingMethods.map((method: any) => {
        // If method doesn't have carrier and delivery_type, add them based on the ID
        if (!method.carrier || !method.delivery_type) {
          const [carrier, deliveryType] = method.id.split('-');
          return {
            ...method,
            carrier: carrier || 'postnl',
            delivery_type: deliveryType || 'standard'
          };
        }
        return method;
      });
    }

    // Ensure enabledCarriers exists
    if (!settings.enabledCarriers) {
      settings.enabledCarriers = ['postnl', 'dhl', 'dpd'];
    }

    const existingSettings = await FirebaseService.getSettings()
    
    if (existingSettings && existingSettings.length > 0) {
      const result = await FirebaseService.updateSettings(existingSettings[0].id, settings)
      return NextResponse.json({ success: true, data: result })
    } else {
      const result = await FirebaseService.addDocument('settings', settings)
      return NextResponse.json({ success: true, data: result })
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
