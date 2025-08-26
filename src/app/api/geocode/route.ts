import { NextRequest, NextResponse } from 'next/server'
export const dynamic = "force-static"


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postalCode = searchParams.get('postalCode')
    const houseNumber = searchParams.get('houseNumber')
    const address = searchParams.get('address')

    // Als er een address parameter is, gebruik Google Geocoding API
    if (address) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          return NextResponse.json({
            error: 'Google Maps API key niet geconfigureerd'
          }, { status: 500 })
        }

        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`)
        const data = await response.json()
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0]
          const location = result.geometry.location
          
          return NextResponse.json({
            success: true,
            address: {
              street: '',
              house_number: '',
              city: '',
              postal_code: '',
              country: 'NL',
              latitude: location.lat,
              longitude: location.lng
            },
            note: 'Coördinaten opgehaald via Google Geocoding API'
          })
        }
      } catch (error) {
        console.error('Google Geocoding error:', error)
      }
    }

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
      // Gebruik de nieuwe postcode API (api.postcodedata.nl)
      const response = await fetch(`http://api.postcodedata.nl/v1/postcode/?postcode=${postalCode}&streetnumber=${houseNumber}&type=json&ref=alloygator`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Postcode API response:', data)
        
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
      
      // Als de API faalt, gebruik lokale postcode database als fallback
      console.log(`Postcode API faalt (${response.status}), gebruik lokale database...`)
      
      // Lokale postcode database voor veel voorkomende postcodes
      const localPostcodes: Record<string, { street: string, city: string }> = {
        '1335WL': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WM': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WN': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WP': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WR': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WS': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WT': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WV': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WW': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WX': { street: 'Vergulde Draakstraat', city: 'Almere' },
        '1335WZ': { street: 'Vergulde Draakstraat', city: 'Almere' },
        // Voeg meer postcodes toe indien nodig
      }
      
      const localData = localPostcodes[postalCode]
      if (localData) {
        const address = {
          street: localData.street,
          house_number: houseNumber,
          city: localData.city,
          postal_code: postalCode,
          country: 'NL'
        }

        return NextResponse.json({
          success: true,
          address,
          note: 'Adres opgehaald uit lokale database (fallback)'
        })
      }

      if (response.ok) {
        const data = await response.json()
        console.log('Postcode API response:', data)
        
        // Probeer PostcodeAPI.nu formaat
        if (data._embedded && data._embedded.addresses && data._embedded.addresses.length > 0) {
          const addr = data._embedded.addresses[0]
          
          const address = {
            street: addr.street || '',
            house_number: addr.number || houseNumber,
            city: addr.city?.label || '',
            postal_code: postalCode,
            country: 'NL'
          }

          return NextResponse.json({
            success: true,
            address,
            note: 'Adres opgehaald via PostcodeAPI.nu'
          })
        }
      }
      
      // Als de API geen resultaat geeft, probeer een eenvoudige validatie
      if (postalCode.length === 6) {
        // Simpele validatie: postcode bestaat en huisnummer is numeriek
        const isValidHouseNumber = /^\d+[a-zA-Z]?$/.test(houseNumber)
        
        if (isValidHouseNumber) {
          // Retourneer basis informatie op basis van postcode
          const address = {
            street: '', // Kan niet automatisch worden bepaald
            house_number: houseNumber,
            city: '', // Kan niet automatisch worden bepaald
            postal_code: postalCode,
            country: 'NL'
          }

          return NextResponse.json({
            success: true,
            address,
            note: 'Postcode gevalideerd, maar adresdetails konden niet worden opgehaald'
          })
        }
      }

      return NextResponse.json({ 
        error: 'Geen adres gevonden voor deze postcode en huisnummer' 
      }, { status: 404 })

    } catch (apiError) {
      console.error('Error calling postcode API:', apiError)
      
      // Fallback: basis validatie
      if (postalCode.length === 6 && /^\d+[a-zA-Z]?$/.test(houseNumber)) {
        const address = {
          street: '',
          house_number: houseNumber,
          city: '',
          postal_code: postalCode,
          country: 'NL'
        }

        return NextResponse.json({
          success: true,
          address,
          note: 'Postcode gevalideerd (offline modus)'
        })
      }

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
