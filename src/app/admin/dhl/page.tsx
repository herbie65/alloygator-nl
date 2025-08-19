'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import DHLCapabilitiesForm from '../components/DHLCapabilitiesForm'

interface DHLShipment {
  id: string
  order_number: string
  customer: {
    voornaam: string
    achternaam: string
    email: string
    adres: string
    postcode: string
    plaats: string
  }
  dhl_tracking_number?: string
  dhl_shipment_id?: string
  shipping_label_url?: string
  status: string
  created_at: string
}

export default function DHLAdminPage() {
  const [shipments, setShipments] = useState<DHLShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedShipment, setSelectedShipment] = useState<DHLShipment | null>(null)
  const [showShipmentModal, setShowShipmentModal] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [capabilities, setCapabilities] = useState<any[]>([])
  const [showCapabilitiesForm, setShowCapabilitiesForm] = useState(false)

  useEffect(() => {
    fetchDHLShipments()
  }, [])

  const fetchDHLShipments = async () => {
    try {
      setLoading(true)
      setError('')

      // Get all orders with DHL shipping method
      const orders = await FirebaseService.getOrders()
      const dhlOrders = orders.filter((order: any) => 
        order.shipping_method?.includes('dhl') || 
        order.shipping_carrier === 'dhl'
      )

      // Transform to DHL shipments format
      const dhlShipments = dhlOrders.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer: order.customer,
        dhl_tracking_number: order.dhl_tracking_number,
        dhl_shipment_id: order.dhl_shipment_id,
        shipping_label_url: order.shipping_label_url,
        status: order.status,
        created_at: order.created_at
      }))

      setShipments(dhlShipments)
    } catch (error: any) {
      setError(`Fout bij ophalen DHL shipments: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createShipment = async (orderId: string) => {
    try {
      setError('')
      setDebugData(null)
      
      // Store request data for debugging
      const requestData = { orderId }
      console.log('DHL Create Shipment Request:', requestData)
      
      const response = await fetch('/api/dhl/create-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      // Store debug data
      setDebugData({
        request: requestData,
        dhlApiCall: {
          url: 'https://api-gw.dhlparcel.nl/labels',
          method: 'POST',
          headers: {
            'Authorization': 'Bearer [REDACTED]',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: result.debug?.dhlApiCall?.body || 'Niet beschikbaar'
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: result
        },
        timestamp: new Date().toISOString()
      })

      if (response.ok) {
        // Refresh shipments
        fetchDHLShipments()
        setShowShipmentModal(false)
        setSelectedShipment(null)
      } else {
        setError(`Fout bij aanmaken DHL verzending: ${result.error}`)
        // Enable debug mode to show the error details
        setDebugMode(true)
      }
    } catch (error: any) {
      setError(`Fout bij aanmaken DHL verzending: ${error.message}`)
      setDebugMode(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nieuw': return 'bg-yellow-100 text-yellow-800'
      case 'verwerken': return 'bg-blue-100 text-blue-800'
      case 'verzonden': return 'bg-green-100 text-green-800'
      case 'afgerond': return 'bg-green-100 text-green-800'
      case 'annuleren': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'nieuw': return 'Nieuw'
      case 'verwerken': return 'Verwerken'
      case 'verzonden': return 'Verzonden'
      case 'afgerond': return 'Afgerond'
      case 'annuleren': return 'Geannuleerd'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">DHL shipments laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DHL Verzendingen</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCapabilitiesForm(!showCapabilitiesForm)}
              className={`px-4 py-2 rounded-md transition-colors ${
                showCapabilitiesForm 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {showCapabilitiesForm ? 'Capabilities Verbergen' : 'Capabilities Ophalen'}
            </button>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 rounded-md transition-colors ${
                debugMode 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {debugMode ? 'Debug Uit' : 'Debug Aan'}
            </button>
            <button
              onClick={fetchDHLShipments}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Vernieuwen
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Panel */}
        {debugMode && debugData && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Debug Informatie</h3>
              <button
                onClick={() => setDebugData(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Request Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Request Data</h4>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                    {JSON.stringify(debugData.request, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(debugData.request, null, 2))}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Kopieer Request Data
                </button>
              </div>

              {/* DHL API Call */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">DHL API Call</h4>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="mb-2">
                    <span className="text-xs font-medium">URL: </span>
                    <span className="text-xs text-blue-600">https://api-gw.dhlparcel.nl/labels</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium">Method: </span>
                    <span className="text-xs text-green-600">POST</span>
                  </div>
                  <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                    {JSON.stringify({
                      headers: {
                        'Authorization': 'Bearer [REDACTED]',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                      }
                    }, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify({
                    url: 'https://api-gw.dhlparcel.nl/labels',
                    method: 'POST',
                    headers: {
                      'Authorization': 'Bearer [REDACTED]',
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    }
                  }, null, 2))}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Kopieer DHL API Call
                </button>
              </div>

              {/* Response Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Response Data</h4>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="mb-2">
                    <span className="text-xs font-medium">Status: </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      debugData.response.status >= 200 && debugData.response.status < 300 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {debugData.response.status} {debugData.response.statusText}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-800 overflow-auto max-h-40">
                    {JSON.stringify(debugData.response.body, null, 2)}
                  </pre>
                </div>
                                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(debugData.response.body, null, 2))}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Kopieer Response Data
                  </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <strong>Timestamp:</strong> {debugData.timestamp}
              </div>
              <div className="text-xs text-gray-500">
                <strong>API Endpoint:</strong> /api/dhl/create-shipment
              </div>
            </div>
          </div>
        )}

        {/* Capabilities Form */}
        {showCapabilitiesForm && (
          <div className="mb-6">
            <DHLCapabilitiesForm 
              onCapabilitiesReceived={(data) => {
                setCapabilities(data)
                console.log('DHL Capabilities received:', data)
              }}
            />
            
            {/* Display Capabilities */}
            {capabilities.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Beschikbare DHL Services
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {capabilities.map((capability, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="font-medium text-gray-900">
                        {capability.name || capability.serviceName || `Service ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Code: {capability.key || capability.serviceCode || 'N/A'}
                      </div>
                      {capability.price && (
                        <div className="text-sm text-green-600 mt-1">
                          €{capability.price}
                        </div>
                      )}
                      {capability.deliveryTime && (
                        <div className="text-sm text-blue-600 mt-1">
                          {capability.deliveryTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">DHL Verzendingen ({shipments.length})</h2>
          </div>

          {shipments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen DHL Verzendingen</h3>
              <p className="text-gray-600">Er zijn nog geen bestellingen met DHL verzending.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Klant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DHL Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{shipment.order_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shipment.customer.voornaam} {shipment.customer.achternaam}
                        </div>
                        <div className="text-sm text-gray-500">{shipment.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shipment.status)}`}>
                          {getStatusText(shipment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shipment.dhl_tracking_number ? (
                          <div>
                            <div className="text-sm font-medium text-blue-600">
                              {shipment.dhl_tracking_number}
                            </div>
                            {shipment.shipping_label_url && (
                              <a
                                href={shipment.shipping_label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Download Label
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Geen tracking</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(shipment.created_at).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!shipment.dhl_tracking_number ? (
                          <button
                            onClick={() => createShipment(shipment.id)}
                            className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-colors"
                          >
                            Maak Verzending
                          </button>
                        ) : (
                          <a
                            href={`https://www.dhl.com/nl-nl/home/tracking/tracking-express.html?submit=1&tracking-id=${shipment.dhl_tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                          >
                            Track Pakket
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
