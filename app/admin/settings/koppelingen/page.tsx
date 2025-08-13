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
        name: 'e-Boekhouden Username',
        key: process.env.NEXT_PUBLIC_EBOEKHOUDEN_USERNAME || '',
        description: 'Gebruikersnaam voor e-Boekhouden SOAP API',
        category: 'accounting',
        isConfigured: !!process.env.NEXT_PUBLIC_EBOEKHOUDEN_USERNAME,
        testUrl: '/api/accounting/eboekhouden/ping'
      },
      {
        name: 'e-Boekhouden Security Code 1',
        key: process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_1 || '',
        description: 'Eerste security code voor e-Boekhouden',
        category: 'accounting',
        isConfigured: !!process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_1
      },
      {
        name: 'e-Boekhouden Security Code 2',
        key: process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_2 || '',
        description: 'Tweede security code voor e-Boekhouden',
        category: 'accounting',
        isConfigured: !!process.env.NEXT_PUBLIC_EBOEKHOUDEN_SECURITY_CODE_2
      },
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return '💳'
      case 'maps': return '🗺️'
      case 'accounting': return '📊'
      case 'email': return '✉️'
      case 'shipping': return '🚚'
      default: return '🔗'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payment': return 'bg-green-100 text-green-800'
      case 'maps': return 'bg-blue-100 text-blue-800'
      case 'accounting': return 'bg-purple-100 text-purple-800'
      case 'email': return 'bg-orange-100 text-orange-800'
      case 'shipping': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'testing': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const groupedKeys = apiKeys.reduce((groups, key) => {
    if (!groups[key.category]) {
      groups[key.category] = []
    }
    groups[key.category].push(key)
    return groups
  }, {} as Record<string, ApiKey[]>)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Externe Koppelingen</h1>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {showKeys ? 'Verberg API Keys' : 'Toon API Keys'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Over deze pagina</h3>
          <p className="text-sm text-blue-700">
            Hier beheer je alle externe API koppelingen en integraties. API keys worden ingesteld via environment variables 
            (.env.local voor lokaal, secrets voor productie). Gebruik de test knoppen om verbindingen te controleren.
          </p>
        </div>

        {/* API Keys per categorie */}
        {Object.entries(groupedKeys).map(([category, keys]) => (
          <div key={category} className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-6">
              <span className="text-2xl mr-3">{getCategoryIcon(category)}</span>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {category === 'payment' ? 'Betalingen' :
                 category === 'maps' ? 'Kaarten' :
                 category === 'accounting' ? 'Boekhouding' :
                 category === 'email' ? 'E-mail' :
                 category === 'shipping' ? 'Verzending' : category}
              </h2>
            </div>

            <div className="space-y-4">
              {keys.map((apiKey) => (
                <div key={apiKey.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{apiKey.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category)}`}>
                          {category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          apiKey.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.isConfigured ? 'Geconfigureerd' : 'Niet ingesteld'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{apiKey.description}</p>
                      
                      {showKeys && (
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            API Key
                          </label>
                          <input
                            type="text"
                            value={apiKey.key}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm"
                            placeholder="Configureer via environment variables"
                          />
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col items-end space-y-2">
                      {apiKey.testUrl && (
                        <button
                          onClick={() => testConnection(apiKey)}
                          disabled={!apiKey.isConfigured || testResults[apiKey.name]?.status === 'testing'}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors text-sm"
                        >
                          {testResults[apiKey.name]?.status === 'testing' ? 'Testen...' : 'Test Verbinding'}
                        </button>
                      )}
                      
                      {testResults[apiKey.name] && testResults[apiKey.name].status !== 'idle' && (
                        <div className={`text-sm font-medium ${getStatusColor(testResults[apiKey.name].status)}`}>
                          {getStatusIcon(testResults[apiKey.name].status)} {testResults[apiKey.name].message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Environment Variables Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 Environment Variables</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Lokaal (.env.local)</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                <div># e-Boekhouden</div>
                <div>EBOEKHOUDEN_USERNAME=jouw_username</div>
                <div>EBOEKHOUDEN_SECURITY_CODE_1=code1</div>
                <div>EBOEKHOUDEN_SECURITY_CODE_2=code2</div>
                <div>EBOEKHOUDEN_TEST_MODE=true</div>
                <div></div>
                <div># Google Maps</div>
                <div>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=jouw_key</div>
                <div></div>
                <div># Mollie</div>
                <div>NEXT_PUBLIC_MOLLIE_API_KEY=jouw_live_key</div>
                <div>NEXT_PUBLIC_MOLLIE_TEST_API_KEY=jouw_test_key</div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Productie (Firebase)</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                <div># Via Firebase CLI</div>
                <div>firebase functions:config:set</div>
                <div>  eboekhouden.username="..."</div>
                <div>  eboekhouden.security_code_1="..."</div>
                <div>  eboekhouden.security_code_2="..."</div>
                <div></div>
                <div># Of via Firebase Console</div>
                <div># Functions → Config → Environment variables</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Belangrijke opmerkingen</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• API keys worden nooit in de code opgeslagen</li>
              <li>• Gebruik .env.local voor lokale ontwikkeling</li>
              <li>• Gebruik Firebase secrets voor productie</li>
              <li>• Test altijd eerst in test mode voordat je naar productie gaat</li>
              <li>• Bewaar API keys veilig en deel ze nooit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
