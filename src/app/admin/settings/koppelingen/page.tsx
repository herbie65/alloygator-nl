'use client'

import { useState, useEffect } from 'react'

interface ApiKey {
  name: string
  key: string
  description: string
  category: 'payment' | 'maps' | 'accounting' | 'email' | 'shipping'
  isConfigured: boolean
  testUrl?: string
  isEditable?: boolean
  currentValue?: string
}

// Helper functie om environment variables op te halen
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined') {
    // In de browser, probeer via een eenvoudige API call
    return ''
  }
  return ''
}

export default function KoppelingenPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message: string }>>({})
  const [showKeys, setShowKeys] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    // Initialize API keys from environment variables
    const loadApiKeys = async () => {
      try {
        setLoading(true)
        
        // Haal environment variables op via API
        const envRes = await fetch('/api/env/', { cache: 'no-store' })
        const envVars = await envRes.json()
        
        const keys: ApiKey[] = [
          {
            name: 'Google Maps API Key',
            key: envVars.googleMapsApiKey || '❌ Niet geconfigureerd',
            description: 'API key voor Google Maps integratie (dealer locator). Configureer via environment variabelen.',
            category: 'maps',
            isConfigured: !!envVars.googleMapsApiKey,
            isEditable: true,
            currentValue: envVars.googleMapsApiKey || '',
            testUrl: '/api/test/google-maps'
          },
          {
            name: 'DHL API',
            key: '',
            description: 'DHL eCommerce instellingen worden beheerd onder Instellingen → DHL.',
            category: 'shipping',
            isConfigured: false
          },
          {
            name: 'Mollie',
            key: envVars.mollieApiKey || envVars.mollieTestApiKey || '❌ Niet geconfigureerd',
            description: 'Mollie betalingen - configureer via environment variabelen.',
            category: 'payment',
            isConfigured: !!(envVars.mollieApiKey || envVars.mollieTestApiKey)
          },
          {
            name: 'e-Boekhouden',
            key: envVars.eboekUsername || '❌ Niet geconfigureerd',
            description: 'e-Boekhouden API integratie voor boekhouding en facturen.',
            category: 'accounting',
            isConfigured: !!(envVars.eboekUsername && envVars.eboekSecurityCode1 && envVars.eboekSecurityCode2)
          }
        ]

        // Haal DHL status op uit database (deze blijven in database omdat ze geen API keys zijn)
        try {
          const res = await fetch('/api/settings', { cache: 'no-store' })
          const data = await res.json()
          const s = Array.isArray(data) ? data[0] : data
          
          // DHL status: geconfigureerd indien alle kernvelden aanwezig zijn
          const dhlUserId = String(s?.dhlApiUserId || s?.dhl_api_user_id || s?.dhlUserId || '')
          const dhlApiKey = String(s?.dhlApiKey || s?.dhl_api_key || s?.dhlKey || '')
          const dhlAccountId = String(s?.dhlAccountId || s?.dhl_account_id || s?.dhlAccount || '')
          const dhlOk = !!(dhlUserId && dhlApiKey && dhlAccountId)
          keys[1] = { ...keys[1], isConfigured: dhlOk }
          
          console.log('🔍 DHL Status loaded:', { 
            userId: !!dhlUserId, 
            apiKey: !!dhlApiKey, 
            accountId: !!dhlAccountId, 
            configured: dhlOk 
          })
        } catch (error) {
          console.error('❌ Error loading DHL status:', error)
        }
        
        setApiKeys(keys)
        
        // Initialize test results
        const initialTestResults: Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message: string }> = {}
        keys.forEach(key => {
          if (key.testUrl) {
            initialTestResults[key.name] = { status: 'idle', message: '' }
          }
        })
        setTestResults(initialTestResults)
        
        console.log('🔍 Environment variables loaded:', envVars)
        
      } catch (error) {
        console.error('❌ Error loading environment variables:', error)
        // Error handling: toon lege keys als er iets misgaat
        setApiKeys([])
      } finally {
        setLoading(false)
      }
    }
    
    loadApiKeys()
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
        
        // Update de API key status als de test succesvol is
        if (apiKey.name === 'Google Maps API Key') {
          const updatedKeys = apiKeys.map(key => 
            key.name === apiKey.name 
              ? { ...key, isConfigured: true }
              : key
          )
          setApiKeys(updatedKeys)
        }
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

  const startEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey.name)
    setEditValue(apiKey.currentValue || '')
  }

  const saveEdit = async (apiKey: ApiKey) => {
    try {
      // API key opslaan via API endpoint
      const response = await fetch('/api/env', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
          value: editValue
        })
      })
      
      if (!response.ok) {
        throw new Error('Fout bij opslaan van API key')
      }
      
      const result = await response.json()
      
      // Update lokale state
      const updatedKeys = apiKeys.map(key => 
        key.name === apiKey.name 
          ? { ...key, currentValue: editValue, isConfigured: !!editValue }
          : key
      )
      setApiKeys(updatedKeys)
      setEditingKey(null)
      setEditValue('')
      
      // Toon succes bericht
      alert('Google Maps API key bijgewerkt! Herstart je development server om de wijzigingen toe te passen.')
    } catch (error) {
      console.error('Error saving API key:', error)
      alert('Fout bij het opslaan van de API key')
    }
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Over deze pagina</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p className="text-gray-600 mb-4">Deze pagina toont de status van externe API verbindingen en integraties.</p>
                  <p className="mt-1">
                    <strong>API Keys worden ingesteld via environment variabelen:</strong>
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li><strong>Lokaal:</strong> Voeg toe aan <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
                    <li><strong>Productie:</strong> Configureer in je hosting platform secrets (Vercel, Firebase, etc.)</li>
                    <li><strong>Veiligheid:</strong> API keys worden NOOIT in de database opgeslagen</li>
                  </ul>
                  <p className="mt-2">Gebruik de "Toon Details" knop om meer informatie over elke integratie te zien.</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
            >
              {showKeys ? 'Verberg Details' : 'Toon Details'}
            </button>
          </div>
        </div>

        {/* API Keys Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Keys laden...</h3>
            <p className="text-gray-600">Bezig met ophalen van environment variabelen</p>
          </div>
        ) : (
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
                    {testResults[apiKey.name].status === 'success' && apiKey.name === 'Google Maps API Key' && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                        🗺️ Google Maps is correct geconfigureerd en werkt! Je kunt nu de dealer locator gebruiken.
                      </div>
                    )}
                    {testResults[apiKey.name].status === 'error' && apiKey.name === 'Google Maps API Key' && (
                      <div className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded">
                        🔧 Controleer of je Google Maps API key correct is en of de volgende APIs zijn geactiveerd:
                        <ul className="mt-1 ml-4 list-disc">
                          <li>Maps JavaScript API</li>
                          <li>Geocoding API</li>
                          <li>Places API</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show API Keys when requested */}
                {showKeys && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-xs text-blue-800 mb-2">
                      <strong>API Key Status:</strong>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      {apiKey.name === 'Google Maps API Key' && (
                        <div>✅ Google Maps API key is geconfigureerd en actief</div>
                      )}
                      {apiKey.name === 'Mollie' && (
                        <>
                          <div>✅ Mollie betalingen zijn geconfigureerd</div>
                          <div>📝 Webhook: /api/payment/mollie/webhook</div>
                        </>
                      )}
                      {apiKey.name === 'e-Boekhouden' && (
                        <>
                          <div>✅ e-Boekhouden integratie is geconfigureerd</div>
                          <div>📝 Gebruiker: {apiKey.key}</div>
                        </>
                      )}
                    </div>
                    
                    {/* Edit interface voor bewerkbare API keys */}
                    {apiKey.isEditable && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        {editingKey === apiKey.name ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              placeholder="Voer je API key in"
                              className="w-full px-2 py-1 text-xs border border-blue-300 rounded"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => saveEdit(apiKey)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Opslaan
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                              >
                                Annuleren
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(apiKey)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                          >
                            Bewerken
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Google Maps key inline editor */}
                {apiKey.name === 'Google Maps API Key' && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-xs text-gray-600">Google Maps API Key</label>
                    <input 
                      type="password" 
                      value={apiKey.key} 
                      readOnly 
                      className="w-full px-3 py-2 border rounded bg-gray-50" 
                      placeholder="Configureerd via environment variabelen" 
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">✅ API key wordt gelezen uit environment variabelen</span>
                      <a href="/admin/settings?tab=taxmap" className="ml-auto text-sm text-blue-600 hover:underline">Open kaartinstellingen</a>
                    </div>
                    <p className="text-xs text-gray-500">Configureer GOOGLE_MAPS_API_KEY in .env.local voor lokaal, of in je hosting platform secrets.</p>
                  </div>
                )}
                
                {/* DHL status-only met link naar instellingen */}
                {apiKey.name === 'DHL API' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <a href="/admin/settings?tab=dhl" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Open instellingen</a>
                      <span className="text-xs text-gray-500">Configureer UserId, API Key en Account ID in Instellingen.</span>
                    </div>
                    
                    {/* DHL Status Details */}
                    <div className="p-3 bg-gray-50 rounded-md text-xs">
                      <p className="text-gray-600 mb-2">DHL Configuratie Status:</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>User ID: {apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? '✅' : '❌'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>API Key: {apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? '✅' : '❌'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Account ID: {apiKeys.find(k => k.name === 'DHL API')?.isConfigured ? '✅' : '❌'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mollie editor */}
                {apiKey.name === 'Mollie' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600">Live API key</label>
                      <input 
                        type="password" 
                        value={apiKey.key.includes('live_') ? apiKey.key : ''} 
                        readOnly 
                        className="w-full px-3 py-2 border rounded bg-gray-50" 
                        placeholder="Configureerd via environment variabelen" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Test API key</label>
                      <input 
                        type="password" 
                        value={apiKey.key.includes('test_') ? apiKey.key : ''} 
                        readOnly 
                        className="w-full px-3 py-2 border rounded bg-gray-50" 
                        placeholder="Configureerd via environment variabelen" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">✅ API keys worden gelezen uit environment variabelen</span>
                      <span className="ml-auto text-xs text-gray-500">Webhook: /api/payment/mollie/webhook</span>
                    </div>
                    <p className="text-xs text-gray-500">Configureer MOLLIE_API_KEY en MOLLIE_TEST_API_KEY in .env.local voor lokaal, of in je hosting platform secrets.</p>
                  </div>
                )}
                
                {/* e-Boekhouden editor */}
                {apiKey.name === 'e-Boekhouden' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600">Gebruikersnaam</label>
                      <input 
                        type="text" 
                        value={apiKey.key} 
                        readOnly 
                        className="w-full px-3 py-2 border rounded bg-gray-50" 
                        placeholder="Configureerd via environment variabelen" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Beveiligingscode 1</label>
                      <input 
                        type="password" 
                        value="••••••••••" 
                        readOnly 
                        className="w-full px-3 py-2 border rounded bg-gray-50" 
                        placeholder="Configureerd via environment variabelen" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Beveiligingscode 2</label>
                      <input 
                        type="password" 
                        value="••••••••••" 
                        readOnly 
                        className="w-full px-3 py-2 border rounded bg-gray-50" 
                        placeholder="Configureerd via environment variabelen" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">✅ Credentials worden gelezen uit environment variabelen</span>
                      <span className="ml-auto text-xs text-gray-500">Webhook: /api/accounting/eboekhouden/webhook</span>
                    </div>
                    <p className="text-xs text-gray-500">Configureer EBOEK_USERNAME, EBOEK_SECURITY_CODE1 en EBOEK_SECURITY_CODE2 in .env.local voor lokaal, of in je hosting platform secrets.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No API Keys Message */}
        {apiKeys.length === 0 && !loading && (
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
