'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  customer: {
    voornaam: string
    achternaam: string
    email: string
    telefoon: string
    adres: string
    postcode: string
    plaats: string
    land: string
  }
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    sku?: string
  }>
  subtotal: number
  vat_amount: number
  shipping_cost: number
  total: number
  payment_method: string
  shipping_method: string
  status: string
  payment_status: string
  createdAt: string
  dealer_group?: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const fetched = await FirebaseClientService.getOrderById(orderId)
        if (fetched) {
          // Bugfix: ensure UI has orderNumber/createdAt even if DB lacked them historically
          const safe: any = fetched
          const orderNumber = safe.orderNumber || safe.order_number || safe.id
          const createdAt = safe.createdAt || safe.created_at || new Date().toISOString()
          setOrder({ ...(fetched as any), orderNumber, createdAt } as Order)
        } else {
          router.push('/winkel')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Bestelling laden...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Bestelling niet gevonden</h1>
          <Link href="/winkel" className="text-green-600 hover:text-green-700">
            Terug naar winkel
          </Link>
        </div>
      </div>
    )
  }

  const safeCustomer = {
    voornaam: order.customer?.voornaam || '',
    achternaam: order.customer?.achternaam || '',
    email: order.customer?.email || '',
    telefoon: order.customer?.telefoon || '',
    adres: order.customer?.adres || '',
    postcode: order.customer?.postcode || '',
    plaats: order.customer?.plaats || '',
    land: order.customer?.land || 'NL'
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'ideal': return 'iDEAL'
      case 'creditcard': return 'Creditcard'
      case 'banktransfer': return 'Bankoverschrijving'
      default: return method
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bestelling Bevestigd!</h1>
          <p className="text-lg text-gray-600">
            Bedankt voor uw bestelling. {safeCustomer.email ? `We hebben een bevestigingsemail gestuurd naar ${safeCustomer.email}` : 'We sturen u spoedig een bevestigingsemail.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelling Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bestelnummer</h3>
                  <p className="text-lg font-semibold text-gray-900">{order.orderNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Besteldatum</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(order.createdAt || new Date().toISOString()).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Betaalstatus</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'paid' ? 'Betaald' : 'In behandeling'}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Producten</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                          <div className="text-gray-400 text-xl">🛞</div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">Aantal: {item.quantity}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">€{item.price.toFixed(2)} per stuk</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-6 mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotaal</span>
                    <span>€{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Verzendkosten</span>
                    <span>€{order.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>BTW</span>
                    <span>€{order.vat_amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Totaal</span>
                      <span>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Klantgegevens</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Naam</h3>
                  <p className="text-gray-900">{`${safeCustomer.voornaam} ${safeCustomer.achternaam}`.trim() || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Email</h3>
                  <p className="text-gray-900">{safeCustomer.email || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Telefoon</h3>
                  <p className="text-gray-900">{safeCustomer.telefoon || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Adres</h3>
                  <p className="text-gray-900">
                    {(safeCustomer.adres || '—')}<br />
                    {(safeCustomer.postcode || '')} {(safeCustomer.plaats || '')}<br />
                    {safeCustomer.land}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment & Shipping */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Betaal- en Verzendinformatie</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Betaalmethode</h3>
                  <p className="text-gray-900">{getPaymentMethodName(order.payment_method)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Verzendmethode</h3>
                  <p className="text-gray-900">{order.shipping_method}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wat gebeurt er nu?</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Bestelling ontvangen</h4>
                    <p className="text-sm text-gray-500">Uw bestelling is succesvol ontvangen</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Wordt verwerkt</h4>
                    <p className="text-sm text-gray-500">We bereiden uw bestelling voor</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-500">Verzonden</h4>
                    <p className="text-sm text-gray-500">U ontvangt een verzendbevestiging</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-500">Afgeleverd</h4>
                    <p className="text-sm text-gray-500">Uw bestelling wordt afgeleverd</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Heeft u vragen?</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Neem contact met ons op via email of telefoon
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    📧 info@alloygator.nl
                  </p>
                  <p className="text-sm text-gray-600">
                    📞 085-3033400
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/winkel"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Verder Winkelen
            </Link>
            {order && (
              <a
                href={`/api/invoices/generate?id=${encodeURIComponent(order.id)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium"
              >
                Download factuur (PDF)
              </a>
            )}
            <Link
              href="/account"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Mijn Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 