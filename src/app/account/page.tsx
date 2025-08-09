'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'
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
  is_dealer: boolean
  dealer_group?: string
  created_at: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  created_at: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [groupTargets, setGroupTargets] = useState<Record<string, number>>({})
  const [setsSold, setSetsSold] = useState<number>(0)
  const [activities, setActivities] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    // Get session user
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      try { setUser(JSON.parse(currentUser)) } catch {}
    }
    setLoading(false)
  }, [])

  // Load targets and compute dealer progress
  useEffect(() => {
    const load = async () => {
      try {
        const groups = await FirebaseClientService.getCustomerGroups()
        const map: Record<string, number> = {}
        groups.forEach((g:any)=> { map[(g.name||'').toLowerCase()] = Number(g.annual_target_sets || 0) })
        setGroupTargets(map)
        if (!user) return
        // Load all orders for this user from Firestore
        const allOrders = await FirebaseClientService.getOrders()
        const myOrders = (allOrders as any[]).filter(o => (o.customer?.email === user.email)) as any[]
        // Map to Account Order interface
        const mapped: Order[] = myOrders.map((o:any)=> ({
          id: o.id,
          order_number: o.orderNumber || o.order_number || o.id,
          status: o.status || 'pending',
          payment_status: o.payment_status || 'open',
          total: Number(o.total || 0),
          created_at: o.createdAt || o.created_at || new Date().toISOString(),
          items: (o.items||[]).map((it:any)=> ({ name: it.name, quantity: Number(it.quantity||0), price: Number(it.price||0) }))
        }))
        setOrders(mapped)
        // Activities & documents
        try {
          const [acts, docs] = await Promise.all([
            FirebaseClientService.getActivitiesByEmail(user.email),
            FirebaseClientService.getCustomerDocumentsByEmail(user.email)
          ])
          setActivities(acts as any[])
          setDocuments(docs as any[])
        } catch {}
        if (user.is_dealer) {
          const start = new Date(year, 0, 1).getTime()
          const end = new Date(year + 1, 0, 1).getTime()
          const qty = myOrders
            .filter(o => { const t = new Date(o.createdAt || o.created_at || new Date()).getTime(); return t >= start && t < end })
            .flatMap(o => o.items || [])
            .filter((it: any) => { const c=(it.category||'').toLowerCase(); if(c==='alloygator-set') return true; const n=(it.name||'').toLowerCase(); return !c && n.includes('alloygator') && n.includes('set') })
            .reduce((s: number, it: any) => s + Number(it.quantity || 0), 0)
          setSetsSold(qty)
        }
      } catch {}
    }
    load()
  }, [user, year])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In behandeling'
      case 'processing': return 'Wordt verwerkt'
      case 'shipped': return 'Verzonden'
      case 'delivered': return 'Afgeleverd'
      case 'cancelled': return 'Geannuleerd'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Account laden...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Niet ingelogd</h1>
          <p className="text-gray-600 mb-6">U moet ingelogd zijn om uw account te bekijken.</p>
          <Link
            href="/login"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Inloggen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Account</h1>
          <p className="text-gray-600">Welkom terug, {user.voornaam}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold text-lg">
                    {user.voornaam.charAt(0)}{user.achternaam.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.voornaam} {user.achternaam}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.is_dealer && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                      Dealer
                    </span>
                  )}
                </div>
              </div>

              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overzicht', icon: '📊' },
                  { id: 'orders', label: 'Bestellingen', icon: '🛒' },
                  { id: 'profile', label: 'Profiel', icon: '👤' },
                  { id: 'addresses', label: 'Adressen', icon: '📍' },
                  { id: 'wishlist', label: 'Verlanglijst', icon: '❤️' },
                  { id: 'settings', label: 'Instellingen', icon: '⚙️' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full text-left text-sm text-red-600 hover:text-red-700">
                  Uitloggen
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                        <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Totale Uitgaven</p>
                        <p className="text-2xl font-bold text-gray-900">
                          €{orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Lid sinds</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  </div>

                   {user.is_dealer && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Dealer Target {year}</p>
                            <p className="text-2xl font-bold text-gray-900">
                    {setsSold} / {(() => { const g=(user.dealer_group||'').toLowerCase(); return groupTargets[g]||0 })()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <select value={year} onChange={(e)=>setYear(parseInt(e.target.value,10))} className="text-sm border rounded px-2 py-1">
                            {[year-1, year, year+1].map(y => (<option key={y} value={y}>{y}</option>))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 bg-gray-100 rounded h-2 overflow-hidden">
                        {(() => {
                          const g = (user.dealer_group || '').toLowerCase()
                          const target = groupTargets[g] || 0
                          const pct = target > 0 ? Math.min(100, Math.round((setsSold / target) * 100)) : 0
                          return <div className={`h-full ${pct>=100?'bg-green-500':pct>=50?'bg-yellow-500':'bg-red-500'}`} style={{ width: pct + '%' }} />
                        })()}
                      </div>
                       <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                         <div className="bg-gray-50 rounded p-4">
                           <div className="text-gray-500">Laatste bestelling</div>
                           <div className="font-medium text-gray-900">{orders[0] ? new Date(orders[0].created_at).toLocaleDateString('nl-NL') : '-'}</div>
                         </div>
                         <div className="bg-gray-50 rounded p-4">
                           <div className="text-gray-500">Openstaande status</div>
                           <div className="font-medium text-gray-900">{orders.find(o=>o.payment_status!=='paid') ? 'Open' : '—'}</div>
                         </div>
                         <div className="bg-gray-50 rounded p-4">
                           <div className="text-gray-500">Dealer groep</div>
                           <div className="font-medium text-gray-900">{user.dealer_group || '-'}</div>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recente Bestellingen</h2>
                  </div>
                  <div className="p-6">
                    {orders.length > 0 ? (
                      <div className="space-y-4">
                        {orders.slice(0, 3).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h3 className="font-medium text-gray-900">{order.order_number}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {orders.length > 3 && (
                          <Link
                            href="/account?tab=orders"
                            className="block text-center text-green-600 hover:text-green-700 font-medium"
                          >
                            Bekijk alle bestellingen
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">🛒</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen bestellingen</h3>
                        <p className="text-gray-600 mb-4">Start met winkelen om uw eerste bestelling te plaatsen.</p>
                        <Link
                          href="/winkel"
                          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                        >
                          Start met winkelen
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Mijn Bestellingen</h2>
                </div>
                <div className="p-6">
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium text-gray-900">{order.order_number}</h3>
                              <p className="text-sm text-gray-600">
                                Besteld op {new Date(order.created_at).toLocaleDateString('nl-NL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">€{order.total.toFixed(2)}</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.name} x{item.quantity}</span>
                                <span>€{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                            <Link
                              href={`/order-confirmation/${order.id}`}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              Bestelling bekijken
                            </Link>
                            <span className="text-sm text-gray-500">
                              Betaalstatus: {order.payment_status === 'paid' ? 'Betaald' : 'In behandeling'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📦</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Geen bestellingen gevonden</h3>
                      <p className="text-gray-600">U heeft nog geen bestellingen geplaatst.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Profielgegevens</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                    <input
                      type="text"
                      value={user.voornaam}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam</label>
                    <input
                      type="text"
                      value={user.achternaam}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                    <input
                      type="tel"
                      value={user.telefoon}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Profiel bewerken
                  </button>
                </div>
              </div>
            )}

            {/* Activities Tab (dealer-friendly) */}
            {activeTab === 'addresses' && user.is_dealer && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Bezoeken & Contactmomenten</h2>
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-600">Nog geen activiteiten geregistreerd.</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((a:any)=> (
                        <div key={a.id} className="border rounded p-3 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{a.type || 'activiteit'} — {new Date(a.date || a.created_at).toLocaleDateString('nl-NL')}</div>
                            <div className="text-gray-600">{a.notes || '-'}</div>
                          </div>
                          <span className="text-xs text-gray-500">{a.user || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenten</h2>
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-600">Nog geen documenten.</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((d:any)=> (
                        <div key={d.id} className="border rounded p-3 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{d.title || d.file_name || 'Document'}</div>
                            <div className="text-gray-600">Geüpload: {new Date(d.uploaded_at).toLocaleDateString('nl-NL')}</div>
                          </div>
                          {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-green-600 text-sm">Bekijken</a>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Adressen</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">Hoofdadres</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Standaard
                      </span>
                    </div>
                    <p className="text-gray-600">
                      {user.adres}<br />
                      {user.postcode} {user.plaats}<br />
                      {user.land}
                    </p>
                    <div className="mt-4 flex space-x-2">
                      <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                        Bewerken
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 text-sm">
                        Verwijderen
                      </button>
                    </div>
                  </div>
                  
                  <button className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-600 hover:text-gray-700 hover:border-gray-400 transition-colors">
                    + Nieuw adres toevoegen
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Verlanglijst</h2>
                
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">❤️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Verlanglijst is leeg</h3>
                  <p className="text-gray-600 mb-4">Voeg producten toe aan uw verlanglijst om ze later te bekijken.</p>
                  <Link
                    href="/winkel"
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Start met winkelen
                  </Link>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Instellingen</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Email voorkeuren</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Bestelling updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Nieuwsbrief</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-sm text-gray-700">Promotionele emails</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Privacy</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" defaultChecked />
                        <span className="text-sm text-gray-700">Cookies accepteren</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3" />
                        <span className="text-sm text-gray-700">Analytics tracking</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors">
                      Account verwijderen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 