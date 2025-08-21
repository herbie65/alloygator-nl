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
        key: '',
        description: 'API key voor Google Maps integratie (dealer locator). Wordt opgeslagen in instellingen.',
        category: 'maps',
        isConfigured: false
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
        key: '',
        description: 'Mollie betalingen – beheer live en test API keys en modus.',
        category: 'payment',
        isConfigured: false
      },
      {
        name: 'e-Boekhouden',
        key: '',
        description: 'e-Boekhouden API integratie voor boekhouding en facturen.',
        category: 'accounting',
        isConfigured: false
      }
    ]

    // Haal actuele settings op om Google Maps status te tonen
    const load = async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const data = await res.json()
        const s = Array.isArray(data) ? data[0] : data
        
        // Google Maps API Key
        const google = String(s?.googleMapsApiKey || s?.google_maps_api_key || '')
        keys[0] = { ...keys[0], key: google, isConfigured: !!google }
        
        // DHL status: geconfigureerd indien alle kernvelden aanwezig zijn
        const dhlUserId = String(s?.dhlApiUserId || s?.dhl_api_user_id || s?.dhlUserId || '')
        const dhlApiKey = String(s?.dhlApiKey || s?.dhl_api_key || s?.dhlKey || '')
        const dhlAccountId = String(s?.dhlAccountId || s?.dhl_account_id || s?.dhlAccount || '')
        const dhlOk = !!(dhlUserId && dhlApiKey && dhlAccountId)
        keys[1] = { ...keys[1], isConfigured: dhlOk }
        
        // Mollie status
        const mollieLive = String(s?.mollieApiKey || s?.mollie_api_key || '')
        const mollieTest = String(s?.mollieTestApiKey || s?.mollie_test_api_key || '')
        const mollieMode = !!(s?.mollieTestMode ?? s?.mollie_test_mode)
        keys[keys.length-1] = { ...keys[keys.length-1], key: mollieMode ? mollieTest : mollieLive, isConfigured: !!(mollieLive || mollieTest) }
        
        // e-Boekhouden status
        const eboekUsername = String(s?.eboekUsername || s?.eboek_username || process.env.NEXT_PUBLIC_EBOEK_USERNAME || '')
        const eboekSecurityCode1 = String(s?.eboekSecurityCode1 || s?.eboek_security_code1 || process.env.NEXT_PUBLIC_EBOEK_SECURITY_CODE1 || '')
        const eboekSecurityCode2 = String(s?.eboekSecurityCode2 || s?.eboek_security_code2 || process.env.NEXT_PUBLIC_EBOEK_SECURITY_CODE2 || '')
        const eboekOk = !!(eboekUsername && eboekSecurityCode1 && eboekSecurityCode2)
        keys[3] = { ...keys[3], key: eboekUsername, isConfigured: eboekOk }
        
        console.log('🔍 Settings loaded:', { 
          google: !!google, 
          dhl: { userId: !!dhlUserId, apiKey: !!dhlApiKey, accountId: !!dhlAccountId, configured: dhlOk },
          mollie: { live: !!mollieLive, test: !!mollieTest, mode: mollieMode, configured: !!(mollieLive || mollieTest) },
          eboek: { username: !!eboekUsername, code1: !!eboekSecurityCode1, code2: !!eboekSecurityCode2, configured: eboekOk }
        })
      } catch (error) {
        console.error('❌ Error loading settings:', error)
      }
      setApiKeys(keys)
    }
    load()
    
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
              
              {/* Google Maps key inline editor */}
              {apiKey.name === 'Google Maps API Key' && (
                <GoogleMapsEditor 
                  initialKey={apiKey.key} 
                  onSaved={(k) => {
                    // Update local state
                    setApiKeys(prev => prev.map(p => 
                      p.name === apiKey.name ? {...p, key: k, isConfigured: !!k} : p
                    ))
                    // Reload settings from database to ensure consistency
                    setTimeout(() => {
                      const load = async () => {
                        try {
                          const res = await fetch('/api/settings', { cache: 'no-store' })
                          const data = await res.json()
                          const s = Array.isArray(data) ? data[0] : data
                          const google = String(s?.googleMapsApiKey || s?.google_maps_api_key || '')
                          setApiKeys(prev => prev.map(p => 
                            p.name === 'Google Maps API Key' ? {...p, key: google, isConfigured: !!google} : p
                          ))
                        } catch {}
                      }
                      load()
                    }, 100)
                  }} 
                />
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
                <MollieEditor onSaved={()=>{ /* trigger reload */ location.reload() }} />
              )}
              
              {/* e-Boekhouden editor */}
              {apiKey.name === 'e-Boekhouden' && (
                <EBoekhoudenEditor onSaved={()=>{ /* trigger reload */ location.reload() }} />
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

function GoogleMapsEditor({ initialKey, onSaved }: { initialKey: string; onSaved: (key:string)=>void }){
  const [value, setValue] = useState<string>(initialKey || '')
  const [saving, setSaving] = useState<boolean>(false)
  const [note, setNote] = useState<string>('')

  useEffect(()=>{ setValue(initialKey || '') }, [initialKey])

  const save = async ()=>{
    try{
      setSaving(true)
      setNote('')
      
      // Save to database
      const res = await fetch('/api/settings', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ googleMapsApiKey: value }) 
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Opslaan mislukt')
      }
      
      const result = await res.json()
      if (result.success) {
        onSaved(value)
        setNote('✅ Opgeslagen in database')
        setTimeout(()=> setNote(''), 3000)
      } else {
        throw new Error(result.message || 'Opslaan mislukt')
      }
    }catch(e:any){ 
      setNote(`❌ ${e.message || 'Fout bij opslaan'}`)
      setTimeout(()=> setNote(''), 5000)
    }
    finally{ setSaving(false) }
  }

  return (
    <div className="mt-4 space-y-2">
      <label className="block text-xs text-gray-600">Google Maps API Key</label>
      <input type="password" value={value} onChange={(e)=> setValue(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Voer API key in" />
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm">{saving? 'Opslaan…':'Opslaan'}</button>
        {note && <span className="text-xs text-gray-600">{note}</span>}
        <a href="/admin/settings?tab=taxmap" className="ml-auto text-sm text-blue-600 hover:underline">Open kaartinstellingen</a>
      </div>
      <p className="text-xs text-gray-500">Zorg dat de Geocoding API is geactiveerd in Google Cloud Console.</p>
    </div>
  )
}

function MollieEditor({ onSaved }: { onSaved: ()=>void }){
  const [liveKey, setLiveKey] = useState('')
  const [testKey, setTestKey] = useState('')
  const [testMode, setTestMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch('/api/settings', { cache:'no-store' })
        const data = await res.json(); const s = Array.isArray(data)? data[0]: data
        setLiveKey(String(s?.mollieApiKey || s?.mollie_api_key || ''))
        setTestKey(String(s?.mollieTestApiKey || s?.mollie_test_api_key || ''))
        setTestMode(!!(s?.mollieTestMode ?? s?.mollie_test_mode))
      } finally { setLoading(false) }
    })()
  }, [])

  const save = async ()=>{
    try{
      setSaving(true); setNote('')
      
      const body:any = { 
        mollieApiKey: liveKey, 
        mollieTestApiKey: testKey, 
        mollieTestMode: testMode 
      }
      
      const res = await fetch('/api/settings', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Opslaan mislukt')
      }
      
      const result = await res.json()
      if (result.success) {
        setNote('✅ Mollie instellingen opgeslagen in database')
        setTimeout(()=> setNote(''), 3000)
        onSaved()
      } else {
        throw new Error(result.message || 'Opslaan mislukt')
      }
    }catch(e:any){ 
      setNote(`❌ ${e.message || 'Fout bij opslaan'}`)
      setTimeout(()=> setNote(''), 5000)
    }
    finally{ setSaving(false) }
  }

  if (loading) return <div className="text-sm text-gray-600 mt-4">Laden…</div>

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-xs text-gray-600">Live API key</label>
        <input type="password" value={liveKey} onChange={(e)=> setLiveKey(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="live_xxx" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Test API key</label>
        <input type="password" value={testKey} onChange={(e)=> setTestKey(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="test_xxx" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={testMode} onChange={(e)=> setTestMode(e.target.checked)} />
        Testmodus gebruiken
      </label>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm">{saving? 'Opslaan…':'Opslaan'}</button>
        {note && <span className="text-xs text-gray-600">{note}</span>}
        <span className="ml-auto text-xs text-gray-500">Webhook: /api/payment/mollie/webhook</span>
      </div>
    </div>
  )
}

function EBoekhoudenEditor({ onSaved }: { onSaved: ()=>void }){
  const [username, setUsername] = useState('')
  const [securityCode1, setSecurityCode1] = useState('')
  const [securityCode2, setSecurityCode2] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch('/api/settings', { cache:'no-store' })
        const data = await res.json(); const s = Array.isArray(data)? data[0]: data
        setUsername(String(s?.eboekUsername || s?.eboek_username || ''))
        setSecurityCode1(String(s?.eboekSecurityCode1 || s?.eboek_security_code1 || ''))
        setSecurityCode2(String(s?.eboekSecurityCode2 || s?.eboek_security_code2 || ''))
      } finally { setLoading(false) }
    })()
  }, [])

  const save = async ()=>{
    try{
      setSaving(true); setNote('')
      
      const body:any = { 
        eboekUsername: username, 
        eboekSecurityCode1: securityCode1, 
        eboekSecurityCode2: securityCode2 
      }
      
      const res = await fetch('/api/settings', { 
        method:'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Opslaan mislukt')
      }
      
      const result = await res.json()
      if (result.success) {
        setNote('✅ e-Boekhouden instellingen opgeslagen in database')
        setTimeout(()=> setNote(''), 3000)
        onSaved()
      } else {
        throw new Error(result.message || 'Opslaan mislukt')
      }
    }catch(e:any){ 
      setNote(`❌ ${e.message || 'Fout bij opslaan'}`)
      setTimeout(()=> setNote(''), 5000)
    }
    finally{ setSaving(false) }
  }

  if (loading) return <div className="text-sm text-gray-600 mt-4">Laden…</div>

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-xs text-gray-600">Gebruikersnaam</label>
        <input type="text" value={username} onChange={(e)=> setUsername(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., 1234567890" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Beveiligingscode 1</label>
        <input type="password" value={securityCode1} onChange={(e)=> setSecurityCode1(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., 1234567890" />
      </div>
      <div>
        <label className="block text-xs text-gray-600">Beveiligingscode 2</label>
        <input type="password" value={securityCode2} onChange={(e)=> setSecurityCode2(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="e.g., 1234567890" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm">{saving? 'Opslaan…':'Opslaan'}</button>
        {note && <span className="text-xs text-gray-600">{note}</span>}
        <span className="ml-auto text-xs text-gray-500">Webhook: /api/accounting/eboekhouden/webhook</span>
      </div>
    </div>
  )
}
