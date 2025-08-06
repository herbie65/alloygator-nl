'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  adres: string
  postcode: string
  plaats: string
  land: string
  bedrijfsnaam?: string
  btwNummer?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
  }>
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      router.push('/auth/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      setUser(user)
      loadOrders(user.id)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const loadOrders = async (userId: string) => {
    try {
      const response = await fetch(`/api/orders?customerId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welkom, {user.voornaam}!
                </h1>
                <p className="text-gray-600 mt-2">
                  Beheer je account en bekijk je bestellingen
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overzicht
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Bestellingen
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profiel
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Totaal Bestellingen
                      </h3>
                      <p className="text-3xl font-bold text-green-600">
                        {orders.length}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Totaal Uitgegeven
                      </h3>
                      <p className="text-3xl font-bold text-blue-600">
                        €{orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">
                        Laatste Bestelling
                      </h3>
                      <p className="text-3xl font-bold text-orange-600">
                        {orders.length > 0 
                          ? new Date(orders[0].created_at).toLocaleDateString('nl-NL')
                          : 'Geen'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Snelle Acties
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link
                        href="/winkel"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
                      >
                        Nieuwe Bestelling
                      </Link>
                      <Link
                        href="/vind-een-dealer"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        Vind een Dealer
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mijn Bestellingen
                  </h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Je hebt nog geen bestellingen geplaatst.</p>
                      <Link
                        href="/winkel"
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Ga naar de winkel
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Bestelling #{order.order_number}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                €{order.total.toFixed(2)}
                              </p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                order.status === 'betaald' ? 'bg-green-100 text-green-800' :
                                order.status === 'nieuw' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.items.length} product{order.items.length !== 1 ? 'en' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Profielgegevens
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Persoonlijke Gegevens</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Naam:</span> {user.voornaam} {user.achternaam}</p>
                        <p><span className="font-medium">E-mail:</span> {user.email}</p>
                        <p><span className="font-medium">Telefoon:</span> {user.telefoon}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Adresgegevens</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Adres:</span> {user.adres}</p>
                        <p><span className="font-medium">Postcode:</span> {user.postcode}</p>
                        <p><span className="font-medium">Plaats:</span> {user.plaats}</p>
                        <p><span className="font-medium">Land:</span> {user.land}</p>
                      </div>
                    </div>
                    {user.bedrijfsnaam && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Bedrijfsgegevens</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Bedrijf:</span> {user.bedrijfsnaam}</p>
                          {user.btwNummer && (
                            <p><span className="font-medium">BTW-nummer:</span> {user.btwNummer}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 