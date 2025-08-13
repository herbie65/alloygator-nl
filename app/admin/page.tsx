'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const [prods, custs, ords] = await Promise.all([
          FirebaseClientService.getProducts().catch(() => []),
          FirebaseClientService.getCustomers().catch(() => []),
          FirebaseClientService.getOrders().catch(() => [])
        ])
        if (!isMounted) return
        setStats({ products: prods.length || 0, customers: custs.length || 0, orders: ords.length || 0 })
      } catch (e: any) {
        if (!isMounted) return
        setError(e?.message || 'Onbekende fout bij laden dashboard cijfers')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welkom bij het AlloyGator admin panel - Live database cijfers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              📦
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Producten</h3>
              <p className="text-3xl font-bold text-green-600">{loading ? '…' : stats.products}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              👥
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Klanten</h3>
              <p className="text-3xl font-bold text-green-600">{loading ? '…' : stats.customers}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              🛒
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Bestellingen</h3>
              <p className="text-3xl font-bold text-purple-600">{loading ? '…' : stats.orders}</p>
              {!loading && (
                <p className="text-xs text-gray-500">Live updates</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/admin/products" 
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-green-900">Producten Beheren</h3>
            <p className="text-sm text-green-700">Voeg, bewerk of verwijder producten</p>
          </a>
          <a 
            href="/admin/customers" 
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-green-900">Klanten Beheren</h3>
            <p className="text-sm text-green-700">Bekijk en beheer klantgegevens</p>
          </a>
          <a 
            href="/admin/customer-groups" 
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-purple-900">Klantgroepen</h3>
            <p className="text-sm text-purple-700">Beheer klantgroepen en kortingen</p>
          </a>
          <a 
            href="/admin/orders" 
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-orange-900">Bestellingen</h3>
            <p className="text-sm text-orange-700">Bekijk en verwerk bestellingen</p>
          </a>
          <a 
            href="/admin/users" 
            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-gray-900">Gebruikers</h3>
            <p className="text-sm text-gray-700">Beheer backend gebruikers</p>
          </a>
          <a 
            href="/admin/settings" 
            className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-yellow-900">Instellingen</h3>
            <p className="text-sm text-yellow-700">Configureer website instellingen</p>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Systeem Status</h2>
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
              Fout bij laden dashboard-data: {error}
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Website</h3>
              <p className="text-sm text-green-700">Lokaal draaiend op localhost:3001</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Admin Panel</h3>
              <p className="text-sm text-green-700">Volledig operationeel</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-yellow-900">Database</h3>
              <p className="text-sm text-yellow-700">Firebase verbinding beschikbaar</p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h3 className="font-semibold text-green-900 mb-2">ℹ️ Informatie</h3>
        <p className="text-sm text-green-700">
          Deze admin sectie draait lokaal. De data wordt opgehaald van Firebase als database service. 
          Als er geen data wordt getoond, kan dit betekenen dat de database leeg is of dat er connectiviteitsproblemen zijn.
        </p>
      </div>
    </div>
  )
} 