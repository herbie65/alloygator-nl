'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  rating?: number
  reviews?: number
  services: string[]
  created_at: string
}

// Static dealer data (in real app, this would come from Firebase)
const staticDealers: Dealer[] = [
  {
    id: '1',
    name: 'Auto Service Amsterdam',
    company_name: 'Auto Service Amsterdam B.V.',
    address: 'Amstelstraat 123',
    city: 'Amsterdam',
    postal_code: '1011 AB',
    phone: '020-1234567',
    email: 'info@autoserviceamsterdam.nl',
    website: 'https://autoserviceamsterdam.nl',
    latitude: 52.3676,
    longitude: 4.9041,
    is_active: true,
    rating: 4.5,
    reviews: 127,
    services: ['AlloyGator montage', 'Velg reparatie', 'Auto onderhoud'],
    created_at: '2024-01-01'
  },
  {
    id: '2',
    name: 'Velg Specialist Rotterdam',
    company_name: 'Velg Specialist Rotterdam',
    address: 'Rotterdamstraat 456',
    city: 'Rotterdam',
    postal_code: '3000 AA',
    phone: '010-9876543',
    email: 'info@velgspecialistrotterdam.nl',
    website: 'https://velgspecialistrotterdam.nl',
    latitude: 51.9225,
    longitude: 4.4792,
    is_active: true,
    rating: 4.8,
    reviews: 89,
    services: ['AlloyGator montage', 'Velg bescherming', 'Tire service'],
    created_at: '2024-01-01'
  },
  {
    id: '3',
    name: 'Den Haag Auto Center',
    company_name: 'Den Haag Auto Center B.V.',
    address: 'Haagseweg 789',
    city: 'Den Haag',
    postal_code: '2500 BB',
    phone: '070-5551234',
    email: 'info@denhaagautocenter.nl',
    website: 'https://denhaagautocenter.nl',
    latitude: 52.0705,
    longitude: 4.3007,
    is_active: true,
    rating: 4.2,
    reviews: 156,
    services: ['AlloyGator montage', 'Auto onderhoud', 'Velg service'],
    created_at: '2024-01-01'
  },
  {
    id: '4',
    name: 'Utrecht Velg Service',
    company_name: 'Utrecht Velg Service',
    address: 'Utrechtseweg 321',
    city: 'Utrecht',
    postal_code: '3500 CC',
    phone: '030-7778889',
    email: 'info@utrechtvelgservice.nl',
    website: 'https://utrechtvelgservice.nl',
    latitude: 52.0907,
    longitude: 5.1214,
    is_active: true,
    rating: 4.6,
    reviews: 203,
    services: ['AlloyGator montage', 'Velg reparatie', 'Tire fitting'],
    created_at: '2024-01-01'
  }
]

export default function VindEenDealerPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Load dealers from static data
    setDealers(staticDealers)
    setFilteredDealers(staticDealers)
    setLoading(false)

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

    if (selectedCity) {
      filtered = filtered.filter(dealer => dealer.city === selectedCity)
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
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'reviews':
          return (b.reviews || 0) - (a.reviews || 0)
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
  }, [dealers, searchTerm, selectedCity, selectedService, sortBy, userLocation])

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

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
    setSelectedCity('')
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vind een AlloyGator Dealer</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Zoek een erkende AlloyGator dealer bij jou in de buurt voor professionele montage en service
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoeken
              </label>
              <input
                type="text"
                placeholder="Zoek op naam, stad of adres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stad
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Alle steden</option>
                {getCities().map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Alle services</option>
                {getServices().map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorteren
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Naam A-Z</option>
                <option value="rating">Hoogste beoordeling</option>
                <option value="reviews">Meeste reviews</option>
                <option value="distance">Dichtstbij</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCity || selectedService) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                Alle filters wissen
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredDealers.length} dealer{filteredDealers.length !== 1 ? 's' : ''} gevonden
            {searchTerm && ` voor "${searchTerm}"`}
            {selectedCity && ` in ${selectedCity}`}
          </p>
        </div>

        {/* Dealers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDealers.map((dealer) => {
            const distance = userLocation ? 
              calculateDistance(userLocation.lat, userLocation.lng, dealer.latitude, dealer.longitude) : null

            return (
              <div key={dealer.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{dealer.name}</h3>
                      <p className="text-sm text-gray-600">{dealer.company_name}</p>
                    </div>
                    {dealer.rating && (
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= dealer.rating! ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-1 text-sm text-gray-600">
                          ({dealer.reviews})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-700">{dealer.address}</p>
                        <p className="text-sm text-gray-600">{dealer.postal_code} {dealer.city}</p>
                        {distance && (
                          <p className="text-xs text-gray-500 mt-1">
                            {distance.toFixed(1)} km van jouw locatie
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${dealer.phone}`} className="text-sm text-gray-700 hover:text-green-600">
                        {dealer.phone}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${dealer.email}`} className="text-sm text-gray-700 hover:text-green-600">
                        {dealer.email}
                      </a>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {dealer.services.map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <a
                      href={`https://maps.google.com/?q=${dealer.latitude},${dealer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center text-sm"
                    >
                      Route
                    </a>
                    {dealer.website && (
                      <a
                        href={dealer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-center text-sm"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredDealers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen dealers gevonden</h3>
            <p className="text-gray-600 mb-4">
              Probeer andere zoektermen of filters aan te passen.
            </p>
            <button
              onClick={clearFilters}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Alle filters wissen
            </button>
          </div>
        )}

        {/* Become a Dealer CTA */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Word AlloyGator Dealer</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Bent u geïnteresseerd om AlloyGator dealer te worden? Neem contact met ons op voor meer informatie over onze dealer programma's en voordelen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dealer-login"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Dealer Login
            </Link>
            <Link
              href="/contact"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Contact opnemen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 