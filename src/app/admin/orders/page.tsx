'use client'

import { useState, useEffect, useMemo } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface Order {
  id: string
  order_number: string
  rma_number?: string
  customer: {
    voornaam: string
    achternaam: string
    email: string
    telefoon: string
    adres: string
    plaats: string
    postcode: string
    land: string
    bedrijfsnaam?: string
  }
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  subtotal: number
  vat_amount: number
  shipping_cost: number
  total: number
  payment_method: string
  shipping_method: string
  status: 'nieuw' | 'verwerken' | 'verzonden' | 'afgerond' | 'annuleren'
  payment_status: 'open' | 'paid' | 'failed'
  created_at: string
  dealer_group?: string
  due_at?: string
  payment_terms_days?: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_PAYMENT_TOKEN || ''
  type SortKey = 'order_number' | 'customer' | 'items' | 'total' | 'status' | 'payment_status' | 'due_at' | 'created_at'
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Helper function to map old English status values to new Dutch status values
  const mapStatusToDutch = (status: string): Order['status'] => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'nieuw':
        return 'nieuw'
      case 'processing':
      case 'verwerken':
        return 'verwerken'
      case 'shipped':
      case 'verzonden':
        return 'verzonden'
      case 'delivered':
      case 'afgerond':
        return 'afgerond'
      case 'cancelled':
      case 'annuleren':
        return 'annuleren'
      default:
        return 'nieuw'
    }
  }

  const fetchOrders = async () => {
      try {
        setLoading(true)
        setError('')

        // Get all orders from Firebase
        const [data, returns] = await Promise.all([
          FirebaseService.getOrders(),
          FirebaseService.getDocuments('return_requests')
        ])
        console.log('Fetched orders:', data)
        const rmaByOrder: Record<string, any> = {}
        ;(returns || []).forEach((rr: any) => {
          const key = String(rr.orderNumber || rr.order_number || '').toLowerCase()
          if (!key) return
          // Keep the latest by created_at
          const prev = rmaByOrder[key]
          const getTs = (v:any)=> v ? +new Date(v) : 0
          if (!prev || getTs(rr.created_at) > getTs(prev.created_at)) rmaByOrder[key] = rr
        })
        
        if (data && data.length > 0) {
          // Transform the data to match the expected format
          const transformedOrders = data.map((order: any) => ({
            id: order.id,
            order_number: order.orderNumber || order.order_number || `ORD-${order.id}`,
            rma_number: (()=>{
              const k = String(order.orderNumber || order.order_number || '').toLowerCase()
              const rr = rmaByOrder[k]
              return rr?.rmaNumber || null
            })(),
            customer: order.customer || {
              voornaam: 'Onbekend',
              achternaam: 'Klant',
              email: 'onbekend@email.com',
              telefoon: 'Onbekend',
              adres: 'Onbekend',
              plaats: 'Onbekend',
              postcode: 'Onbekend',
              land: 'NL'
            },
            items: order.items || [],
            subtotal: order.subtotal || 0,
            vat_amount: order.vat_amount || 0,
            shipping_cost: order.shipping_cost || 0,
            total: order.total || 0,
            payment_method: order.payment_method || 'ideal',
            shipping_method: order.shipping_method || 'Standaard verzending',
            // Debug: log the original status from database
            status: (() => {
              console.log(`Order ${order.id} original status: ${order.status}`)
              return mapStatusToDutch(order.status)
            })(),
            payment_status: order.payment_status === 'pending' ? 'open' : (order.payment_status || 'open'),
            created_at: order.createdAt || order.created_at || new Date().toISOString(),
            dealer_group: order.dealer_group || null
          }))
          
          setOrders(transformedOrders)
          return
        }

        // If no orders found, show empty state
        setOrders([])
      } catch (error) {
        console.error('Error fetching orders:', error)
        setError('Er is een fout opgetreden bij het laden van bestellingen')
        setOrders([])
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const oldStatus = order.status
      console.log(`Updating order ${orderId} status from ${oldStatus} to ${newStatus}`)

      // Update local state immediately for better UX
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))

      // Try to update in Firebase
      try {
        // Update status in both new Dutch format and old English format for compatibility
        const updateData = {
          status: newStatus,
          // Also update old status field for backward compatibility
          old_status: oldStatus,
          updated_at: new Date().toISOString()
        }
        await FirebaseService.updateOrder(orderId, updateData)
        console.log(`Order status updated in Firebase: ${newStatus}`)
      } catch (error) {
        console.error('Firebase update failed:', error)
        // Revert local state if Firebase update fails
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: oldStatus } : order
        ))
        setError(`Fout bij bijwerken status in database: ${error}`)
        return
      }
      
      // Automatische acties bij status wijziging naar 'verwerken'
      if (newStatus === 'verwerken' && oldStatus === 'nieuw') {
        try {
          // 1. Genereer en verstuur factuur
          const invoiceResponse = await fetch('/api/invoices/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              customer: order.customer,
              items: order.items,
              subtotal: order.subtotal,
              vat_amount: order.vat_amount,
              shipping_cost: order.shipping_cost,
              total: order.total,
              shipping_method: order.shipping_method,
              payment_status: order.payment_status,
              created_at: order.created_at,
              payment_method: order.payment_method,
              payment_terms_days: order.payment_terms_days,
              due_at: order.due_at
            })
          })
          
          if (invoiceResponse.ok) {
            const result = await invoiceResponse.json()
            // Update order met factuur informatie
            setOrders(prev => prev.map(o => o.id === orderId ? { 
              ...o, 
              invoice_number: result.invoice_number,
              invoice_url: result.invoice_url,
              invoice_sent: true,
              invoice_sent_date: new Date().toISOString()
            } : o))
            console.log('Factuur automatisch gegenereerd en verzonden')
          }
          
          // 2. Voorraad reserveren (wordt automatisch gedaan door de workflow API)
          // 3. Status update email versturen (wordt al gedaan hieronder)
        } catch (workflowError) {
          console.error('Error in automatic workflow actions:', workflowError)
          // Don't fail the status update if workflow actions fail
        }
      }

      // Send status update email
      try {
        const response = await fetch('/api/email/status-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNumber: order.order_number,
            customerEmail: order.customer.email,
            customerName: `${order.customer.voornaam} ${order.customer.achternaam}`,
            oldStatus,
            newStatus
          }),
        })

        if (response.ok) {
          console.log('Status update email sent')
        } else {
          console.error('Failed to send status update email')
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError)
        // Don't fail the status update if email fails
      }

      // Success feedback
      console.log(`Order status successfully updated from ${oldStatus} to ${newStatus}`)
      setError('') // Clear any previous errors
     
      // Show success message
      setError(`Status succesvol bijgewerkt van ${oldStatus} naar ${newStatus}`)
      setTimeout(() => setError(''), 3000) // Clear after 3 seconds
     
      // Refresh orders to ensure UI is in sync with database
      await fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      setError('Fout bij het bijwerken van order status')
      // Revert local state on error
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: order.status } : order
      ))
    }
  }

  const handleMarkAsPaid = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      // Update local state immediately for better UX
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, payment_status: 'paid', status: 'verwerken' } : o
      ))

      // Try to update in Firebase
      try {
        const updateData = {
          payment_status: 'paid',
          status: 'verwerken',
          updated_at: new Date().toISOString()
        }
        await FirebaseService.updateOrder(orderId, updateData)
        console.log(`Order marked as paid and processing in Firebase: ${orderId}`)
      } catch (error) {
        console.error('Firebase update failed:', error)
        // Revert local state if Firebase update fails
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, payment_status: 'open', status: 'nieuw' } : o
        ))
        setError(`Fout bij bijwerken betaalstatus in database: ${error}`)
        return
      }

      // Automatische workflow acties bij status wijziging naar 'verwerken'
      try {
        // 1. Genereer en verstuur factuur
        const invoiceResponse = await fetch('/api/invoices/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order.id,
            customer: order.customer,
            items: order.items,
            subtotal: order.subtotal,
            vat_amount: order.vat_amount,
            shipping_cost: order.shipping_cost,
            total: order.total,
            shipping_method: order.shipping_method,
            payment_status: 'paid', // Nu betaald
            created_at: order.created_at,
            payment_method: order.payment_method,
            payment_terms_days: order.payment_terms_days,
            due_at: order.due_at
          })
        })
        
        if (invoiceResponse.ok) {
          const result = await invoiceResponse.json()
          // Update order met factuur informatie
          setOrders(prev => prev.map(o => o.id === orderId ? { 
            ...o, 
            invoice_number: result.invoice_number,
            invoice_url: result.invoice_url,
            invoice_sent: true,
            invoice_sent_date: new Date().toISOString()
          } : o))
          console.log('Factuur automatisch gegenereerd en verzonden')
        }
        
        // 2. Voorraad reserveren (wordt automatisch gedaan door de workflow API)
        // 3. Status update email versturen (wordt al gedaan hieronder)
      } catch (workflowError) {
        console.error('Error in automatic workflow actions:', workflowError)
        // Don't fail the payment update if workflow actions fail
      }

      // Send payment confirmation email
      try {
        const response = await fetch('/api/email/payment-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderNumber: order.order_number,
            customerEmail: order.customer.email,
            customerName: `${order.customer.voornaam} ${order.customer.achternaam}`,
            paymentMethod: order.payment_method,
            paymentStatus: 'paid', // Nu betaald
            total: order.total,
            createdAt: order.created_at,
            dueAt: order.due_at
          }),
        })

        if (response.ok) {
          console.log('Payment confirmation email sent')
        } else {
          console.error('Failed to send payment confirmation email')
        }
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError)
        // Don't fail the payment update if email fails
      }

      // Success feedback
      console.log(`Order marked as paid and processing`)
      setError('') // Clear any previous errors
     
      // Show success message
      setError(`Bestelling succesvol betaald en verwerkt - factuur gegenereerd`)
      setTimeout(() => setError(''), 3000) // Clear after 3 seconds
     
      // Refresh orders to ensure UI is in sync with database
      await fetchOrders()
    } catch (error) {
      console.error('Error marking order as paid:', error)
      setError('Fout bij het markeren van bestelling als betaald')
      // Revert local state on error
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, payment_status: 'open', status: 'nieuw' } : order
      ))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nieuw': return 'bg-yellow-100 text-yellow-800'
      case 'verwerken': return 'bg-green-100 text-green-800'
      case 'verzonden': return 'bg-purple-100 text-purple-800'
      case 'afgerond': return 'bg-green-100 text-green-800'
      case 'annuleren': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'nieuw': return 'Nieuw (wacht op betaling)'
      case 'verwerken': return 'Wordt verwerkt'
      case 'verzonden': return 'Verzonden'
      case 'afgerond': return 'Afgerond'
      case 'annuleren': return 'Geannuleerd'
      // Fallback voor oude Engelse status types
      case 'pending': return 'Nieuw (wacht op betaling)'
      case 'processing': return 'Wordt verwerkt'
      case 'shipped': return 'Verzonden'
      case 'delivered': return 'Afgerond'
      case 'cancelled': return 'Geannuleerd'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open'
      case 'paid': return 'Betaald'
      case 'failed': return 'Mislukt'
      default: return 'Onbekend'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bestellingen laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Bestellingen</h1>
        <p className="text-gray-600">Bekijk en verwerk bestellingen</p>
        <div className="mt-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            + Nieuwe Bestelling
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
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

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Behandeling</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.status === 'nieuw').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.payment_status === 'open').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Betaald</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(o => o.payment_status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
              <p className="text-2xl font-bold text-gray-900">
                €{orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bestellingen ({orders.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {[
                  { key: 'order_number', label: 'Bestelling' },
                  { key: 'created_at', label: 'Datum' },
                  { key: 'customer', label: 'Klant' },
                  { key: 'items', label: 'Producten' },
                  { key: 'total', label: 'Totaal' },
                  { key: 'status', label: 'Status' },
                  { key: 'payment_status', label: 'Betaling' },
                  { key: 'due_at', label: 'Vervaldatum' },
                ].map(col => (
                  <th key={col.key} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <button
                      onClick={() => {
                        setSortDir(prev => (sortKey === col.key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'))
                        setSortKey(col.key as SortKey)
                      }}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      <span>{col.label}</span>
                      <span className="text-gray-400 text-[10px]">
                        {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders
                .slice()
                .sort((a, b) => {
                  const dir = sortDir === 'asc' ? 1 : -1
                  switch (sortKey) {
                    case 'order_number':
                      return dir * (a.order_number.localeCompare(b.order_number))
                    case 'customer':
                      return dir * ((a.customer.voornaam + ' ' + a.customer.achternaam).localeCompare(b.customer.voornaam + ' ' + b.customer.achternaam))
                    case 'items':
                      return dir * (a.items.length - b.items.length)
                    case 'total':
                      return dir * (a.total - b.total)
                    case 'status':
                      return dir * (a.status.localeCompare(b.status))
                    case 'payment_status':
                      return dir * (a.payment_status.localeCompare(b.payment_status))
                    case 'due_at': {
                      const ad = a.due_at ? new Date(a.due_at).getTime() : 0
                      const bd = b.due_at ? new Date(b.due_at).getTime() : 0
                      return dir * (ad - bd)
                    }
                    case 'created_at':
                    default:
                      return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  }
                })
                .map((order) => (
                <tr key={order.id} className={`transition-colors duration-200 ${order.rma_number ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${order.rma_number ? 'bg-orange-500' : 'bg-gradient-to-r from-green-400 to-green-600'}`}>🛒</div>
                      <div className="ml-4 text-sm font-semibold text-gray-900">
                        #{order.order_number}
                        {order.rma_number && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-200 text-orange-900" title="Retouraanvraag geregistreerd">
                            RMA: {order.rma_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {order.customer.voornaam} {order.customer.achternaam}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer.email}
                    </div>
                    {order.customer.bedrijfsnaam && (
                      <div className="text-xs text-gray-400">
                        {order.customer.bedrijfsnaam}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items.length} product{order.items.length !== 1 ? 'en' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    €{order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.payment_method === 'invoice' && order.due_at ? (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${new Date(order.due_at) < new Date() && order.payment_status !== 'paid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {new Date(order.due_at).toLocaleDateString('nl-NL')}
                        {new Date(order.due_at) < new Date() && order.payment_status !== 'paid' ? ' • Te laat' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Vier hoofdknoppen: Bekijken, Verwerken, Verzenden, Annuleren */}
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                    >
                      Bekijken
                    </button>
                    {/* Betaald knop voor afhalen bestellingen met contant/pin betaling */}
                    {order.status === 'nieuw' && 
                     order.payment_status === 'open' && 
                     (order.payment_method === 'cash' || order.payment_method === 'pin') &&
                     (order.shipping_method?.toLowerCase().includes('afhalen') || 
                      order.shipping_method?.toLowerCase().includes('pickup') ||
                      order.shipping_method?.toLowerCase().includes('local')) && (
                      <button
                        onClick={() => handleMarkAsPaid(order.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                        title="Markeer als betaald (klant heeft contant/pin betaald bij afhalen)"
                      >
                        💰 Betaald
                      </button>
                    )}
                    {order.status === 'nieuw' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'verwerken')}
                        className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                      >
                        Verwerken
                      </button>
                    )}
                    {order.status === 'verwerken' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'verzonden')}
                        className="text-purple-600 hover:text-purple-900 mr-4 transition-colors duration-200"
                      >
                        Verzenden
                      </button>
                    )}
                    {order.status !== 'annuleren' && order.status !== 'afgerond' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'annuleren')}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        Annuleren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedOrder(null)
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchOrders() }}
        />
      )}
    </div>
  )
}

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order
  onClose: () => void
  onUpdateStatus: (orderId: string, status: Order['status']) => void
}

function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Bestelling #{order.order_number}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Klantgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Naam</label>
                <p className="text-sm text-gray-900">
                  {order.customer.voornaam} {order.customer.achternaam}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{order.customer.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefoon</label>
                <p className="text-sm text-gray-900">{order.customer.telefoon}</p>
              </div>
              {order.customer.bedrijfsnaam && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bedrijf</label>
                  <p className="text-sm text-gray-900">{order.customer.bedrijfsnaam}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Adres</label>
                <p className="text-sm text-gray-900">
                  {order.customer.adres}<br />
                  {order.customer.postcode} {order.customer.plaats}<br />
                  {order.customer.land}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Producten</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">€{item.price.toFixed(2)} per stuk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Samenvatting</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotaal:</span>
                <span className="font-medium">€{order.subtotal.toFixed(2)}</span>
              </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verzendkosten (excl. BTW):</span>
                  <span className="font-medium">€{order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BTW:</span>
                  <span className="font-medium">€{order.vat_amount.toFixed(2)}</span>
                </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-900">Totaal:</span>
                <span className="font-bold text-lg">€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Nummer</label>
                  <p className="text-sm text-gray-900">#{order.order_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum</label>
                  <p className="text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Betaalmethode</label>
                  <p className="text-sm text-gray-900">{order.payment_method}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verzendmethode</label>
                  <p className="text-sm text-gray-900">{order.shipping_method}</p>
                </div>
                {order.dealer_group && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dealer Groep</label>
                    <p className="text-sm text-gray-900">{order.dealer_group}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Betaal Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                    {getPaymentStatusText(order.payment_status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'nieuw': return 'bg-yellow-100 text-yellow-800'
    case 'verwerken': return 'bg-green-100 text-green-800'
    case 'verzonden': return 'bg-purple-100 text-purple-800'
    case 'afgerond': return 'bg-green-100 text-green-800'
    case 'annuleren': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'nieuw': return 'Nieuw (wacht op betaling)'
    case 'verwerken': return 'Wordt verwerkt'
    case 'verzonden': return 'Verzonden'
    case 'afgerond': return 'Afgerond'
    case 'annuleren': return 'Geannuleerd'
    // Fallback voor oude Engelse status types
    case 'pending': return 'Nieuw (wacht op betaling)'
    case 'processing': return 'Wordt verwerkt'
    case 'shipped': return 'Verzonden'
    case 'delivered': return 'Afgerond'
    case 'cancelled': return 'Geannuleerd'
    default: return status
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-yellow-100 text-yellow-800'
    case 'paid': return 'bg-green-100 text-green-800'
    case 'failed': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getPaymentStatusText(status: string) {
  switch (status) {
    case 'open': return 'Open'
    case 'paid': return 'Betaald'
    case 'failed': return 'Mislukt'
    default: return 'Onbekend'
  }
}

// Create Order Modal
function CreateOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [shippingMethods, setShippingMethods] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [customerGroups, setCustomerGroups] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const filteredCustomers = useMemo(() => {
    const q = (customerSearch || '').toLowerCase().trim()
    if (!q) return customers
    return customers.filter((c:any)=> {
      const name = (c.name || '').toLowerCase()
      const email = (c.email || '').toLowerCase()
      const contact = (`${c.contact_first_name||''} ${c.contact_last_name||''}`).toLowerCase()
      const company = (c.company_name || '').toLowerCase()
      return name.includes(q) || email.includes(q) || contact.includes(q) || company.includes(q)
    })
  }, [customers, customerSearch])
  const [items, setItems] = useState<Array<{productId:string; name:string; price:number; quantity:number}>>([])
  const [selectedShippingId, setSelectedShippingId] = useState<string>('local-pickup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, s, g] = await Promise.all([
          FirebaseService.getCustomers(),
          FirebaseService.getProducts(),
          FirebaseService.getSettings(),
          FirebaseService.getCustomerGroups()
        ])
        setCustomers(c || [])
        setProducts(p || [])
        setCustomerGroups(g || [])
        const cfg = Array.isArray(s) ? s[0] : (s || null)
        setSettings(cfg)
        const all = (cfg && cfg.shippingMethods) ? cfg.shippingMethods : []
        const enabledCarriers: string[] = (cfg && cfg.enabledCarriers) ? cfg.enabledCarriers : []
        const available = all.filter((m:any)=> m.enabled && (enabledCarriers.length === 0 || enabledCarriers.includes(m.carrier)))
        const defaultPickup = { id: 'local-pickup', name: 'Afhalen (Almere)', description: 'Gratis afhalen in Almere', price: 0, enabled: true, carrier: 'local', delivery_type: 'pickup_local' }
        const withPickup = [defaultPickup, ...available]
        const dedupById = Array.from(new Map(withPickup.map((m:any)=> [m.id, m])).values())
        setShippingMethods(dedupById)
        if (dedupById.length > 0) setSelectedShippingId(dedupById[0].id)
      } catch (e) {
        console.error(e)
        setError('Fout bij laden van data')
      }
    }
    load()
  }, [])

  const addItem = (productId: string) => {
    const product = products.find((p:any) => p.id === productId)
    if (!product) return
    setItems(prev => [...prev, { productId, name: product.name || product.title || 'Product', price: Number(product.price || 0), quantity: 1, vat_category: product.vat_category || 'standard' }])
  }
  const updateQty = (index: number, qty: number) => {
    setItems(prev => prev.map((it,i)=> i===index ? { ...it, quantity: Math.max(1, qty) } : it))
  }
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_,i)=> i!==index))
  }

  const subtotal = items.reduce((sum, it)=> sum + (it.price * it.quantity), 0)
  const selectedCustomer = customers.find((c:any)=> c.id === selectedCustomerId)
  const currentGroup = (() => {
    if (!selectedCustomer) return null
    const groupIdOrName = (selectedCustomer.dealer_group || '').toString().toLowerCase()
    if (!groupIdOrName) return null
    return customerGroups.find((g:any)=> g.id === selectedCustomer.dealer_group || (g.name||'').toLowerCase() === groupIdOrName) || null
  })()
  const discountPercent: number = currentGroup ? Number(currentGroup.discount_percentage || 0) : 0
  const discountAmount = (subtotal * discountPercent) / 100
  const discountedSubtotal = Math.max(0, subtotal - discountAmount)
  const shipping = (shippingMethods.find((m:any)=> m.id === selectedShippingId)?.price) || 0
  // VAT rates from settings (fallbacks to NL)
  const std = Number((settings && (settings.vatHighRate ?? settings.defaultVatRate)) ?? 21)
  const low = Number((settings && settings.vatLowRate) ?? 9)
  const zero = Number((settings && settings.vatZeroRate) ?? 0)
  const rateForCategory = (cat?: string) => {
    if (cat === 'reduced') return low
    if (cat === 'zero') return zero
    return std
  }
  // VAT per item (on net prices)
  const itemsVat = items.reduce((sum, it:any)=> {
    const netUnit = Number(it.price) * (1 - (discountPercent || 0)/100)
    const rate = rateForCategory(it.vat_category)
    return sum + netUnit * Number(it.quantity || 1) * (rate/100)
  }, 0)
  // VAT on shipping at standard rate
  const shippingVat = shipping * (std/100)
  const vat = itemsVat + shippingVat
  const total = discountedSubtotal + shipping + vat

  const handleCreate = async () => {
    try {
      setLoading(true)
      setError('')
      const customer = selectedCustomer
      if (!customer) { setError('Selecteer een klant'); setLoading(false); return }
      if (items.length === 0) { setError('Voeg minimaal één product toe'); setLoading(false); return }
      const method = shippingMethods.find((m:any)=> m.id === selectedShippingId)
      const order = {
        customer: {
          voornaam: customer.contact_first_name || customer.voornaam || customer.name || '',
          achternaam: customer.contact_last_name || '',
          email: customer.email,
          telefoon: customer.phone || '',
          adres: customer.address || '',
          postcode: customer.postal_code || '',
          plaats: customer.city || '',
          land: customer.country || 'NL',
        },
        // Sla netto prijzen per regel op in de order
        items: items.map((it:any) => ({ id: it.productId, name: it.name, price: Number((it.price * (1 - (discountPercent||0)/100)).toFixed(2)), quantity: it.quantity, vat_category: it.vat_category || 'standard' })),
        shipping_method: method?.name || 'Afhalen (Almere)',
        shipping_cost: method?.price || 0,
        shipping_carrier: method?.carrier || 'local',
        shipping_delivery_type: method?.delivery_type || 'pickup_local',
        // Netto subtotaal (na korting)
        subtotal: discountedSubtotal,
        vat_amount: vat,
        total,
        dealer_group: customer.dealer_group || null,
        dealer_discount_percent: discountPercent,
        dealer_discount_amount: discountAmount,
        created_at: new Date().toISOString(),
        status: 'nieuw',
        payment_status: 'open',
        payment_method: 'invoice',
        payment_terms_days: Number(customer.invoice_payment_terms_days || 14)
      }
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) })
      if (!res.ok) throw new Error('Bestelling aanmaken mislukt')
      onCreated()
    } catch (e:any) {
      setError(e.message || 'Fout bij aanmaken bestelling')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Nieuwe Bestelling</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h3 className="font-semibold text-gray-900 mb-2">Klant</h3>
              <input
                type="text"
                value={customerSearch}
                onChange={(e)=> setCustomerSearch(e.target.value)}
                placeholder="Zoek op naam of e‑mail..."
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <select value={selectedCustomerId} onChange={(e)=>setSelectedCustomerId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">— Selecteer klant —</option>
                {filteredCustomers
                  .map((c:any, idx:number)=> {
                    const group = customerGroups.find((g:any)=> g.id === c.dealer_group || (g.name||'').toLowerCase() === (c.dealer_group||'').toLowerCase())
                    const groupLabel = group ? ` • ${group.name}` : ''
                    return (
                      <option key={`${c.id || c.email || 'customer'}_${idx}`} value={c.id}>{(c.name || `${c.contact_first_name || ''} ${c.contact_last_name || ''}`).trim()} — {c.email}{groupLabel}</option>
                    )
                  })}
              </select>
              {selectedCustomer && (
                <div className="mt-2 text-xs text-gray-600">
                  Groep: <span className="font-medium">{(customerGroups.find((g:any)=> g.id === selectedCustomer.dealer_group || (g.name||'').toLowerCase() === (selectedCustomer.dealer_group||'').toLowerCase())?.name) || '-'}</span> • Korting: <span className="font-medium">{discountPercent}%</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Op rekening; betaaltermijn wordt overgenomen van klant (standaard 14 dagen).</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-2">Producten</h3>
              <div className="flex items-center space-x-2 mb-3">
                <select onChange={(e)=> e.target.value && (addItem(e.target.value), (e.target.value=''))} className="flex-1 px-3 py-2 border rounded">
                  <option value="">— Product toevoegen —</option>
                  {products.map((p:any)=> {
                    const base = Number(p.price || 0)
                    const net = base * (1 - (discountPercent||0)/100)
                    const label = discountPercent > 0 ? `${p.name || p.title} — €${net.toFixed(2)} (netto)` : `${p.name || p.title} — €${base.toFixed(2)}`
                    return (
                      <option key={p.id} value={p.id}>{label}</option>
                    )
                  })}
                </select>
              </div>
              <div className="space-y-2">
                {items.map((it, index)=> (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border rounded p-2">
                    <div className="text-sm text-gray-900">{it.name}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">€{(it.price * (1 - (discountPercent||0)/100)).toFixed(2)}</span>
                      <input type="number" min={1} value={it.quantity} onChange={(e)=>updateQty(index, parseInt(e.target.value || '1', 10))} className="w-16 px-2 py-1 border rounded text-sm" />
                      <button onClick={()=>removeItem(index)} className="text-red-600 text-sm">Verwijder</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Verzendmethode</h3>
              <div className="space-y-2">
                {shippingMethods.map((m:any)=> (
                  <label key={m.id} className="flex items-center justify-between border rounded p-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" name="shipping" checked={selectedShippingId===m.id} onChange={()=>setSelectedShippingId(m.id)} />
                      <span>{m.name}</span>
                    </div>
                    <span className="text-sm text-gray-700">{m.price === 0 ? 'Gratis' : `€${Number(m.price).toFixed(2)}`}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-2">Samenvatting</h3>
              <div className="bg-gray-50 rounded p-4 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotaal (excl. BTW)</span><span>€{discountedSubtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Verzendkosten (excl. BTW)</span><span>{shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-sm"><span>BTW</span><span>€{vat.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Totaal</span><span>€{total.toFixed(2)}</span></div>
                <div className="text-xs text-gray-600">Betaalmethode: Op rekening • Betaaltermijn: klantinstelling (standaard 14 dagen)</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">Annuleren</button>
            <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">{loading ? 'Aanmaken...' : 'Bestelling aanmaken'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
