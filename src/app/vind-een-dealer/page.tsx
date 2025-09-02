'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FirebaseService } from '@/lib/firebase'
import SEO from '../components/SEO'
import { generateWebPageData } from '../lib/structured-data'

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Kaart laden...</p>
      </div>
    </div>
  )
})

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

  services: string[]
  created_at: string
  show_on_map?: boolean // Added for filtering
}

// Static dealer data (in real app, this would come from Firebase)
const staticDealers: Dealer[] = []

export default function VindEenDealerPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [searchRadius, setSearchRadius] = useState(30) // Default 30km
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedService, setSelectedService] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null)

    useEffect(() => {
    const loadDealers = async () => {
      try {
        setLoading(true)
        
        // First try to load customers who are dealers
        const customers = await FirebaseService.getCustomers()
        const allCustomerDealers = customers?.filter(customer => customer.is_dealer) || []
        const customerDealersWithLocation = allCustomerDealers.filter(customer => 
          customer.latitude && customer.longitude && customer.latitude !== 0 && customer.longitude !== 0
        )
        
        console.log(`Found ${allCustomerDealers.length} customer dealers total, ${customerDealersWithLocation.length} with valid coordinates`)
        
        const customerDealers = customerDealersWithLocation
          ?.map(customer => ({
            id: customer.id,
            name: customer.name,
            company_name: customer.company_name || customer.name,
            address: customer.address,
            city: customer.city,
            postal_code: customer.postal_code,
            phone: customer.phone,
            email: customer.email,
            website: customer.website || '',
            latitude: customer.latitude,
            longitude: customer.longitude,
            is_active: customer.status === 'active',
            show_on_map: customer.show_on_map !== false, // Default to true if not set

            services: ['AlloyGator montage', 'Velg service'],
            created_at: customer.created_at || new Date().toISOString()
          }))
          .filter(dealer => dealer.show_on_map) // Only show dealers that should be on map
          || []

        if (customerDealers.length > 0) {
          // Use customer dealers
          console.log(`Using ${customerDealers.length} customer dealers for map`)
          setDealers(customerDealers)
          setFilteredDealers(customerDealers)
        } else {
          // Try separate dealers collection as backup data source
          const firebaseDealers = await FirebaseService.getDealers()
          
          if (firebaseDealers && firebaseDealers.length > 0) {
            const filteredDealers = firebaseDealers.filter(dealer => dealer.show_on_map !== false)
            setDealers(filteredDealers)
            setFilteredDealers(filteredDealers)
          } else {
            // No dealers found in either collection
            console.log('No dealers found in customers or dealers collection')
            setDealers([])
            setFilteredDealers([])
          }
        }
      } catch (error) {
        console.error('Error loading dealers:', error)
        // Show empty list on error
        setDealers([])
        setFilteredDealers([])
      } finally {
        setLoading(false)
      }
    }

    loadDealers()

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
        }
      )
    }
  }, [])

  // Helper function to calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Function to search for a location and get coordinates
  const handleLocationSearch = async () => {
    if (!locationSearch.trim()) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearch)}&countrycodes=nl&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const location = data[0]
        const lat = parseFloat(location.lat)
        const lng = parseFloat(location.lon)
        setSearchCenter({ lat, lng })
      } else {
        alert('Locatie niet gevonden. Probeer een andere plaatsnaam.')
      }
    } catch (error) {
      console.error('Error searching location:', error)
      alert('Fout bij het zoeken naar de locatie.')
    }
  }

  useEffect(() => {
    // Filter dealers based on search criteria
    let filtered = dealers.filter(dealer => dealer.is_active)

    if (searchTerm) {
      filtered = filtered.filter(dealer =>
        dealer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by search center and radius
    if (searchCenter) {
      filtered = filtered.filter(dealer => {
        const distance = calculateDistance(
          searchCenter.lat, 
          searchCenter.lng, 
          dealer.latitude, 
          dealer.longitude
        )
        return distance <= searchRadius
      })
    }

    if (selectedService) {
      filtered = filtered.filter(dealer => 
        dealer.services.some(service => 
          service.toLowerCase().includes(selectedService.toLowerCase())
        )
      )
    }

    // Sort dealers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)


        case 'distance':
          if (userLocation) {
            const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
            const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
            return distanceA - distanceB
          }
          return 0
        default:
          return 0
      }
    })

    setFilteredDealers(filtered)
  }, [dealers, searchTerm, searchCenter, searchRadius, selectedService, sortBy, userLocation])



  const getCities = () => {
    const cities = [...new Set(dealers.map(dealer => dealer.city))]
    return cities.sort()
  }

  const getServices = () => {
    const allServices = dealers.flatMap(dealer => dealer.services)
    const uniqueServices = [...new Set(allServices)]
    return uniqueServices.sort()
  }

  const clearFilters = () => {
    setSearchTerm('')
    // setSelectedCity('') // Removed as selectedCity is no longer used
    setSelectedService('')
    setSortBy('name')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dealers laden...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title="Vind een Dealer - AlloyGator Montagepartners in Nederland en België"
        description="Altijd een AlloyGator dealer bij jou in de buurt. Professioneel netwerk van erkende dealers en montagepunten door heel Nederland en België."
        keywords="alloygator dealer, velgbescherming monteren, montagepartner nederland, belgie dealer netwerk, professionele montage velgbescherming"
        canonical="/vind-een-dealer"
        structuredData={generateWebPageData({
          name: "Vind een Dealer - AlloyGator Montagepartners",
          description: "Zoek een erkende AlloyGator dealer bij jou in de buurt",
          url: "/vind-een-dealer",
          breadcrumb: {
            items: [
              { name: "Home", url: "/" },
              { name: "Vind een Dealer", url: "/vind-een-dealer" }
            ]
          }
        })}
      />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vind een Dealer</h1>
          <h2 className="text-2xl font-semibold text-green-600 mb-4">AlloyGator Montagepartners in Nederland en België</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Altijd een AlloyGator dealer bij jou in de buurt
          </p>
        </div>



        {/* Location Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Location Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek locatie
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Plaatsnaam bijv. Amsterdam, Utrecht..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleLocationSearch}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Zoek
                </button>
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Radius (km)
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>

            {/* General Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek dealer
              </label>
              <input
                type="text"
                placeholder="Naam of bedrijf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

          </div>

          {searchCenter && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                Toont dealers binnen {searchRadius} km van {locationSearch}
                <button
                  onClick={() => setSearchCenter(null)}
                  className="ml-2 text-green-600 hover:text-green-800 underline"
                >
                  (Wissen)
                </button>
              </p>
            </div>
          )}
        </div>

        {/* 50/50 Layout: Map Links, Dealers Rechts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
          {/* Left: Map */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Kaart</h2>
            </div>
            <div className="h-[550px]">
              <MapComponent 
                dealers={filteredDealers}
                userLocation={userLocation}
                onDealerSelect={(dealer: Dealer | null) => setSelectedDealer(dealer)}
                selectedDealer={selectedDealer}
                searchCenter={searchCenter}
                searchRadius={searchRadius}
              />
            </div>
          </div>

          {/* Right: Dealers List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Dealers ({filteredDealers.length})
                </h2>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="name">Naam A-Z</option>
                  <option value="distance">Dichtstbij</option>
                </select>
              </div>
            </div>
            <div className="h-[550px] overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto">
              {filteredDealers.map((dealer) => {
                const distance = searchCenter ? 
                  calculateDistance(searchCenter.lat, searchCenter.lng, dealer.latitude, dealer.longitude) : 
                  userLocation ? calculateDistance(userLocation.lat, userLocation.lng, dealer.latitude, dealer.longitude) : null

                return (
                  <div 
                    key={dealer.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDealer(dealer)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{dealer.company_name}</h3>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <p>{dealer.address}</p>
                      <p>{dealer.postal_code} {dealer.city}</p>
                      {distance && (
                        <p className="text-green-600 font-medium">{distance.toFixed(1)} km</p>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <a 
                          href={`tel:${dealer.phone}`}
                          className="text-green-600 hover:text-green-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📞 {dealer.phone}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <a 
                          href={`mailto:${dealer.email}`}
                          className="text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✉️ {dealer.email}
                        </a>
                      </div>
                      {dealer.website && (
                        <div className="flex items-center">
                          <a 
                            href={dealer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🌐 Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {filteredDealers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Geen dealers gevonden</p>
                  {searchCenter && (
                    <p className="text-sm text-gray-400 mt-2">
                      Probeer een grotere radius of andere locatie
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informatie en voordelen */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Over ons dealer netwerk</h3>
            <p className="text-gray-700 mb-4 text-center">
              Wij werken met een professioneel netwerk van erkende dealers en montagepunten door heel Nederland en België. 
              Deze partners zijn speciaal getraind in de juiste installatie van AlloyGator velgbeschermers en garanderen een perfecte pasvorm en veilige montage.
            </p>
            <p className="text-gray-700 text-center">
              Gebruik onze online dealerzoeker om eenvoudig een montagepartner te vinden op basis van je postcode of woonplaats. 
              Laat je velgen professioneel beschermen door een expert bij jou in de buurt.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center">Waarom kiezen voor een erkende dealer?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h5 className="font-semibold text-gray-900">Vakkundige montage</h5>
                  <p className="text-gray-600 text-sm">Professionele installatie door getrainde specialisten</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h5 className="font-semibold text-gray-900">Advies over kleuren en maatvoering</h5>
                  <p className="text-gray-600 text-sm">Persoonlijk advies voor de beste keuze</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h5 className="font-semibold text-gray-900">Directe levering uit voorraad</h5>
                  <p className="text-gray-600 text-sm">Snelle beschikbaarheid van alle benodigde materialen</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <h5 className="font-semibold text-gray-900">Garantie op installatie</h5>
                  <p className="text-gray-600 text-sm">Volledige garantie op werk en materialen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
