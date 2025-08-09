import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Try OpenStreetMap Nominatim (free, no API key needed)
    try {
      // Determine country from address
      const isBelgianAddress = address.toLowerCase().includes('belgië') || 
                              address.toLowerCase().includes('belgium') || 
                              address.toLowerCase().includes('be ') ||
                              address.toLowerCase().includes('belg');
      
      // Clean the address and add appropriate country suffix
      let searchAddress = address;
      if (isBelgianAddress) {
        // Remove any existing country references and add Belgium
        searchAddress = address.replace(/,?\s*(belgië|belgium|be)\s*$/i, '').trim() + ', België';
      } else {
        // For Dutch addresses, add Netherlands
        searchAddress = address.replace(/,?\s*(nederland|netherlands|nl)\s*$/i, '').trim() + ', Nederland';
      }
      
      console.log('Searching for address:', searchAddress);
      
      // Try multiple search strategies
      const searchStrategies = [
        // Strategy 1: Full address with country
        searchAddress,
        // Strategy 2: Just street and city
        address.replace(/,?\s*(nederland|netherlands|nl|belgië|belgium|be)\s*$/i, '').trim(),
        // Strategy 3: Just city and postal code
        address.match(/(\d{4}\s*[A-Z]{2})\s+(.+?)(?:\s+(?:Nederland|Netherlands|NL|België|Belgium|BE))?$/)?.[0] || '',
        // Strategy 4: Just city name
        address.match(/([A-Za-z\s]+?)(?:\s+\d{4}\s*[A-Z]{2})?(?:\s+(?:Nederland|Netherlands|NL|België|Belgium|BE))?$/)?.[1]?.trim() || ''
      ];
      
      for (let i = 0; i < searchStrategies.length; i++) {
        const strategy = searchStrategies[i];
        if (!strategy || strategy.length < 3) continue;
        
        console.log(`Trying strategy ${i + 1}:`, strategy);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(strategy)}&format=json&limit=1&addressdetails=1&countrycodes=nl,be&extratags=1&namedetails=1`
        )
        const data = await response.json()
        
        console.log(`Strategy ${i + 1} response:`, data);
        
        if (data && data.length > 0) {
          const result = data[0]
          
          // Use more precise coordinates if available
          const lat = parseFloat(result.lat)
          const lng = parseFloat(result.lon)
          
          // Create a more detailed formatted address
          let formattedAddress = result.display_name
          if (result.address) {
            const addr = result.address
            if (addr.city && addr.state) {
              formattedAddress = `${addr.city}, ${addr.state}, ${addr.country || 'Nederland'}`
            }
          }
          
          return NextResponse.json({
            lat: lat,
            lng: lng,
            formatted_address: formattedAddress,
            place_id: result.place_id
          })
        }
      }
      
      // If no strategy worked, return error
      return NextResponse.json({ 
        error: 'Location not found',
        message: 'Locatie niet gevonden. Probeer een ander adres.'
      }, { status: 404 })
      
    } catch (error) {
      console.error('Nominatim API error:', error)
      return NextResponse.json({ 
        error: 'Network error',
        message: 'Netwerkfout bij het zoeken. Probeer het opnieuw.'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error geocoding address:', error)
    return NextResponse.json({ error: 'Failed to geocode address' }, { status: 500 })
  }
}
