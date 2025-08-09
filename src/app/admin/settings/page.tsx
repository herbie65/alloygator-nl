'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function SettingsPage() {
  const params = useSearchParams()
  const currentTab = (params.get('tab') || 'general') as 'general'|'shipping'|'payments'|'email'|'dhl'|'taxmap'|'social'
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    vatNumber: '',
    googleMapsApiKey: '',
    analyticsGoogle: '',
    socialFacebook: '',
    socialInstagram: '',
    facebook_page_id: '',
    facebook_access_token: '',
    instagram_user_id: '',
    instagram_access_token: '',
    socialLinkedin: '',
    mapCenterLat: 52.3676,
    mapCenterLng: 4.9041,
    mapZoom: 7,
    searchRadius: 25,
    shippingCost: '8.95',
    freeShippingThreshold: '300',
    defaultCarrier: 'postnl',
    enabledCarriers: ['postnl', 'local'],
    shippingMethods: [
      {
        id: 'postnl-standard',
        name: 'PostNL Standaard',
        description: 'Levering binnen 1-2 werkdagen',
        carrier: 'postnl',
        delivery_type: 'standard',
        price: 8.95,
        enabled: true
      },
      {
        id: 'postnl-express',
        name: 'PostNL Express',
        description: 'Levering de volgende werkdag',
        carrier: 'postnl',
        delivery_type: 'morning',
        price: 12.95,
        enabled: false
      },
      {
        id: 'local-pickup',
        name: 'Afhalen (Almere)',
        description: 'Gratis afhalen bij ons magazijn',
        carrier: 'local',
        delivery_type: 'pickup_local',
        price: 0,
        enabled: true
      }
    ],
    dhlApiUserId: '',
    dhlApiKey: '',
    dhlAccountId: '',
    dhlTestMode: true,
    mollieApiKey: '',
    mollieTestMode: true,
    smtpHost: 'mail.whserver.nl',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    adminEmail: '',
    emailNotifications: false
    , targetGold: 30
    , targetSilver: 20
    , targetBronze: 10
  })

  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [dhlTestStatus, setDhlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [dhlTestMessage, setDhlTestMessage] = useState('')
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [emailTestMessage, setEmailTestMessage] = useState('')
  const [socialTestStatus, setSocialTestStatus] = useState<'idle'|'testing'|'success'|'error'>('idle')
  const [socialTestMessage, setSocialTestMessage] = useState('')
  const [socialPreview, setSocialPreview] = useState<Array<{id:string; platform:'facebook'|'instagram'; image_url:string; permalink:string; caption?:string}>>([])
  const [paymentMethods, setPaymentMethods] = useState<Array<{id:string; name:string; description:string; mollie_id:string; is_active:boolean; fee_percent:number;}>>([])
  const [pmLoading, setPmLoading] = useState(false)
  const [pmError, setPmError] = useState('')


  useEffect(() => {
    loadSettings()
    loadPaymentMethods()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (data && data.length > 0) {
        const savedSettings = data[0];
        
        // Ensure shipping methods have the correct structure
        const fixedShippingMethods = (savedSettings.shippingMethods || []).map((method: any) => {
          if (!method.carrier || !method.delivery_type) {
            const [carrier, deliveryType] = method.id.split('-');
            return {
              ...method,
              carrier: carrier || 'postnl',
              delivery_type: deliveryType || 'standard'
            };
          }
          return method;
        });

        // Ensure enabledCarriers exists
        const enabledCarriers = savedSettings.enabledCarriers || ['postnl', 'dhl', 'dpd'];
        
        setSettings(prev => ({
          ...prev,
          ...savedSettings,
          // Map database field names to component field names
          googleMapsApiKey: savedSettings.google_maps_api_key || '',
          shippingMethods: (() => {
            const list = [...fixedShippingMethods]
            // Ensure local pickup exists
            if (!list.some((m:any) => m.id === 'local-pickup')) {
              list.push({
                id: 'local-pickup',
                name: 'Afhalen (Almere)',
                description: 'Gratis afhalen bij ons magazijn',
                carrier: 'local',
                delivery_type: 'pickup_local',
                price: 0,
                enabled: true
              })
            }
            return list
          })(),
          enabledCarriers: Array.from(new Set([...(enabledCarriers || []), 'local'])),
          mollieApiKey: savedSettings.mollieApiKey || savedSettings.mollie_api_key || prev.mollieApiKey,
          mollieTestMode: savedSettings.mollieTestMode ?? savedSettings.mollie_test_mode ?? prev.mollieTestMode
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  const loadPaymentMethods = async () => {
    try {
      setPmLoading(true)
      setPmError('')
      const res = await fetch('/api/payment-methods')
      if (!res.ok) throw new Error('Failed to load payment methods')
      const data = await res.json()
      setPaymentMethods(Array.isArray(data) ? data : [])
    } catch (e:any) {
      console.error(e)
      setPmError(e.message || 'Kon betaalmethodes niet laden')
    } finally {
      setPmLoading(false)
    }
  }

  const togglePaymentMethod = async (id: string, nextActive: boolean) => {
    const method = paymentMethods.find(m => m.id === id)
    if (!method) return
    const updated = { ...method, is_active: nextActive }
    await fetch('/api/payment-methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    setPaymentMethods(prev => prev.map(m => m.id === id ? updated : m))
  }

  const updatePaymentFee = async (id: string, nextFeePercent: number) => {
    const method = paymentMethods.find(m => m.id === id)
    if (!method) return
    const updated = { ...method, fee_percent: nextFeePercent }
    await fetch('/api/payment-methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updated, fees: nextFeePercent }) })
    setPaymentMethods(prev => prev.map(m => m.id === id ? updated : m))
  }

  const addPaymentMethod = async (payload: { name:string; description:string; mollie_id:string; fee_percent:number }) => {
    const body = { ...payload, is_active: true, fees: payload.fee_percent }
    const res = await fetch('/api/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      await loadPaymentMethods()
    }
  }

  const deletePaymentMethod = async (id: string) => {
    const url = `/api/payment-methods?id=${encodeURIComponent(id)}`
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) {
      setPaymentMethods(prev => prev.filter(m => m.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      setSaveStatus('saving')
      
      // Prepare settings for database (map component field names to database field names)
      const settingsForDatabase = {
        ...settings,
        google_maps_api_key: settings.googleMapsApiKey
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsForDatabase),
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDhlTest = async () => {
    try {
      setDhlTestStatus('testing')
      setDhlTestMessage('')

      const response = await fetch('/api/dhl/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUserId: settings.dhlApiUserId,
          apiKey: settings.dhlApiKey,
          accountId: settings.dhlAccountId,
          testMode: settings.dhlTestMode
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setDhlTestStatus('success')
        setDhlTestMessage(`✅ ${result.message} - ${result.data.servicesFound} services found`)
      } else {
        setDhlTestStatus('error')
        setDhlTestMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      console.error('Error testing DHL authentication:', error)
      setDhlTestStatus('error')
      setDhlTestMessage('❌ Connection error - check your internet connection')
    }
  }

  const handleEmailTest = async () => {
    try {
      setEmailTestStatus('testing')
      setEmailTestMessage('')

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEmailTestStatus('success')
        setEmailTestMessage('✅ E-mail configuratie werkt correct!')
      } else {
        setEmailTestStatus('error')
        setEmailTestMessage(`❌ E-mail configuratie gefaald: ${result.message}`)
      }
    } catch (error) {
      console.error('Error testing email configuration:', error)
      setEmailTestStatus('error')
      setEmailTestMessage('❌ Connection error - check your internet connection')
    }
  }



  const toggleShippingMethod = (methodId: string) => {
    setSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === methodId 
          ? { ...method, enabled: !method.enabled }
          : method
      )
    }))
  }

  const updateShippingMethodPrice = (methodId: string, price: number) => {
    setSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === methodId 
          ? { ...method, price }
          : method
      )
    }))
  }

  const toggleCarrier = (carrier: string) => {
    setSettings(prev => ({
      ...prev,
      enabledCarriers: prev.enabledCarriers.includes(carrier)
        ? prev.enabledCarriers.filter(c => c !== carrier)
        : [...prev.enabledCarriers, carrier]
    }))
  }

  const getCarrierName = (carrier: string) => {
    switch (carrier) {
      case 'postnl': return 'PostNL'
      case 'dhl': return 'DHL'
      case 'dpd': return 'DPD'
      case 'local': return 'Afhalen'
      default: return carrier
    }
  }

  const getDeliveryTypeName = (type: string) => {
    switch (type) {
      case 'standard': return 'Standaard'
      case 'morning': return 'Ochtend'
      case 'evening': return 'Avond'
      case 'express': return 'Express'
      case 'pickup': return 'Afhaalpunt'
      case 'pickup_local': return 'Afhalen (magazijn)'
      default: return type
    }
  }

  function PaymentMethodForm({ onSubmit }: { onSubmit: (payload: { name:string; description:string; mollie_id:string; fee_percent:number }) => Promise<void> }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [mollieId, setMollieId] = useState('ideal')
    const [feePercent, setFeePercent] = useState(0)
    const [saving, setSaving] = useState(false)

    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        setSaving(true)
        await onSubmit({ name, description, mollie_id: mollieId, fee_percent: feePercent })
        setName('')
        setDescription('')
        setMollieId('ideal')
        setFeePercent(0)
      } finally {
        setSaving(false)
      }
    }

    return (
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
          <input value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Methode (Mollie ID)</label>
          <select value={mollieId} onChange={(e)=>setMollieId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="ideal">iDEAL</option>
            <option value="creditcard">Creditcard</option>
            <option value="paypal">PayPal</option>
            <option value="bancontact">Bancontact</option>
            <option value="banktransfer">Bankoverschrijving</option>
            <option value="applepay">Apple Pay</option>
            <option value="klarna">Klarna</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kosten/Korting (%)</label>
          <input type="number" step="0.1" value={feePercent} onChange={(e)=>setFeePercent(parseFloat(e.target.value || '0'))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="md:col-span-5">
          <button disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {saving ? 'Opslaan...' : 'Toevoegen'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-600">Configureer website instellingen</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[
            {id:'general',label:'Algemeen'},
            {id:'shipping',label:'Verzending'},
            {id:'payments',label:'Betalingen'},
            {id:'email',label:'E-mail'},
            {id:'dhl',label:'DHL'},
            {id:'social',label:'Social media'},
            {id:'taxmap',label:'BTW/Map'}
          ].map(t=> (
            <a key={t.id} href={`/admin/settings?tab=${t.id}`} className={`px-3 py-1 rounded border ${currentTab===t.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{t.label}</a>
          ))}
        </div>
      </div>
      {currentTab==='general' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Algemene Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Naam
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Beschrijving
              </label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Telefoon
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BTW Nummer
            </label>
            <input
              type="text"
              value={settings.vatNumber}
              onChange={(e) => setSettings({...settings, vatNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Maps API Key
            </label>
            <input
              type="password"
              value={settings.googleMapsApiKey}
              onChange={(e) => setSettings({...settings, googleMapsApiKey: e.target.value})}
              placeholder="Voer je Google Maps API key in"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              API key voor Google Maps en Geocoding. Zorg ervoor dat de Geocoding API is geactiveerd in de Google Cloud Console.
            </p>
          </div>
        </div>
      </div>)}

      {currentTab==='general' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">CRM Targets</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gold (sets/jaar)</label>
            <input type="number" value={settings.targetGold} onChange={(e)=>setSettings({...settings, targetGold: parseInt(e.target.value || '0',10)})} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Silver (sets/jaar)</label>
            <input type="number" value={settings.targetSilver} onChange={(e)=>setSettings({...settings, targetSilver: parseInt(e.target.value || '0',10)})} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bronze (sets/jaar)</label>
            <input type="number" value={settings.targetBronze} onChange={(e)=>setSettings({...settings, targetBronze: parseInt(e.target.value || '0',10)})} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>
      </div>)}

      {currentTab==='payments' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mollie Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mollie API Key
              </label>
              <input
                type="password"
                value={settings.mollieApiKey}
                onChange={(e) => setSettings({ ...settings, mollieApiKey: e.target.value })}
                placeholder="test_xxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Gebruik je test- of live API key van Mollie.
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="mollieTestMode"
                  checked={settings.mollieTestMode}
                  onChange={(e) => setSettings({ ...settings, mollieTestMode: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="mollieTestMode" className="text-sm font-medium text-gray-700">
                  Test modus
                </label>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Mollie Webhook</h3>
            <p className="text-sm text-blue-700">
              Stel in je Mollie Dashboard de webhook URL in op: <code className="bg-blue-100 px-1 py-0.5 rounded">/api/payment/mollie/webhook</code> (gebruik volledige domein in productie).
            </p>
          </div>
        </div>
      </div>)}

      {currentTab==='payments' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Betalingsmethodes</h2>
          <p className="text-sm text-gray-600">Zet methodes aan/uit en stel extra kosten of korting in (negatief bedrag is korting).</p>
        </div>
        <div className="p-6 space-y-6">
          {pmError && (
            <div className="bg-red-100 text-red-700 rounded p-3 text-sm">{pmError}</div>
          )}
          {pmLoading ? (
            <div>Betalingsmethodes laden...</div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={m.is_active}
                      onChange={(e) => togglePaymentMethod(m.id, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{m.name} <span className="text-xs text-gray-500">({m.mollie_id})</span></div>
                      <div className="text-sm text-gray-600">{m.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">%</span>
                    <input
                      type="number"
                      step="0.1"
                      value={m.fee_percent}
                      onChange={(e) => updatePaymentFee(m.id, parseFloat(e.target.value || '0'))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button onClick={() => deletePaymentMethod(m.id)} className="ml-2 text-red-600 text-sm hover:underline">Verwijderen</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Nieuwe methode toevoegen</h3>
            <PaymentMethodForm onSubmit={addPaymentMethod} />
          </div>
        </div>
      </div>)}

      {currentTab==='dhl' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">DHL eCommerce API Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DHL API UserId
            </label>
            <input
              type="text"
              value={settings.dhlApiUserId}
              onChange={(e) => setSettings({...settings, dhlApiUserId: e.target.value})}
              placeholder="Voer je DHL API UserId in"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Je DHL eCommerce API UserId
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DHL API Key
            </label>
            <input
              type="password"
              value={settings.dhlApiKey}
              onChange={(e) => setSettings({...settings, dhlApiKey: e.target.value})}
              placeholder="Voer je DHL API key in"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Je DHL eCommerce API key
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DHL Account ID
            </label>
            <input
              type="text"
              value={settings.dhlAccountId}
              onChange={(e) => setSettings({...settings, dhlAccountId: e.target.value})}
              placeholder="Voer je DHL Account ID in"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Je DHL eCommerce Account ID
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="dhlTestMode"
              checked={settings.dhlTestMode}
              onChange={(e) => setSettings({...settings, dhlTestMode: e.target.checked})}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="dhlTestMode" className="text-sm font-medium text-gray-700">
              Test modus gebruiken
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDhlTest}
              disabled={!settings.dhlApiUserId || !settings.dhlApiKey || dhlTestStatus === 'testing'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {dhlTestStatus === 'testing' ? 'Testen...' : 'Test DHL Authenticatie'}
            </button>
            {dhlTestMessage && (
              <span className={`text-sm ${dhlTestStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {dhlTestMessage}
              </span>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ DHL eCommerce Integratie</h3>
            <p className="text-sm text-blue-700">
              Met DHL eCommerce kun je automatisch verzendlabels genereren en tracking informatie ontvangen. 
              Zorg ervoor dat je een geldige API UserId en API Key hebt en test eerst in test modus.
            </p>
          </div>
        </div>
      </div>)}

      {currentTab==='email' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">E-mail Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({...settings, smtpHost: e.target.value})}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                SMTP server hostname
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="number"
                value={settings.smtpPort}
                onChange={(e) => setSettings({...settings, smtpPort: e.target.value})}
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                SMTP server poort
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Gebruikersnaam
              </label>
              <input
                type="email"
                value={settings.smtpUser}
                onChange={(e) => setSettings({...settings, smtpUser: e.target.value})}
                placeholder="jouw@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Je e-mail adres voor SMTP authenticatie
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Wachtwoord
              </label>
              <input
                type="password"
                value={settings.smtpPass}
                onChange={(e) => setSettings({...settings, smtpPass: e.target.value})}
                placeholder="Je wachtwoord of app-wachtwoord"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Je wachtwoord of app-wachtwoord voor SMTP
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin E-mail
            </label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
              placeholder="admin@alloygator.nl"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              E-mail adres voor admin notificaties
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailNotifications"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
              E-mail notificaties inschakelen
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleEmailTest}
              disabled={!settings.smtpUser || !settings.smtpPass || emailTestStatus === 'testing'}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {emailTestStatus === 'testing' ? 'Testen...' : 'Test E-mail Configuratie'}
            </button>
            {emailTestMessage && (
              <span className={`text-sm ${emailTestStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {emailTestMessage}
              </span>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-semibold text-green-900 mb-2">ℹ️ E-mail Notificaties</h3>
            <p className="text-sm text-green-700">
              Met e-mail notificaties ontvangen klanten automatisch bestelbevestigingen en status updates. 
              Voor Gmail gebruik je een app-wachtwoord in plaats van je normale wachtwoord.
            </p>
          </div>
        </div>
      </div>)}



      {currentTab==='social' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Social media</h2>
            <p className="text-sm text-gray-600">Configureer Facebook en Instagram feed voor de pagina Foto's & media.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Page ID</label>
                <input type="text" value={settings.facebook_page_id} onChange={(e)=>setSettings({...settings, facebook_page_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Access Token</label>
                <input type="password" value={settings.facebook_access_token} onChange={(e)=>setSettings({...settings, facebook_access_token: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram User ID</label>
                <input type="text" value={settings.instagram_user_id} onChange={(e)=>setSettings({...settings, instagram_user_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Access Token</label>
                <input type="password" value={settings.instagram_access_token} onChange={(e)=>setSettings({...settings, instagram_access_token: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
              Tip: Je kunt deze waarden ook via environment variables instellen. Waarden hier overschrijven de env-waarden.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async ()=>{
                  try {
                    setSocialTestStatus('testing')
                    setSocialTestMessage('')
                    setSocialPreview([])
                    const res = await fetch('/api/social/feed', { cache: 'no-store' })
                    const data = await res.json()
                    const items = Array.isArray(data?.items) ? data.items : []
                    const errors: string[] = Array.isArray(data?.errors) ? data.errors : []
                    if (items.length === 0) {
                      setSocialTestStatus(errors.length ? 'error' : 'error')
                      setSocialTestMessage(
                        errors.length ? `Fouten: \n- ${errors.join('\n- ')}` : (data?.note || 'Geen items ontvangen (controleer tokens/permissions)')
                      )
                    } else {
                      setSocialTestStatus('success')
                      setSocialPreview(items.slice(0,3))
                      setSocialTestMessage('Feed werkt. Onderstaand een preview van 3 posts.')
                    }
                  } catch (e:any) {
                    setSocialTestStatus('error')
                    setSocialTestMessage(e.message || 'Fout bij ophalen feed')
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {socialTestStatus==='testing' ? 'Testen…' : 'Feed testen'}
              </button>
              {socialTestMessage && (
                <pre className={`text-sm whitespace-pre-wrap ${socialTestStatus==='success' ? 'text-green-700' : 'text-red-700'}`}>{socialTestMessage}</pre>
              )}
            </div>
            {socialPreview.length>0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {socialPreview.map((it)=> (
                  <a key={it.id} href={it.permalink} target="_blank" rel="noreferrer" className="block border rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image_url} alt={it.caption || 'post'} className="w-full h-48 object-cover" />
                    <div className="px-3 py-2 text-xs text-gray-600 flex justify-between">
                      <span className="uppercase">{it.platform}</span>
                      <span>Bekijken →</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab==='shipping' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Verzending Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standaard Verzendkosten (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.shippingCost}
                onChange={(e) => setSettings({...settings, shippingCost: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gratis verzending vanaf (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Carrier Selection */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Beschikbare Verzendmaatschappijen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['postnl', 'dhl', 'dpd', 'local'].map((carrier) => (
                <div key={carrier} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.enabledCarriers.includes(carrier)}
                      onChange={() => toggleCarrier(carrier)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{getCarrierName(carrier)}</h4>
                      <p className="text-sm text-gray-600">
                        {carrier === 'postnl' && 'Nederlandse postdienst'}
                        {carrier === 'dhl' && 'Internationale koerier'}
                        {carrier === 'dpd' && 'Europese koerier'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Methods by Carrier */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Verzendmethodes per Carrier</h3>
            <div className="space-y-6">
              {['postnl', 'dhl', 'dpd', 'local'].map((carrier) => (
                settings.enabledCarriers.includes(carrier) && (
                  <div key={carrier} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{getCarrierName(carrier)} Methodes</h4>
                    <div className="space-y-3">
                      {settings.shippingMethods
                        .filter(method => method.carrier === carrier)
                        .map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={method.enabled}
                                onChange={() => toggleShippingMethod(method.id)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <div>
                                <h5 className="font-medium text-gray-900">{method.name}</h5>
                                <p className="text-sm text-gray-600">{method.description}</p>
                                <p className="text-xs text-gray-500">
                                  Type: {getDeliveryTypeName(method.delivery_type)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">€</span>
                              <input
                                type="number"
                                step="0.01"
                                value={method.price}
                                onChange={(e) => updateShippingMethodPrice(method.id, parseFloat(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>)}

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={loading || saveStatus === 'saving'}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saveStatus === 'saving' ? 'Opslaan...' : 'Instellingen Opslaan'}
        </button>
        {saveStatus === 'success' && (
          <span className="text-green-600 text-sm flex items-center">
            ✅ Instellingen opgeslagen!
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 text-sm flex items-center">
            ❌ Fout bij opslaan
          </span>
        )}
      </div>
    </div>
  )
}
