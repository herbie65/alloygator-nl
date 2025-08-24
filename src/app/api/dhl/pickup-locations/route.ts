import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postal_code')
    
    if (!postalCode) {
      return NextResponse.json({ error: 'Postal code parameter is required' }, { status: 400 })
    }

    // Voorlopig retourneren we mock data totdat DHL integratie is geïmplementeerd
    // Dit voorkomt 404 errors in de checkout
    const mockPickupLocations = [
      {
        location_name: 'DHL Service Point - PostNL',
        location_code: 'DHL001',
        address: {
          street: 'Hoofdstraat',
          number: '1',
          postal_code: postalCode,
          city: 'Almere',
          country: 'NL'
        },
        opening_hours: [
          { day: 'monday', open: '09:00', close: '18:00' },
          { day: 'tuesday', open: '09:00', close: '18:00' },
          { day: 'wednesday', open: '09:00', close: '18:00' },
          { day: 'thursday', open: '09:00', close: '18:00' },
          { day: 'friday', open: '09:00', close: '18:00' },
          { day: 'saturday', open: '09:00', close: '17:00' },
          { day: 'sunday', open: 'closed', close: 'closed' }
        ],
        distance: 0.5
      },
      {
        location_name: 'DHL Service Point - Kruidvat',
        location_code: 'DHL002',
        address: {
          street: 'Kruidenlaan',
          number: '15',
          postal_code: postalCode,
          city: 'Almere',
          country: 'NL'
        },
        opening_hours: [
          { day: 'monday', open: '08:00', close: '20:00' },
          { day: 'tuesday', open: '08:00', close: '20:00' },
          { day: 'wednesday', open: '08:00', close: '20:00' },
          { day: 'thursday', open: '08:00', close: '20:00' },
          { day: 'friday', open: '08:00', close: '20:00' },
          { day: 'saturday', open: '08:00', close: '18:00' },
          { day: 'sunday', open: 'closed', close: 'closed' }
        ],
        distance: 1.2
      }
    ]

    return NextResponse.json(mockPickupLocations)
  } catch (error) {
    console.error('Error fetching DHL pickup locations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
