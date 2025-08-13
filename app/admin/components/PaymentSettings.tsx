'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

interface PaymentSetting {
  id: string
  provider_name: string
  is_active: boolean
  api_key: string
  api_secret: string
  webhook_url: string
  test_mode: boolean
  supported_methods: string
}

export default function PaymentSettings() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    fetchPaymentSettings()
  }, [])

  const fetchPaymentSettings = async () => {
    try {
      // Load from localStorage for static export
      const savedPaymentSettings = localStorage.getItem('paymentSettings')
      if (savedPaymentSettings) {
        const settings = JSON.parse(savedPaymentSettings)
        setPaymentSettings(settings as PaymentSetting)
        console.log('Payment settings loaded from localStorage:', settings)
      } else {
        // Create default settings if none exist
        setPaymentSettings({
          id: '',
          provider_name: 'Mollie',
          is_active: true,
          api_key: '',
          api_secret: '',
          webhook_url: '',
          test_mode: true,
          supported_methods: 'ideal,creditcard,paypal'
        })
      }
    } catch (error) {
      console.error('Error loading payment settings:', error)
      // Create default settings if none exist
      setPaymentSettings({
        id: '',
        provider_name: 'Mollie',
        is_active: true,
        api_key: '',
        api_secret: '',
        webhook_url: '',
        test_mode: true,
        supported_methods: 'ideal,creditcard,paypal'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!paymentSettings) return

    try {
      // Save to localStorage for static export
      const settingsToSave = {
        ...paymentSettings,
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('paymentSettings', JSON.stringify(settingsToSave))
      
      setMessage('Betalingsinstellingen opgeslagen! (Opgeslagen in browser)')
      setMessageType('success')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving payment settings:', error)
      setMessage('Fout bij opslaan van betalingsinstellingen')
      setMessageType('error')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const updateSetting = (field: keyof PaymentSetting, value: any) => {
    if (!paymentSettings) return
    
    setPaymentSettings(prev => 
      prev ? { ...prev, [field]: value } : null
    )
  }

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  if (!paymentSettings) {
    return <div className="text-center py-8">Geen betalingsinstellingen gevonden</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Betalingsinstellingen</h2>
      </div>

      {message && (
      <div className={`p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Naam
            </label>
            <input
              type="text"
              value={paymentSettings.provider_name}
              onChange={(e) => updateSetting('provider_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={paymentSettings.api_key}
              onChange={(e) => updateSetting('api_key', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Secret
            </label>
            <input
              type="password"
              value={paymentSettings.api_secret}
              onChange={(e) => updateSetting('api_secret', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={paymentSettings.webhook_url}
              onChange={(e) => updateSetting('webhook_url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://yourdomain.com/api/mollie/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ondersteunde Betaalmethoden
            </label>
            <input
              type="text"
              value={paymentSettings.supported_methods}
              onChange={(e) => updateSetting('supported_methods', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ideal,creditcard,paypal"
            />
            <p className="text-xs text-gray-500 mt-1">
              Komma-gescheiden lijst van betaalmethoden
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={paymentSettings.is_active}
                onChange={(e) => updateSetting('is_active', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Actief
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="test_mode"
                checked={paymentSettings.test_mode}
                onChange={(e) => updateSetting('test_mode', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="test_mode" className="ml-2 block text-sm text-gray-900">
                Test Modus
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Betalingsinstellingen Opslaan
          </button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Mollie Configuratie</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p><strong>Test API Key:</strong> test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
          <p><strong>Live API Key:</strong> live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx</p>
          <p><strong>Webhook URL:</strong> https://yourdomain.com/api/mollie/webhook</p>
          <p><strong>Ondersteunde Methoden:</strong> ideal, creditcard, paypal, banktransfer</p>
        </div>
      </div>
    </div>
  )
} 