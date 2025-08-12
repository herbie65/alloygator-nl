'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'

// Google Maps types
declare global {
  interface Window {
    google: any
  }
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company_name?: string
  address: string
  city: string
  postal_code: string
  country: string
  is_dealer: boolean
  dealer_group?: string
  total_orders: number
  total_spent: number
  last_order_date?: string
  created_at: string
  updated_at?: string
  notes?: string
  status: 'active' | 'inactive' | 'pending'
  invoice_email?: string
  vat_number?: string
  vat_verified?: boolean
  vat_reverse_charge?: boolean
  latitude?: number
  longitude?: number
  website?: string
  contact_person?: string
  payment_terms?: string
  credit_limit?: number
  invoice_payment_terms_days?: number
  tax_exempt?: boolean
  tax_exemption_reason?: string
  // Nieuwe velden
  contact_first_name?: string
  contact_last_name?: string
  separate_shipping_address?: boolean
  shipping_address?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country?: string
  kvk_number?: string
  separate_invoice_email?: boolean
  show_on_map?: boolean
  allow_invoice_payment?: boolean
}

interface CustomerGroup {
  id: string
  name: string
  discount_percentage: number
  description: string
  created_at: string
}

export default function CustomersPage() {
  const [customers, customersLoading, customersError] = useFirebaseRealtime<Customer>('customers')
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [customerGroupsLoading, setCustomerGroupsLoading] = useState(true)
  const [customerGroupsError, setCustomerGroupsError] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [saving, setSaving] = useState(false)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkReport, setBulkReport] = useState<{total:number; updated:number; skipped:number; failed:number; msgs:string[]}>({ total: 0, updated: 0, skipped: 0, failed: 0, msgs: [] })

  // Load customer groups
  useEffect(() => {
    const fetchCustomerGroups = async () => {
      try {
        setCustomerGroupsLoading(true)
        setCustomerGroupsError('')
        const fetchedGroups = await FirebaseService.getCustomerGroups()
        setCustomerGroups(fetchedGroups || [])
      } catch (err) {
        console.error('Error fetching customer groups:', err)
        setCustomerGroupsError('Fout bij het laden van klantengroepen')
      } finally {
        setCustomerGroupsLoading(false)
      }
    }

    fetchCustomerGroups()
  }, [])

  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (customer.company_name && customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
    const matchesGroup = filterGroup === 'all' || customer.dealer_group === filterGroup
    
    return matchesSearch && matchesStatus && matchesGroup
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name)
      case 'email': return a.email.localeCompare(b.email)
      case 'total_orders': return b.total_orders - a.total_orders
      case 'total_spent': return b.total_spent - a.total_spent
      case 'created_at': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default: return a.name.localeCompare(b.name)
    }
  })

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditingCustomer(null)
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(null)
    setEditingCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Weet je zeker dat je deze klant wilt verwijderen?')) {
      return
    }

    try {
      await FirebaseService.deleteCustomer(customerId)
    } catch (err) {
      console.error('Error deleting customer:', err)
    }
  }

  const handleSaveCustomer = async (customerData: Customer) => {
    setSaving(true)

    try {
      if (editingCustomer && editingCustomer.id) {
        // Update existing customer
        const { id, ...updateData } = customerData
        await FirebaseService.updateCustomer(String(editingCustomer.id), updateData)
      } else {
        // Create new customer
        const { id, ...newCustomerData } = customerData
        await FirebaseService.addCustomer(newCustomerData)
      }

      setShowCustomerModal(false)
      setSelectedCustomer(null)
      setEditingCustomer(null)
    } catch (err) {
      console.error('Error saving customer:', err)
    } finally {
      setSaving(false)
    }
  }

  const getCustomerStats = () => {
    const totalCustomers = customers.length
    const activeCustomers = customers.filter(c => c.status === 'active').length
    const dealerCustomers = customers.filter(c => c.is_dealer).length
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0)

    return {
      total: totalCustomers,
      active: activeCustomers,
      dealers: dealerCustomers,
      revenue: totalRevenue
    }
  }

  const stats = getCustomerStats()

  if (customersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Klanten laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klanten Beheren</h1>
          <p className="text-gray-600">Beheer uw klantdatabase</p>
        </div>
        <button 
          onClick={() => {
            setSelectedCustomer(null)
            setEditingCustomer(null)
            setShowCustomerModal(true)
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          + Nieuwe Klant
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totaal Klanten</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actieve Klanten</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dealers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.dealers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
              <p className="text-2xl font-semibold text-gray-900">€{stats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Zoek klanten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Alle Statussen</option>
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
                <option value="pending">In Afwachting</option>
              </select>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Alle Groepen</option>
                {customerGroups.map(group => (
                  <option key={group.id} value={group.name}>{group.name}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Sorteer op Naam</option>
                <option value="email">Sorteer op Email</option>
                <option value="total_orders">Sorteer op Bestellingen</option>
                <option value="total_spent">Sorteer op Omzet</option>
                <option value="created_at">Sorteer op Datum</option>
              </select>
            </div>
          </div>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Dealer geocoding</h3>
              <p className="text-sm text-gray-600">Zet automatisch coördinaten voor dealers zonder locatie. 1 verzoek/sec (Nominatim limiet).</p>
            </div>
            <button
              disabled={bulkRunning}
              onClick={async () => {
                try {
                  setBulkRunning(true)
                  const dealerCandidates = (customers || []).filter((c: any) => c.is_dealer && (!c.latitude || !c.longitude || c.latitude === 0 || c.longitude === 0))
                  const total = dealerCandidates.length
                  const report = { total, updated: 0, skipped: 0, failed: 0, msgs: [] as string[] }
                  for (let i = 0; i < dealerCandidates.length; i++) {
                    const c = dealerCandidates[i]
                    const address = `${c.address || ''}, ${c.postal_code || ''} ${c.city || ''}, ${c.country || 'Nederland'}`.trim()
                    if (!address || address === ', ,') { report.skipped++; report.msgs.push(`Overgeslagen: ${c.name} (geen adres)`); continue }
                    try {
                      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
                      const data = await res.json()
                      if (res.ok && data.lat && data.lng) {
                        await FirebaseService.updateCustomer(c.id, { latitude: data.lat, longitude: data.lng, show_on_map: true, updated_at: new Date().toISOString() })
                        report.updated++
                      } else {
                        report.failed++
                        report.msgs.push(`Mislukt: ${c.name} (${data.message || data.error || 'onbekende fout'})`)
                      }
                    } catch (e: any) {
                      report.failed++
                      report.msgs.push(`Mislukt: ${c.name} (${e?.message || 'netwerkfout'})`)
                    }
                    // Respect rate limit
                    await new Promise(r => setTimeout(r, 1100))
                    setBulkReport({ ...report })
                  }
                  setBulkReport(report)
                  alert(`Geocode gereed. Totaal: ${report.total}, geüpdatet: ${report.updated}, overgeslagen: ${report.skipped}, mislukt: ${report.failed}`)
                } finally {
                  setBulkRunning(false)
                }
              }}
              className={`px-4 py-2 ${bulkRunning ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded text-sm`}
            >
              {bulkRunning ? 'Bezig…' : 'Geocodeer dealers (bulk)'}
            </button>
          </div>
          {(bulkReport.total > 0) && (
            <div className="mt-3 text-sm text-gray-700">
              <div>Te verwerken: {bulkReport.total} • Geüpdatet: {bulkReport.updated} • Overgeslagen: {bulkReport.skipped} • Mislukt: {bulkReport.failed}</div>
              {bulkReport.msgs.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-gray-600">Details</summary>
                  <ul className="list-disc ml-5 mt-1">
                    {bulkReport.msgs.slice(-10).map((m, idx) => (<li key={idx}>{m}</li>))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Customers Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant-ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klant
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
                  Bestellingen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Omzet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Geen klanten gevonden</p>
                      <p className="text-gray-600">Er zijn nog geen klanten toegevoegd aan de database.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={`${customer.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">#{customer.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.company_name || 'Particulier'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.address && customer.city ? (
                          <div>
                            <div className="text-sm text-gray-900">{customer.address}</div>
                            <div className="text-sm text-gray-500">{customer.postal_code} {customer.city}</div>
                            {customer.latitude && customer.longitude && (
                              <div className="flex items-center mt-1">
                                <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs text-green-600">Locatie bekend</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Geen adres</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.status === 'active' ? 'bg-green-100 text-green-800' :
                        customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {customer.status === 'active' ? 'Actief' :
                         customer.status === 'inactive' ? 'Inactief' : 'In Afwachting'}
                      </span>
                      {customer.is_dealer && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Dealer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{(customer.total_spent || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Verwijderen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <CustomerDetailModal
          customer={selectedCustomer}
          editingCustomer={editingCustomer}
          customerGroups={customerGroups}
          onSave={handleSaveCustomer}
          onClose={() => {
            setShowCustomerModal(false)
            setSelectedCustomer(null)
            setEditingCustomer(null)
          }}
          saving={saving}
        />
      )}
    </div>
  )
}

interface CustomerDetailModalProps {
  customer: Customer | null
  editingCustomer: Customer | null
  customerGroups: CustomerGroup[]
  onSave: (customer: Customer) => void
  onClose: () => void
  saving: boolean
}

function CustomerDetailModal({ customer, editingCustomer, customerGroups, onSave, onClose, saving }: CustomerDetailModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({})

  useEffect(() => {
    if (editingCustomer) {
      setFormData(editingCustomer)
    } else if (customer) {
      setFormData(customer)
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Nederland',
        is_dealer: false,
        dealer_group: '',
        total_orders: 0,
        total_spent: 0,
        status: 'active',
        contact_first_name: '',
        contact_last_name: '',
        separate_shipping_address: false,
        shipping_address: '',
        shipping_city: '',
        shipping_postal_code: '',
        shipping_country: 'Nederland',
        kvk_number: '',
        separate_invoice_email: false,
        invoice_email: '',
        vat_number: '',
        vat_verified: false,
        vat_reverse_charge: false,
        latitude: null,
        longitude: null,
        website: '',
        contact_person: '',
        payment_terms: '',
        credit_limit: 0,
        tax_exempt: false,
        tax_exemption_reason: '',
        show_on_map: false,
        notes: ''
      })
    }
  }, [customer, editingCustomer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const customerData: Customer = {
      id: editingCustomer?.id || '',
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      company_name: formData.company_name || '',
      address: formData.address || '',
      city: formData.city || '',
      postal_code: formData.postal_code || '',
      country: formData.country || 'Nederland',
      is_dealer: formData.is_dealer || false,
      dealer_group: formData.dealer_group || '',
      total_orders: formData.total_orders || 0,
      total_spent: formData.total_spent || 0,
      status: formData.status || 'active',
      contact_first_name: formData.contact_first_name || '',
      contact_last_name: formData.contact_last_name || '',
      separate_shipping_address: formData.separate_shipping_address || false,
      shipping_address: formData.shipping_address || '',
      shipping_city: formData.shipping_city || '',
      shipping_postal_code: formData.shipping_postal_code || '',
      shipping_country: formData.shipping_country || 'Nederland',
      kvk_number: formData.kvk_number || '',
      separate_invoice_email: formData.separate_invoice_email || false,
      invoice_email: formData.invoice_email || '',
      vat_number: formData.vat_number || '',
      vat_verified: formData.vat_verified || false,
      vat_reverse_charge: formData.vat_reverse_charge || false,
      latitude: formData.latitude !== undefined ? formData.latitude : null,
      longitude: formData.longitude !== undefined ? formData.longitude : null,
      website: formData.website || '',
      contact_person: formData.contact_person || '',
      payment_terms: formData.payment_terms || '',
      credit_limit: formData.credit_limit || 0,
      tax_exempt: formData.tax_exempt || false,
      tax_exemption_reason: formData.tax_exemption_reason || '',
      show_on_map: formData.show_on_map || false,
      notes: formData.notes || '',
      allow_invoice_payment: formData.allow_invoice_payment || false,
      invoice_payment_terms_days: formData.invoice_payment_terms_days || 14,
      created_at: editingCustomer?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    onSave(customerData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingCustomer ? 'Klant Bewerken' : customer ? 'Klant Details' : 'Nieuwe Klant'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam *
                </label>
                <input
                  type="text"
                  value={formData.contact_first_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_first_name: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam *
                </label>
                <input
                  type="text"
                  value={formData.contact_last_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_last_name: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoon *
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Land *
                </label>
                <select
                  value={formData.country || 'Nederland'}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                >
                  <option value="Nederland">Nederland</option>
                  <option value="België">België</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
                <input
                  type="text"
                  value={formData.postal_code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="1234 AB"
                  required
                />
                {formData.country === 'Nederland' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!formData.postal_code) {
                        alert('Voer eerst een postcode in');
                        return;
                      }
                      const houseNumber = prompt('Voer het huisnummer in:');
                      if (!houseNumber) return;
                      
                      try {
                        const response = await fetch(`/api/geocode?postalCode=${formData.postal_code}&houseNumber=${houseNumber}`);
                        const data = await response.json();
                        if (response.ok && data.address) {
                          setFormData(prev => ({
                            ...prev,
                            address: `${data.address.street || ''} ${houseNumber}`.trim(),
                            city: data.address.city || ''
                          }));
                        } else {
                          alert('Adres niet gevonden voor deze postcode en huisnummer');
                        }
                      } catch (error) {
                        console.error('Error looking up address:', error);
                        alert('Fout bij het opzoeken van het adres');
                      }
                    }}
                    className="mt-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 text-sm"
                    disabled={!editingCustomer && !!customer}
                  >
                    🔍 Zoek adres
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Woonplaats *
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres *
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={!editingCustomer && !!customer}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                required
              />
            </div>

            {/* Apart verzendadres toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="separate_shipping_address"
                checked={!!formData.separate_shipping_address}
                onChange={(e) => setFormData(prev => ({ ...prev, separate_shipping_address: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="separate_shipping_address" className="ml-2 block text-sm text-gray-900">
                Apart verzendadres
              </label>
            </div>

            {formData.separate_shipping_address && (
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Verzendadres</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                  <input
                    type="text"
                    value={formData.shipping_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={formData.shipping_postal_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_postal_code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="1234 AB"
                    />
                    {formData.shipping_country === 'Nederland' && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!formData.shipping_postal_code) {
                            alert('Voer eerst een postcode in');
                            return;
                          }
                          const houseNumber = prompt('Voer het huisnummer in:');
                          if (!houseNumber) return;
                          
                          try {
                            const response = await fetch(`/api/geocode?postalCode=${formData.shipping_postal_code}&houseNumber=${houseNumber}`);
                            const data = await response.json();
                            if (response.ok && data.address) {
                              setFormData(prev => ({
                                ...prev,
                                shipping_address: `${data.address.street || ''} ${houseNumber}`.trim(),
                                shipping_city: data.address.city || ''
                              }));
                            } else {
                              alert('Adres niet gevonden voor deze postcode en huisnummer');
                            }
                          } catch (error) {
                            console.error('Error looking up address:', error);
                            alert('Fout bij het opzoeken van het adres');
                          }
                        }}
                        className="mt-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        🔍 Zoek adres
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plaats</label>
                    <input
                      type="text"
                      value={formData.shipping_city || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                  <select
                    value={formData.shipping_country || 'Nederland'}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Nederland">Nederland</option>
                    <option value="België">België</option>
                  </select>
                </div>
              </div>
            )}

            {/* Location Section */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Locatie</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="52.3676"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="4.9041"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                  onClick={async () => {
                    const address = `${formData.address || ''}, ${formData.postal_code || ''} ${formData.city || ''}, ${formData.country || 'Nederland'}`.trim();
                    if (address && address !== ', , ') {
                      try {
                        const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
                        const data = await response.json();
                        if (response.ok && data.lat && data.lng) {
                          // Update formData with coordinates
                          setFormData(prev => ({ 
                            ...prev, 
                            latitude: data.lat, 
                            longitude: data.lng 
                          }));
                          
                          alert(`Locatie gevonden: ${data.formatted_address}\nCoördinaten: ${data.lat}, ${data.lng}`);
                        } else {
                          // Show specific error message from API
                          const errorMessage = data.message || data.error || 'Locatie niet gevonden. Controleer het adres.';
                          alert(`Geocoding fout: ${errorMessage}\n\nProbeer het adres handmatig in te voeren of een ander adres te gebruiken.`);
                        }
                      } catch (error) {
                        console.error('Geocoding error:', error);
                        alert('Netwerkfout bij het zoeken van locatie. Controleer uw internetverbinding.');
                      }
                    } else {
                      alert('Vul eerst een adres in.');
                    }
                  }}
                >
                  🔍 Zoek locatie
                </button>
                <p className="text-xs text-gray-600 mt-1">
                  Klik om automatisch coördinaten op te halen op basis van het adres
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KvK Nummer
                </label>
                <input
                  type="text"
                  value={formData.kvk_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kvk_number: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BTW Nummer
                </label>
                <input
                  type="text"
                  value={formData.vat_number || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_number: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="NL123456789B01"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.vat_number) {
                      alert('Voer eerst een BTW nummer in');
                      return;
                    }
                    
                    try {
                      const response = await fetch(`/api/vat-validate?vat=${encodeURIComponent(formData.vat_number)}`);
                      const data = await response.json();
                      
                      if (response.ok && data.valid) {
                        // Log the response for debugging
                        console.log('VAT validation response:', data)
                        
                        // Check if this is a non-Dutch EU customer
                        const isNonDutchEU = data.country && data.country !== 'NL' && data.country !== 'Nederland';
                        
                        // Update form with company data from VIES
                        setFormData(prev => ({
                          ...prev,
                          company_name: data.company_name || prev.company_name,
                          address: data.address || prev.address,
                          city: data.city || prev.city,
                          postal_code: data.postal_code || prev.postal_code,
                          country: data.country || prev.country,
                          vat_verified: true,
                          // Auto-enable reverse charge for non-Dutch EU customers
                          vat_reverse_charge: isNonDutchEU ? true : prev.vat_reverse_charge
                        }));
                        
                        // Build message with fallbacks for missing data
                        const companyName = data.company_name || 'Niet beschikbaar';
                        const address = data.address || 'Niet beschikbaar';
                        const city = data.city || 'Niet beschikbaar';
                        const postalCode = data.postal_code || 'Niet beschikbaar';
                        const country = data.country || 'Niet beschikbaar';
                        
                        const message = `✅ BTW nummer geldig!\nBedrijf: ${companyName}\nAdres: ${address}, ${postalCode} ${city}, ${country}`;
                        const reverseChargeMessage = isNonDutchEU ? '\n\n🔄 BTW verleggen is automatisch aangevinkt (EU klant buiten Nederland)' : '';
                        alert(message + reverseChargeMessage);
                      } else {
                        alert(`❌ BTW nummer ongeldig: ${data.message || 'Onbekende fout'}`);
                        setFormData(prev => ({ ...prev, vat_verified: false }));
                      }
                    } catch (error) {
                      console.error('Error validating VAT:', error);
                      alert('Fout bij het valideren van BTW nummer. Probeer het later opnieuw.');
                    }
                  }}
                  className="mt-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
                  disabled={!editingCustomer && !!customer}
                >
                  🔍 VIES Controle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email voor Facturen
                </label>
                <input
                  type="email"
                  value={formData.invoice_email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_email: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* Dealer Settings */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Dealer Instellingen</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_dealer"
                    checked={formData.is_dealer || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_dealer: e.target.checked }))}
                    disabled={!editingCustomer && !!customer}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_dealer" className="ml-2 block text-sm text-gray-900">
                    Is Dealer
                  </label>
                </div>
                {formData.is_dealer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dealer Groep
                    </label>
                    <select
                      value={formData.dealer_group || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dealer_group: e.target.value }))}
                      disabled={!editingCustomer && !!customer}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecteer groep</option>
                      {customerGroups.map(group => (
                        <option key={group.id} value={group.name}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.is_dealer && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_on_map"
                      checked={formData.show_on_map || false}
                      onChange={(e) => setFormData(prev => ({ ...prev, show_on_map: e.target.checked }))}
                      disabled={!editingCustomer && !!customer}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="show_on_map" className="ml-2 block text-sm text-gray-900">
                      Laat zien op kaart
                    </label>
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_invoice_payment"
                    checked={formData.allow_invoice_payment || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_invoice_payment: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_invoice_payment" className="ml-2 block text-sm text-gray-900">
                    Op rekening toegestaan
                  </label>
                </div>
                {formData.allow_invoice_payment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Betaaltermijn (dagen)
                    </label>
                    <input
                      type="number"
                      min={7}
                      max={60}
                      value={formData.invoice_payment_terms_days || 14}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_payment_terms_days: parseInt(e.target.value || '14', 10) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'pending' }))}
                disabled={!editingCustomer && !!customer}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                required
              >
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
                <option value="pending">In Afwachting</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notities
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={!editingCustomer && !!customer}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Annuleren
              </button>
              {(editingCustomer || !customer) && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
