'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    orders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const [products, customers, orders] = await Promise.all([
          FirebaseService.getProducts(),
          FirebaseService.getCustomers(),
          FirebaseService.getOrders()
        ])
        
        setStats({
          products: products.length,
          customers: customers.length,
          orders: orders.length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welkom bij het AlloyGator admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📦
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Producten</h3>
              <p className="text-3xl font-bold text-blue-600">
                {loading ? '...' : stats.products}
              </p>
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
              <p className="text-3xl font-bold text-green-600">
                {loading ? '...' : stats.customers}
              </p>
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
              <p className="text-3xl font-bold text-purple-600">
                {loading ? '...' : stats.orders}
              </p>
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
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-blue-900">Producten Beheren</h3>
            <p className="text-sm text-blue-700">Voeg, bewerk of verwijder producten</p>
          </a>
          <a 
            href="/admin/customers" 
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-green-900">Klanten Beheren</h3>
            <p className="text-sm text-green-700">Bekijk en beheer klantgegevens</p>
          </a>
          <a 
            href="/admin/orders" 
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-purple-900">Bestellingen</h3>
            <p className="text-sm text-purple-700">Bekijk en verwerk bestellingen</p>
          </a>
          <a 
            href="/admin/settings" 
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <h3 className="font-semibold text-orange-900">Instellingen</h3>
            <p className="text-sm text-orange-700">Configureer website instellingen</p>
          </a>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Systeem Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Database</h3>
              <p className="text-sm text-green-700">Firebase verbinding actief</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-900">Website</h3>
              <p className="text-sm text-green-700">Online en functioneel</p>
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
        </div>
      </div>
    </div>
  )
} 