'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google: any
  }
}

interface Dealer {
  id: string
  name: string
  company_name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  website?: string
  latitude: number
  longitude: number
  is_active: boolean
  show_on_map?: boolean
  rating?: number
  reviews?: number
  services: string[]
}

interface MapComponentProps {
  dealers: Dealer[]
  userLocation: { lat: number; lng: number } | null
  onDealerSelect: (dealer: Dealer | null) => void
  selectedDealer: Dealer | null
  searchCenter?: { lat: number; lng: number } | null
  searchRadius?: number
}

export default function MapComponent({ dealers, userLocation, onDealerSelect, selectedDealer, searchCenter, searchRadius }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markersRef = useRef<any[]>([])
  const searchCircleRef = useRef<any | null>(null)
  const searchMarkerRef = useRef<any | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const [mapLoaded, setMapLoaded] = useState(false)

  // Load Google Maps API key
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/settings')
        const settings = await response.json()
        if (settings && settings.length > 0 && settings[0].google_maps_api_key) {
          setApiKey(settings[0].google_maps_api_key)
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error)
      }
    }
    fetchApiKey()
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Wait for existing script to load
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          setMapLoaded(true)
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
      return
    }

    // Only load script if not already loaded
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapLoaded(true)
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
      setMapLoaded(false)
    }
    document.head.appendChild(script)

    return () => {
      // Don't remove script on unmount to avoid conflicts
    }
  }, [apiKey])

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return

    // Initialize map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 52.3676, lng: 4.9041 },
      zoom: 7,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })
    mapInstanceRef.current = map

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        title: 'Jouw locatie'
      })
    }

    // Add dealer markers
    dealers.forEach((dealer) => {
      const marker = new window.google.maps.Marker({
        position: { lat: dealer.latitude, lng: dealer.longitude },
        map: map,
        title: dealer.company_name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      })

      // Create info window content
      const content = `
        <div style="min-width: 250px; max-width: 300px; padding: 8px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 10px 0; font-weight: bold; color: #1F2937; font-size: 16px;">${dealer.company_name}</h3>
          <p style="margin: 0 0 6px 0; color: #374151; font-size: 14px;">${dealer.address}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">${dealer.postal_code} ${dealer.city}</p>
          ${dealer.rating ? `
            <div style="margin: 0 0 10px 0;">
              <span style="color: #F59E0B; font-size: 16px;">★</span>
              <span style="color: #6B7280; font-size: 14px;"> ${dealer.rating} (${dealer.reviews} reviews)</span>
            </div>
          ` : ''}
          <div style="margin: 0 0 8px 0;">
            <a href="tel:${dealer.phone}" style="color: #059669; text-decoration: none; font-size: 14px; display: block;">📞 ${dealer.phone}</a>
          </div>
          <div style="margin: 0 0 8px 0;">
            <a href="mailto:${dealer.email}" style="color: #059669; text-decoration: none; font-size: 14px; display: block;">✉️ ${dealer.email}</a>
          </div>
          <div style="margin: 0 0 8px 0;">
            <a href="https://maps.google.com/?q=${dealer.latitude},${dealer.longitude}" target="_blank" style="color: #059669; text-decoration: none; font-size: 14px; display: block;">🗺️ Route</a>
          </div>
          ${dealer.website ? `
            <div style="margin: 0;">
              <a href="${dealer.website}" target="_blank" style="color: #059669; text-decoration: none; font-size: 14px; display: block;">🌐 Website</a>
            </div>
          ` : ''}
        </div>
      `

      const infoWindow = new window.google.maps.InfoWindow({
        content: content,
        maxWidth: 300
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        onDealerSelect(dealer)
      })

      markersRef.current.push(marker)
    })

    // Add search circle if provided
    if (searchCenter && searchRadius) {
      console.log('Adding search circle in main useEffect:', searchCenter, 'radius:', searchRadius)
      
      // Add search circle
      const circle = new window.google.maps.Circle({
        strokeColor: '#059669',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#059669',
        fillOpacity: 0.1,
        map: map,
        center: { lat: searchCenter.lat, lng: searchCenter.lng },
        radius: searchRadius * 1000 // Convert km to meters
      })
      
      searchCircleRef.current = circle

      // Add center marker for search location
      const searchMarker = new window.google.maps.Marker({
        position: { lat: searchCenter.lat, lng: searchCenter.lng },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        title: 'Zoeklocatie'
      })

      const searchInfoWindow = new window.google.maps.InfoWindow({
        content: `<div style="text-align: center;"><b>Zoeklocatie</b><br/>${searchRadius} km radius</div>`,
        maxWidth: 140
      })

      searchMarker.addListener('click', () => {
        searchInfoWindow.open(map, searchMarker)
      })

      searchMarkerRef.current = searchMarker

      // Set appropriate zoom level based on radius
      let zoom
      if (searchRadius <= 10) zoom = 11
      else if (searchRadius <= 20) zoom = 10
      else if (searchRadius <= 30) zoom = 9
      else if (searchRadius <= 50) zoom = 8
      else zoom = 7
      
      console.log(`Setting zoom to ${zoom} for radius ${searchRadius}km`)
      
      // Calculate latitude offset to position marker moderately lower on screen
      const latOffset = zoom >= 10 ? 0.02 : zoom >= 8 ? 0.03 : 0.04
      const adjustedLat = searchCenter.lat + latOffset
      
      console.log(`Offsetting center from ${searchCenter.lat} to ${adjustedLat} (offset: ${latOffset})`)
      
      // Set view with offset to position marker lower
      map.setCenter({ lat: adjustedLat, lng: searchCenter.lng })
      map.setZoom(zoom)
    } else {
      // Fit map to show all markers (only if no search is active)
      if (dealers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition()!)
        })
        map.fitBounds(bounds)
      }
    }

    // Cleanup function
    return () => {
      // Google Maps cleanup is handled automatically
    }
  }, [dealers, userLocation, onDealerSelect, searchCenter, searchRadius, mapLoaded])

  // Update selected dealer marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Remove previous selected marker styling
    markersRef.current.forEach(marker => {
      marker.setIcon({
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#059669',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      })
    })

    // Highlight selected dealer
    if (selectedDealer) {
      const selectedMarker = markersRef.current.find(marker => {
        const position = marker.getPosition()
        return position && position.lat() === selectedDealer.latitude && position.lng() === selectedDealer.longitude
      })

      if (selectedMarker) {
        selectedMarker.setIcon({
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        })
        
        // Center map on selected dealer (only if no search is active)
        if (!searchCenter) {
          mapInstanceRef.current!.setCenter({ lat: selectedDealer.latitude, lng: selectedDealer.longitude })
          mapInstanceRef.current!.setZoom(12)
        }
      }
    }
  }, [selectedDealer, searchCenter])

  if (!apiKey) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dealer Locaties</h3>
          <p className="text-sm text-gray-600">
            Google Maps API key niet geconfigureerd
          </p>
        </div>
        <div className="h-96 w-full rounded-b-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Google Maps API key niet gevonden</p>
            <p className="text-sm text-gray-400">Configureer de API key in de instellingen</p>
          </div>
        </div>
      </div>
    )
  }

  if (!mapLoaded) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Dealer Locaties</h3>
          <p className="text-sm text-gray-600">
            Klik op een marker voor meer informatie
          </p>
        </div>
        <div className="h-96 w-full rounded-b-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Kaart laden...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Dealer Locaties</h3>
        <p className="text-sm text-gray-600">
          Klik op een marker voor meer informatie
        </p>
      </div>
      <div 
        ref={mapRef} 
        className="h-96 w-full rounded-b-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}
