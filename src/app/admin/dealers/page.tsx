'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface Dealer {
  id: string
  name: string
  company_name: string
  address: string
  city: string
  postal_code: string
  phone: string
  email: string
  website?: string
  latitude: number
  longitude: number
  is_active: boolean
  show_on_map?: boolean
  rating?: number
  reviews?: number
  services: string[]
  created_at: string
  updated_at: string
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  type DealerForm = Omit<Dealer, 'id' | 'created_at' | 'updated_at'>

const [formData, setFormData] = useState<DealerForm>({
  name: '',
  company_name: '',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
  website: '',
  latitude: 0,
  longitude: 0,
  is_active: true,
  show_on_map: true,
  rating: 0,
  reviews: 0,
  services: []
})

  useEffect(() => {
    fetchDealers()
  }, [])

  const fetchDealers = async () => {
    try {
      setLoading(true)
      setError('')

      const firebaseDealers = await FirebaseService.getDealers()
      
      if (firebaseDealers && firebaseDealers.length > 0) {
        setDealers(firebaseDealers)
      } else {
        // Dummy data for testing
        const dummyDealers: Dealer[] = [
          {
            id: '1',
            name: 'Auto Service Amsterdam',
            company_name: 'Auto Service Amsterdam B.V.',
            address: 'Amstelstraat 123',
            city: 'Amsterdam',
            postal_code: '1011 AB',
            phone: '020-1234567',
            email: 'info@autoserviceamsterdam.nl',
            website: 'https://autoserviceamsterdam.nl',
            latitude: 52.3676,
            longitude: 4.9041,
            is_active: true,
            show_on_map: true,
            rating: 4.5,
            reviews: 127,
            services: ['AlloyGator montage', 'Velg reparatie', 'Auto onderhoud'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Velg Specialist Rotterdam',
            company_name: 'Velg Specialist Rotterdam',
            address: 'Rotterdamstraat 456',
            city: 'Rotterdam',
            postal_code: '3000 AA',
            phone: '010-9876543',
            email: 'info@velgspecialistrotterdam.nl',
            website: 'https://velgspecialistrotterdam.nl',
            latitude: 51.9225,
            longitude: 4.4792,
            is_active: true,
            show_on_map: true,
            rating: 4.8,
            reviews: 89,
            services: ['AlloyGator montage', 'Velg bescherming', 'Tire service'],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]
        setDealers(dummyDealers)
      }
    } catch (err) {
      console.error('Error fetching dealers:', err)
      setError('Fout bij het laden van dealers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')

      const dealerData = {
        ...formData,
        services: formData.services.filter(service => service.trim() !== '')
      }

      if (editingDealer) {
        // Update existing dealer
        try {
          await FirebaseService.updateDealer(editingDealer.id, dealerData)
        } catch (error) {
          console.log('Firebase update not available, local update')
        }
        
        setDealers(prev =>
  prev.map(d =>
    d.id === editingDealer.id
      ? {
          ...d,                 // behoud bestaande verplichte velden (o.a. created_at)
          ...dealerData,        // overschrijf met wat je net hebt bewerkt
          id: editingDealer.id, // id blijft hetzelfde
          updated_at: new Date().toISOString(),
        }
      : d
  )
)
      } else {
        // Create new dealer
        const newDealer = {
          ...dealerData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        try {
          await FirebaseService.createDealer(newDealer)
        } catch (error) {
          console.log('Firebase create not available, local create')
        }
        
        setDealers(prev => [...prev, newDealer])
      }

      setShowModal(false)
      setEditingDealer(null)
      resetForm()
    } catch (error) {
      console.error('Error saving dealer:', error)
      setError('Fout bij het opslaan van dealer')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (dealer: Dealer) => {
    setEditingDealer(dealer)
    setFormData({
      name: dealer.name,
      company_name: dealer.company_name,
      address: dealer.address,
      city: dealer.city,
      postal_code: dealer.postal_code,
      phone: dealer.phone,
      email: dealer.email,
      website: dealer.website || '',
      latitude: dealer.latitude,
      longitude: dealer.longitude,
      is_active: dealer.is_active,
      show_on_map: dealer.show_on_map ?? true,
      rating: dealer.rating || 0,
      reviews: dealer.reviews || 0,
      services: dealer.services
    })
    setShowModal(true)
  }

  const handleDelete = async (dealerId: string) => {
    if (!confirm('Weet je zeker dat je deze dealer wilt verwijderen?')) return

    try {
      setError('')
      
      try {
        await FirebaseService.deleteDealer(dealerId)
      } catch (error) {
        console.log('Firebase delete not available, local delete')
      }
      
      setDealers(prev => prev.filter(d => d.id !== dealerId))
    } catch (error) {
      console.error('Error deleting dealer:', error)
      setError('Fout bij het verwijderen van dealer')
    }
  }

  const handleCreateNew = () => {
    setEditingDealer(null)
    resetForm()
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      address: '',
      city: '',
      postal_code: '',
      phone: '',
      email: '',
      website: '',
      latitude: 0,
      longitude: 0,
      is_active: true,
      show_on_map: true,
      rating: 0,
      reviews: 0,
      services: []
    })
  }

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, '']
    }))
  }

  const updateService = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => i === index ? value : service)
    }))
  }

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Dealers laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dealers Beheren</h1>
          <p className="text-gray-600">Beheer dealers voor de "Vind een Dealer" pagina</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          + Nieuwe Dealer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dealers ({dealers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dealer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Locatie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dealer.name}</div>
                      <div className="text-sm text-gray-500">{dealer.company_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dealer.phone}</div>
                    <div className="text-sm text-gray-500">{dealer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{dealer.address}</div>
                    <div className="text-sm text-gray-500">{dealer.postal_code} {dealer.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dealer.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dealer.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 text-sm text-gray-900">{dealer.rating || 0}</span>
                      <span className="ml-1 text-sm text-gray-500">({dealer.reviews || 0})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(dealer)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(dealer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingDealer ? 'Dealer Bewerken' : 'Nieuwe Dealer'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrijfsnaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefoon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aantal Reviews
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reviews}
                    onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actief
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-900">Dealer is actief en zichtbaar</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dealer op kaart tonen
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.show_on_map || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, show_on_map: e.target.checked }))}
                      className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-900">Dealer tonen op de "Vind een Dealer" kaart</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diensten
                  </label>
                  <div className="space-y-2">
                    {formData.services.map((service, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => updateService(index, e.target.value)}
                          placeholder="Bijv. AlloyGator montage"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="px-3 py-3 text-red-600 hover:text-red-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addService}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      + Dienst toevoegen
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
