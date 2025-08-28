'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  total: number
  customer: {
    voornaam: string
    achternaam: string
    email: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  createdAt: string
}

export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Probeer order op te halen uit localStorage of session
        const savedOrder = localStorage.getItem(`order_${orderId}`)
        if (savedOrder) {
          setOrder(JSON.parse(savedOrder))
        } else {
          // Fallback: toon basis order informatie
          setOrder({
            id: orderId,
            status: 'Bevestigd',
            total: 0,
            customer: {
              voornaam: 'Klant',
              achternaam: '',
              email: ''
            },
            items: [],
            createdAt: new Date().toISOString()
          })
        }
      } catch (err) {
        setError('Fout bij laden order informatie')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Order wordt geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Fout bij laden order</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Terug naar Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bestelling Bevestigd!</h1>
          <p className="text-gray-600">Bedankt voor je bestelling. Je ontvangt een bevestiging per e-mail.</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Order ID:</span>
              <span className="ml-2 text-gray-900">{order?.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <span className="ml-2 text-green-600 font-medium">{order?.status}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Datum:</span>
              <span className="ml-2 text-gray-900">
                {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('nl-NL') : 'Vandaag'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Totaal:</span>
              <span className="ml-2 text-gray-900">€{order?.total || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {order?.customer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Klantgegevens</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Naam:</span>
                <span className="ml-2 text-gray-900">
                  {order.customer.voornaam} {order.customer.achternaam}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">E-mail:</span>
                <span className="ml-2 text-gray-900">{order.customer.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Volgende Stappen</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• Je ontvangt een bevestiging per e-mail</li>
            <li>• De bestelling wordt verwerkt en verzonden</li>
            <li>• Je kunt de status van je bestelling volgen</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 text-center"
          >
            Terug naar Home
          </Link>
          <Link 
            href="/winkel" 
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 text-center"
          >
            Verder Winkelen
          </Link>
        </div>
      </div>
    </div>
  )
}
