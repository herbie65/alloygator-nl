import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode') || searchParams.get('postal_code')
    const houseNumber = searchParams.get('houseNumber') || searchParams.get('house_number')

    // Postcode lookup (hoofdfunctionaliteit)
    if (!postalCode) {
      return NextResponse.json({
        error: 'Postcode is verplicht'
      }, { status: 400 })
    }

    if (!houseNumber) {
      return NextResponse.json({
        error: 'Huisnummer is verplicht'
      }, { status: 400 })
    }

    // Valideer Nederlandse postcode formaat (4 cijfers + 2 letters)
    const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/i
    if (!postcodeRegex.test(postalCode)) {
      return NextResponse.json({
        error: 'Ongeldig postcode formaat. Gebruik formaat: 1234AB'
      }, { status: 400 })
    }

    try {
      // Gebruik alleen api.postcodedata.nl
      const response = await fetch(`http://api.postcodedata.nl/v1/postcode/?postcode=${postalCode}&streetnumber=${houseNumber}&type=json&ref=alloygator`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'ok' && data.details && data.details.length > 0) {
          const addr = data.details[0]
          
          const address = {
            street: addr.street || '',
            house_number: houseNumber,
            city: addr.city || '',
            postal_code: postalCode,
            country: 'NL'
          }

          return NextResponse.json({
            success: true,
            address,
            note: 'Adres opgehaald via api.postcodedata.nl'
          })
        }
      }
      
      return NextResponse.json({ 
        error: 'Geen adres gevonden voor deze postcode en huisnummer' 
      }, { status: 404 })

    } catch (apiError) {
      console.error('Error calling postcode API:', apiError)
      
      return NextResponse.json({ 
        error: 'Kon geen verbinding maken met postcode service' 
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Error in geocode API:', error)
    return NextResponse.json({ 
      error: 'Interne server fout' 
    }, { status: 500 })
  }
}
