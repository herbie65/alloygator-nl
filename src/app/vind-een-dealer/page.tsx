'use client'

import { useState, useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, MapCameraChangedEvent } from '@vis.gl/react-google-maps'

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

// Static dealer data
const staticDealers: Dealer[] = [
  {
    id: '1',
    name: 'Demo Dealer Amsterdam',
    address: 'Kalverstraat 1, Amsterdam',
    phone: '020-1234567',
    email: 'info@demo-dealer.nl',
    website: 'https://demo-dealer.nl',
    lat: 52.3676,
    lng: 4.9041,
    company_name: 'Demo Dealer Amsterdam',
    invoice_email: 'facturen@demo-dealer.nl'
  },
  {
    id: '2',
    name: 'Demo Dealer Rotterdam',
    address: 'Coolsingel 50, Rotterdam',
    phone: '010-1234567',
    email: 'info@demo-dealer-rotterdam.nl',
    website: 'https://demo-dealer-rotterdam.nl',
    lat: 51.9225,
    lng: 4.4792,
    company_name: 'Demo Dealer Rotterdam',
    invoice_email: 'facturen@demo-dealer-rotterdam.nl'
  }
]

// Static settings
const staticSettings: Settings = {
  id: '1',
  google_maps_api_key: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
  search_radius: 25
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
      // Use static settings
      setSettings(staticSettings)
      setDefaultSearchRadius(staticSettings.search_radius || 25)
      setSearchRadius(staticSettings.search_radius || 25)
      settingsLoaded.current = true
    }
    // Use static dealers
    setDealers(staticDealers)
    setFilteredDealers(staticDealers)
  }, [])

  useEffect(() => {
    console.log('mapCenter changed to:', mapCenter)
  }, [mapCenter])

  useEffect(() => {
    console.log('mapZoom changed to:', mapZoom)
  }, [mapZoom])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleSearch = async () => {
    if (!searchLocation.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchLocation)}`)
      const data = await response.json()

      if (response.ok && data.lat && data.lng) {
        setSearchResult(data)
        setMapCenter({ lat: data.lat, lng: data.lng })
        setMapZoom(10)

        // Filter dealers within search radius
        const nearbyDealers = dealers.filter(dealer => {
          const distance = calculateDistance(data.lat, data.lng, dealer.lat, dealer.lng)
          return distance <= searchRadius
        })

        setFilteredDealers(nearbyDealers)
      } else {
        alert('Locatie niet gevonden. Probeer een ander adres.')
      }
    } catch (error) {
      console.error('Error searching location:', error)
      alert('Fout bij het zoeken van locatie.')
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
    setMapCenter({ lat: dealer.lat, lng: dealer.lng })
    setMapZoom(12)
  }

  const handleMapError = () => {
    setMapError(true)
  }

  const handleMapLoad = (map: any) => {
    mapRef.current = map
  }

  const handleCameraChanged = (event: MapCameraChangedEvent) => {
    if (event.detail.center) {
      setMapCenter(event.detail.center)
    }
    if (event.detail.zoom) {
      setMapZoom(event.detail.zoom)
    }
  }

  const clearSearch = () => {
    setSearchLocation('')
    setSearchResult(null)
    setFilteredDealers(dealers)
    setMapCenter({ lat: 52.0, lng: 5.0 })
    setMapZoom(7)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vind een Dealer</h1>
          <p className="text-lg text-gray-600">
            Zoek naar AlloyGator dealers in jouw buurt
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek locatie
              </label>
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Voer een adres of plaats in..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoekradius (km)
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSearching ? 'Zoeken...' : 'Zoeken'}
              </button>
              <button
                onClick={clearSearch}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Wissen
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {searchResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">Zoekresultaat</h3>
            <p className="text-blue-800">{searchResult.formatted_address}</p>
            <p className="text-sm text-blue-600 mt-1">
              {filteredDealers.length} dealer(s) gevonden binnen {searchRadius} km
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 md:h-[600px]">
                {mapError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Kaart kon niet worden geladen</p>
                      <button
                        onClick={() => setMapError(false)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Opnieuw proberen
                      </button>
                    </div>
                  </div>
                ) : (
                  <APIProvider apiKey={settings?.google_maps_api_key || ''}>
                    <Map
                      mapId="dealer-map"
                      center={mapCenter}
                      zoom={mapZoom}
                      onCameraChanged={handleCameraChanged}
                      className="w-full h-full"
                    >
                      {filteredDealers.map((dealer) => (
                        <Marker
                          key={dealer.id}
                          position={{ lat: dealer.lat, lng: dealer.lng }}
                          onClick={() => handleMarkerClick(dealer)}
                        />
                      ))}
                    </Map>
                  </APIProvider>
                )}
              </div>
            </div>
          </div>

          {/* Dealer List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Dealers ({filteredDealers.length})
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredDealers.map((dealer) => (
                <div
                  key={dealer.id}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleDealerClick(dealer)}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{dealer.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{dealer.address}</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>📞 {dealer.phone}</p>
                    <p>✉️ {dealer.email}</p>
                    {dealer.website && (
                      <p>🌐 <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">{dealer.website}</a></p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dealer Info Modal */}
        {selectedDealer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedDealer.name}</h3>
                <button
                  onClick={closeDealerInfo}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600">{selectedDealer.address}</p>
                <p className="text-gray-600">📞 {selectedDealer.phone}</p>
                <p className="text-gray-600">✉️ {selectedDealer.email}</p>
                {selectedDealer.website && (
                  <p className="text-gray-600">
                    🌐 <a href={selectedDealer.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">{selectedDealer.website}</a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 