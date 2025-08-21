'use client'

import { useState } from 'react'

interface CapabilitiesFormProps {
  onCapabilitiesReceived: (capabilities: any) => void
}

export default function DHLCapabilitiesForm({ onCapabilitiesReceived }: CapabilitiesFormProps) {
  const [formData, setFormData] = useState({
    senderCountry: 'NL',
    senderPostalCode: '1234AB',
    recipientCountry: 'NL',
    recipientPostalCode: '5678CD',
    weight: 1.0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        'sender[country]': formData.senderCountry,
        'sender[postalCode]': formData.senderPostalCode,
        'recipient[country]': formData.recipientCountry,
        'recipient[postalCode]': formData.recipientPostalCode,
        'parcel[weight]': formData.weight.toString()
      })

      const response = await fetch(`/api/dhl/capabilities?${queryParams}`)
      const result = await response.json()

      if (response.ok) {
        onCapabilitiesReceived(result.data)
      } else {
        setError(`Fout bij ophalen capabilities: ${result.error}`)
      }
    } catch (error: any) {
      setError(`Fout bij ophalen capabilities: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        DHL Capabilities Ophalen
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Verzender</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <select
                value={formData.senderCountry}
                onChange={(e) => setFormData({...formData, senderCountry: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="NL">Nederland</option>
                <option value="BE">België</option>
                <option value="DE">Duitsland</option>
                <option value="FR">Frankrijk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={formData.senderPostalCode}
                onChange={(e) => setFormData({...formData, senderPostalCode: e.target.value})}
                placeholder="1234AB"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Ontvanger</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Land
              </label>
              <select
                value={formData.recipientCountry}
                onChange={(e) => setFormData({...formData, recipientCountry: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="NL">Nederland</option>
                <option value="BE">België</option>
                <option value="DE">Duitsland</option>
                <option value="FR">Frankrijk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={formData.recipientPostalCode}
                onChange={(e) => setFormData({...formData, recipientPostalCode: e.target.value})}
                placeholder="5678CD"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pakket Gewicht (kg)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="30"
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {loading ? 'Capabilities Ophalen...' : 'Capabilities Ophalen'}
        </button>
      </form>
    </div>
  )
}
