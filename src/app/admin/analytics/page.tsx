'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  customer: {
    voornaam: string
    achternaam: string
    email: string
  }
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  total: number
  status: string
  created_at: string
}

interface AnalyticsData {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topProducts: Array<{
    name: string
    quantity: number
    revenue: number
  }>
  ordersByStatus: Record<string, number>
  revenueByMonth: Array<{
    month: string
    revenue: number
    orders: number
  }>
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = () => {
    // Load orders from localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]')
    
    // Filter orders by date range
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange))
    
    const filteredOrders = orders.filter((order: Order) => 
      new Date(order.created_at) >= daysAgo
    )

    // Calculate analytics
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((sum: number, order: Order) => sum + order.total, 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Top products
    const productStats: Record<string, { quantity: number; revenue: number }> = {}
    filteredOrders.forEach((order: Order) => {
      order.items.forEach((item) => {
        if (!productStats[item.name]) {
          productStats[item.name] = { quantity: 0, revenue: 0 }
        }
        productStats[item.name].quantity += item.quantity
        productStats[item.name].revenue += item.price * item.quantity
      })
    })

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Orders by status
    const ordersByStatus: Record<string, number> = {}
    filteredOrders.forEach((order: Order) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1
    })

    // Revenue by month
    const revenueByMonth: Record<string, { revenue: number; orders: number }> = {}
    filteredOrders.forEach((order: Order) => {
      const month = new Date(order.created_at).toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: 'long' 
      })
      if (!revenueByMonth[month]) {
        revenueByMonth[month] = { revenue: 0, orders: 0 }
      }
      revenueByMonth[month].revenue += order.total
      revenueByMonth[month].orders += 1
    })

    const revenueByMonthArray = Object.entries(revenueByMonth)
      .map(([month, stats]) => ({
        month,
        revenue: stats.revenue,
        orders: stats.orders
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    setAnalyticsData({
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topProducts,
      ordersByStatus,
      revenueByMonth: revenueByMonthArray
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analytics laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Verkoop statistieken en inzichten</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">Laatste 7 dagen</option>
                <option value="30">Laatste 30 dagen</option>
                <option value="90">Laatste 90 dagen</option>
                <option value="365">Laatste jaar</option>
              </select>
              <Link
                href="/admin"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Terug naar Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Bestellingen</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.totalOrders}</p>
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
                <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
                <p className="text-2xl font-bold text-gray-900">€{analyticsData?.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gemiddelde Bestelling</p>
                <p className="text-2xl font-bold text-gray-900">€{analyticsData?.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unieke Klanten</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(JSON.parse(localStorage.getItem('orders') || '[]').map((order: Order) => order.customer.email)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Producten</h3>
            <div className="space-y-4">
              {analyticsData?.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} verkocht</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">€{product.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bestellingen per Status</h3>
            <div className="space-y-4">
              {Object.entries(analyticsData?.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'pending' ? 'bg-yellow-400' :
                      status === 'paid' ? 'bg-green-400' :
                      status === 'shipped' ? 'bg-green-400' :
                      'bg-gray-400'
                    }`} />
                    <span className="capitalize text-gray-700">{status}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Omzet per Maand</h3>
          <div className="space-y-4">
            {analyticsData?.revenueByMonth.map((monthData) => (
              <div key={monthData.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{monthData.month}</p>
                  <p className="text-sm text-gray-600">{monthData.orders} bestellingen</p>
                </div>
                <p className="font-semibold text-gray-900">€{monthData.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 