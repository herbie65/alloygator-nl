'use client'

import { useState, useEffect } from 'react'

interface ApiKey {
  name: string
  key: string
  description: string
  category: 'payment' | 'maps' | 'accounting' | 'email' | 'shipping'
  isConfigured: boolean
  testUrl?: string
}

export default function KoppelingenPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message: string }>>({})
  const [showKeys, setShowKeys] = useState(false)

  useEffect(() => {
    // Initialize API keys from environment variables
    const keys: ApiKey[] = [
      {
        name: 'Google Maps API Key',
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        description: 'API key voor Google Maps integratie (dealer locator)',
        category: 'maps',
        isConfigured: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      {
        name: 'Mollie API Key',
        key: process.env.NEXT_PUBLIC_MOLLIE_API_KEY || '',
        description: 'Live API key voor Mollie betalingen',
        category: 'payment',
        isConfigured: !!process.env.NEXT_PUBLIC_MOLLIE_API_KEY
      },
      {
        name: 'Mollie Test API Key',
        key: process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY || '',
        description: 'Test API key voor Mollie betalingen (ontwikkeling)',
        category: 'payment',
        isConfigured: !!process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY
      },
      {
        name: 'DHL API Key',
        key: process.env.NEXT_PUBLIC_DHL_API_KEY || '',
        description: 'API key voor DHL verzendingen',
        category: 'shipping',
        isConfigured: !!process.env.NEXT_PUBLIC_DHL_API_KEY
      },
      {
        name: 'SendGrid API Key',
        key: process.env.NEXT_PUBLIC_SENDGRID_API_KEY || '',
        description: 'API key voor SendGrid e-mail service',
        category: 'email',
        isConfigured: !!process.env.NEXT_PUBLIC_SENDGRID_API_KEY
      }
    ]

    setApiKeys(keys)
    
    // Initialize test results
    const initialTestResults: Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message: string }> = {}
    keys.forEach(key => {
      if (key.testUrl) {
        initialTestResults[key.name] = { status: 'idle', message: '' }
      }
    })
    setTestResults(initialTestResults)
  }, [])

  const testConnection = async (apiKey: ApiKey) => {
    if (!apiKey.testUrl) return

    setTestResults(prev => ({
      ...prev,
      [apiKey.name]: { status: 'testing', message: 'Bezig met testen...' }
    }))

    try {
      const response = await fetch(apiKey.testUrl)
      const data = await response.json()
      
      if (data.ok || response.ok) {
        setTestResults(prev => ({
          ...prev,
          [apiKey.name]: { status: 'success', message: '✅ Verbinding succesvol!' }
        }))
      } else {
        setTestResults(prev => ({
          ...prev,
          [apiKey.name]: { status: 'error', message: `❌ Verbinding mislukt: ${data.message || 'Onbekende fout'}` }
        }))
      }
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [apiKey.name]: { status: 'error', message: `❌ Fout bij testen: ${error.message}` }
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'testing': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'testing': return '⏳'
      default: return '❓'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return '💳'
      case 'maps': return '🗺️'
      case 'accounting': return '📊'
      case 'email': return '📧'
      case 'shipping': return '🚚'
      default: return '🔗'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payment': return 'bg-purple-100 text-purple-800'
      case 'maps': return 'bg-blue-100 text-blue-800'
      case 'accounting': return 'bg-green-100 text-green-800'
      case 'email': return 'bg-yellow-100 text-yellow-800'
      case 'shipping': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Externe Koppelingen</h1>
        
        {/* Information Box */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">ℹ️</span>
            <h2 className="text-xl font-semibold text-gray-900">Over deze pagina</h2>
          </div>
          <p className="text-gray-700 mb-4">
            Deze pagina beheert externe API verbindingen en integraties. API keys worden ingesteld via environment variabelen 
            (<code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> voor lokaal, secrets voor productie).
          </p>
          <p className="text-gray-700">
            Gebruik de test knoppen om verbindingen te controleren voordat je ze in productie gebruikt.
          </p>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {showKeys ? 'Verberg API Keys' : 'Toon API Keys'}
            </button>
          </div>
        </div>

        {/* API Keys Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.name} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(apiKey.category)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{apiKey.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(apiKey.category)}`}>
                      {apiKey.category}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{apiKey.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    apiKey.isConfigured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {apiKey.isConfigured ? '✅ Geconfigureerd' : '❌ Niet geconfigureerd'}
                  </span>
                </div>
                
                {apiKey.testUrl && (
                  <button
                    onClick={() => testConnection(apiKey)}
                    disabled={testResults[apiKey.name]?.status === 'testing'}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-md text-sm transition-colors"
                  >
                    {testResults[apiKey.name]?.status === 'testing' ? 'Testen...' : 'Test'}
                  </button>
                )}
              </div>
              
              {testResults[apiKey.name] && testResults[apiKey.name].status !== 'idle' && (
                <div className="mt-3 p-2 rounded-md bg-gray-50">
                  <div className={`flex items-center text-sm ${getStatusColor(testResults[apiKey.name].status)}`}>
                    <span className="mr-2">{getStatusIcon(testResults[apiKey.name].status)}</span>
                    {testResults[apiKey.name].message}
                  </div>
                </div>
              )}
              
              {showKeys && (
                <div className="mt-3 p-2 bg-gray-100 rounded-md">
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {apiKey.key || 'Niet ingesteld'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No API Keys Message */}
        {apiKeys.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔗</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen API Keys Geconfigureerd</h3>
            <p className="text-gray-600">Voeg environment variabelen toe om API integraties te configureren.</p>
          </div>
        )}
      </div>
    </div>
  )
}
