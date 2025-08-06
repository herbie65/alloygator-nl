'use client'

import { useState, useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, MapCameraChangedEvent } from '@vis.gl/react-google-maps'
import { FirebaseClientService } from '@/lib/firebase-client'

interface Dealer {
  id: string
  name: string
  address: string
  phone: string
  email: string
  website?: string
  lat: number
  lng: number
  first_name?: string
  last_name?: string
  company_name?: string
  invoice_email?: string
}

interface Settings {
  id: string
  google_maps_api_key: string
  search_radius: number
}

export default function DealerMapPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchRadius, setSearchRadius] = useState(25)
  const [defaultSearchRadius, setDefaultSearchRadius] = useState(25)
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([])
  const [searchResult, setSearchResult] = useState<{lat: number, lng: number, formatted_address: string} | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 52.0, lng: 5.0 })
  const [mapZoom, setMapZoom] = useState(7)
  const [mapError, setMapError] = useState(false)
  const mapRef = useRef<any>(null)
  const settingsLoaded = useRef(false)

  useEffect(() => {
    if (!settingsLoaded.current) {
      fetchSettings()
      settingsLoaded.current = true
    }
    fetchDealers()
  }, [])

  useEffect(() => {
    console.log('mapCenter changed to:', mapCenter)
  }, [mapCenter])

  useEffect(() => {
    console.log('mapZoom changed to:', mapZoom)
  }, [mapZoom])

  const fetchSettings = async () => {
    try {
      const data = await FirebaseClientService.getSettings()
      console.log('Settings loaded:', data)
      if (data) {
        const settingsData = data as any
        setSettings(settingsData as Settings)
        setDefaultSearchRadius(settingsData.search_radius || 25)
        setSearchRadius(settingsData.search_radius || 25)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchDealers = async () => {
    try {
      const data = await FirebaseClientService.getCustomers()
      const dealerData = data.filter((customer: any) => 
        customer.is_dealer && customer.show_on_map && customer.lat && customer.lng
      ).map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        address: customer.address,
        phone: customer.phone,
        email: customer.email,
        website: customer.website,
        lat: customer.lat,
        lng: customer.lng,
        first_name: customer.first_name,
        last_name: customer.last_name,
        company_name: customer.company_name,
        invoice_email: customer.invoice_email
      }))
      setDealers(dealerData)
      // Alleen filteredDealers updaten als er geen zoekresultaat is
      if (!searchResult) {
        setFilteredDealers(dealerData)
      }
    } catch (error) {
      console.error('Error fetching dealers:', error)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleSearch = async () => {
    if (!searchLocation.trim()) return

    setIsSearching(true)
    try {
      // Simulate geocoding since we don't have the API route anymore
      // In a real implementation, you would use a geocoding service
      const mockGeocode = {
        lat: 52.3676, // Amsterdam coordinates as fallback
        lng: 4.9041,
        formatted_address: searchLocation
      };
      const data = mockGeocode;

      setSearchResult(data)
      
      // Update map center en zoom
      const newCenter = { lat: data.lat, lng: data.lng }
      setMapCenter(newCenter)
      setMapZoom(12)

      // Filter dealers within radius
      const nearbyDealers = dealers.filter(dealer => {
        const distance = calculateDistance(data.lat, data.lng, dealer.lat, dealer.lng)
        return distance <= searchRadius
      })

      // Sort by distance
      nearbyDealers.sort((a, b) => {
        const distanceA = calculateDistance(data.lat, data.lng, a.lat, a.lng)
        const distanceB = calculateDistance(data.lat, data.lng, b.lat, b.lng)
        return distanceA - distanceB
      })

      setFilteredDealers(nearbyDealers)
    } catch (error) {
      console.error('Error searching:', error)
      alert('Fout bij zoeken')
    } finally {
      setIsSearching(false)
    }
  }

  const handleMarkerClick = (dealer: Dealer) => {
    setSelectedDealer(dealer)
  }

  const closeDealerInfo = () => {
    setSelectedDealer(null)
  }

  const handleDealerClick = (dealer: Dealer) => {
    setSelectedDealer(dealer)
    const newCenter = { lat: dealer.lat, lng: dealer.lng }
    setMapCenter(newCenter)
    setMapZoom(14)
  }

  const handleMapError = () => {
    setMapError(true)
  }

  const handleMapLoad = (map: any) => {
    mapRef.current = map
    console.log('Map loaded successfully')
  }

  if (!settings) {
    return <div className="flex justify-center items-center h-64">Laden...</div>
  }

  const apiKey = settings.google_maps_api_key || 'AIzaSyBGMvaVRN2dO_11oN2s2h9tbwA9IorGWQQ'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vind een Dealer</h1>
        
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek locatie
              </label>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Stad, postcode of adres..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoekradius (km)
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSearching ? 'Zoeken...' : 'Zoeken'}
              </button>
              <button
                onClick={() => {
                  setMapCenter({ lat: 52.0, lng: 5.0 })
                  setMapZoom(7)
                  setSearchResult(null)
                  setSearchLocation('')
                  setFilteredDealers(dealers)
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Reset Kaart
              </button>
            </div>
          </div>
          
          {searchResult && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Zoekresultaat: {searchResult.formatted_address}
              </p>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-6 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Interactieve Kaart
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {filteredDealers.length} dealer(s) gevonden
                {searchResult && ` binnen ${searchRadius} km van ${searchLocation}`}
              </p>
              
              <div className="h-[650px] rounded-lg overflow-hidden">
                {mapError ? (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="text-red-500 text-6xl mb-4">🗺️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Kaart niet beschikbaar</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        De Google Maps kaart kan niet worden geladen.
                      </p>
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="font-medium text-gray-900 mb-2">Dealers in de buurt:</h4>
                        <div className="space-y-2">
                          {filteredDealers.map((dealer) => (
                            <div key={dealer.id} className="text-sm">
                              <strong>{dealer.company_name || dealer.name}</strong>
                              <br />
                              <span className="text-gray-600">{dealer.address}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settings ? (
                  <APIProvider apiKey={apiKey} onLoad={() => console.log('Maps API loaded')} onError={handleMapError}>
                    <Map
                      center={mapCenter}
                      zoom={mapZoom}
                      mapId="dealer-map"
                      style={{ width: '100%', height: '100%' }}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      zoomControl={true}
                      mapTypeControl={true}
                      scaleControl={true}
                      streetViewControl={true}
                      fullscreenControl={true}
                      onCameraChanged={(ev: MapCameraChangedEvent) => {
                        console.log('Camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                        setMapCenter(ev.detail.center)
                        setMapZoom(ev.detail.zoom)
                      }}
                    >
                      {/* Search location marker - removed as requested */}
                      
                      {/* Dealer markers */}
                      {filteredDealers.map((dealer) => (
                        <Marker
                          key={dealer.id}
                          position={{ lat: dealer.lat, lng: dealer.lng }}
                          title={dealer.company_name || dealer.name}
                          onClick={() => handleMarkerClick(dealer)}
                        />
                      ))}
                    </Map>
                  </APIProvider>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Kaart laden...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dealers List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dealers Lijst
              </h2>
              
              {filteredDealers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Geen dealers gevonden
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredDealers.map((dealer) => (
                    <div
                      key={dealer.id}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleDealerClick(dealer)}
                    >
                      <h3 className="font-medium text-gray-900 mb-2">
                        {dealer.company_name || dealer.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{dealer.address}</p>
                      {dealer.phone && (
                        <p className="text-sm text-gray-600 mb-1">
                          📞 <a href={`tel:${dealer.phone}`} className="text-green-600 hover:underline">
                            {dealer.phone}
                          </a>
                        </p>
                      )}
                      {dealer.email && (
                        <p className="text-sm text-gray-600 mb-1">
                          ✉️ <a href={`mailto:${dealer.email}`} className="text-green-600 hover:underline">
                            {dealer.email}
                          </a>
                        </p>
                      )}
                      {dealer.website && (
                        <p className="text-sm text-gray-600">
                          🌐 <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {dealer.website}
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Dealer Info Overlay */}
        {selectedDealer && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 max-w-sm mx-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDealer.company_name || selectedDealer.name}
                </h3>
                <button
                  onClick={closeDealerInfo}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">Adres:</span> {selectedDealer.address}
                </p>
                {selectedDealer.phone && (
                  <p className="text-gray-600">
                    <span className="font-medium">Telefoon:</span>{' '}
                    <a href={`tel:${selectedDealer.phone}`} className="text-green-600 hover:underline">
                      {selectedDealer.phone}
                    </a>
                  </p>
                )}
                {selectedDealer.email && (
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span>{' '}
                    <a href={`mailto:${selectedDealer.email}`} className="text-green-600 hover:underline">
                      {selectedDealer.email}
                    </a>
                  </p>
                )}
                {selectedDealer.website && (
                  <p className="text-gray-600">
                    <span className="font-medium">Website:</span>{' '}
                    <a href={selectedDealer.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {selectedDealer.website}
                    </a>
                  </p>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeDealerInfo}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 