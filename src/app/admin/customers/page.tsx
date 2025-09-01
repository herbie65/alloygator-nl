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
  customer_since?: string
}

interface CustomerGroup {
  id: string
  name: string
  discount_percentage: number
  description: string
  created_at: string
}

export default function CustomersPage() {
  const [customers, customersLoading, customersError] = useFirebaseRealtime<Customer[]>('customers')
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
  const [showCSVImport, setShowCSVImport] = useState(false)

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
      case 'postal_code': return (a.postal_code || '').localeCompare(b.postal_code || '')
      case 'city': return (a.city || '').localeCompare(b.city || '')
      case 'address': return (a.address || '').localeCompare(b.address || '')
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
    try {
      setSaving(true)
      if (editingCustomer) {
        await FirebaseService.updateCustomer(editingCustomer.id, customerData)
      } else {
        await FirebaseService.addCustomer(customerData)
      }
      setShowCustomerModal(false)
      setSelectedCustomer(null)
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Fout bij opslaan van klant: ' + error)
    } finally {
      setSaving(false)
    }
  }

  const handleCSVImport = async (importedCustomers: Customer[]) => {
    try {
      setSaving(true)
      let successCount = 0
      let errorCount = 0
      
      for (const customer of importedCustomers) {
        try {
          await FirebaseService.addCustomer(customer)
          successCount++
        } catch (error) {
          console.error(`Error importing customer ${customer.name}:`, error)
          errorCount++
        }
      }
      
      alert(`CSV Import voltooid! ${successCount} klanten succesvol geïmporteerd, ${errorCount} fouten.`)
      setShowCSVImport(false)
    } catch (error) {
      console.error('CSV import error:', error)
      alert('Fout bij importeren van klanten: ' + error)
    } finally {
      setSaving(false)
    }
  }

  const exportCustomersToCSV = (customersToExport: Customer[]) => {
    // Define all available fields in the correct order
    const allFields = [
      'id', 'name', 'email', 'phone', 'company_name', 'address', 'city', 'postal_code', 'country',
      'is_dealer', 'dealer_group', 'total_orders', 'total_spent', 'last_order_date', 'created_at', 'updated_at',
      'notes', 'status', 'invoice_email', 'vat_number', 'vat_verified', 'vat_reverse_charge',
      'latitude', 'longitude', 'website', 'contact_person', 'payment_terms', 'credit_limit',
      'invoice_payment_terms_days', 'tax_exempt', 'tax_exemption_reason',
      'contact_first_name', 'contact_last_name', 'separate_shipping_address',
      'shipping_address', 'shipping_city', 'shipping_postal_code', 'shipping_country',
      'kvk_number', 'separate_invoice_email', 'show_on_map', 'allow_invoice_payment'
    ]

    // Create CSV header
    const headers = allFields.map(field => {
      // Map field names to user-friendly labels
      const fieldLabels: Record<string, string> = {
        'id': 'Klant_ID',
        'name': 'Naam',
        'email': 'Email',
        'phone': 'Telefoon',
        'company_name': 'Bedrijfsnaam',
        'address': 'Adres',
        'city': 'Woonplaats',
        'postal_code': 'Postcode',
        'country': 'Land',
        'is_dealer': 'Is_Dealer',
        'dealer_group': 'Dealer_Groep',
        'total_orders': 'Totaal_Bestellingen',
        'total_spent': 'Totaal_Uitgegeven',
        'last_order_date': 'Laatste_Bestelling',
        'created_at': 'Aangemaakt_Op',
        'updated_at': 'Bijgewerkt_Op',
        'notes': 'Notities',
        'status': 'Status',
        'invoice_email': 'Factuur_Email',
        'vat_number': 'BTW_Nummer',
        'vat_verified': 'BTW_Geverifieerd',
        'vat_reverse_charge': 'BTW_Reverse_Charge',
        'latitude': 'Latitude',
        'longitude': 'Longitude',
        'website': 'Website',
        'contact_person': 'Contactpersoon',
        'payment_terms': 'Betaaltermijn',
        'credit_limit': 'Kredietlimiet',
        'invoice_payment_terms_days': 'Betaaltermijn_Dagen',
        'tax_exempt': 'BTW_Vrijgesteld',
        'tax_exemption_reason': 'BTW_Vrijstelling_Reden',
        'contact_first_name': 'Contact_Voornaam',
        'contact_last_name': 'Contact_Achternaam',
        'separate_shipping_address': 'Apart_Verzendadres',
        'shipping_address': 'Verzendadres',
        'shipping_city': 'Verzendplaats',
        'shipping_postal_code': 'Verzendpostcode',
        'shipping_country': 'Verzendland',
        'kvk_number': 'KVK_Nummer',
        'separate_invoice_email': 'Apart_Factuur_Email',
        'show_on_map': 'Toon_Op_Kaart',
        'allow_invoice_payment': 'Op_Rekening_Toegestaan'
      }
      return fieldLabels[field] || field
    })

    // Create CSV rows
    const csvRows = [headers.join(',')]
    
    customersToExport.forEach(customer => {
      const row = allFields.map(field => {
        let value = customer[field as keyof Customer]
        
        // Handle special field types
        if (field === 'is_dealer') {
          value = value ? 'ja' : 'nee'
        } else if (field === 'vat_verified' || field === 'vat_reverse_charge' || 
                   field === 'separate_shipping_address' || field === 'separate_invoice_email' ||
                   field === 'show_on_map' || field === 'allow_invoice_payment') {
          value = value ? 'ja' : 'nee'
        } else if (field === 'tax_exempt') {
          value = value ? 'ja' : 'nee'
        } else if (field === 'created_at' || field === 'updated_at' || field === 'last_order_date') {
          if (value && typeof value === 'string') {
            value = new Date(value).toLocaleDateString('nl-NL')
          } else {
            value = ''
          }
        } else if (value === null || value === undefined) {
          value = ''
        }
        
        // Escape commas and quotes in string values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value
      })
      csvRows.push(row.join(','))
    })

    // Create and download CSV file
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `klanten_export_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getCustomerStats = () => {
    if (!customers || !Array.isArray(customers)) {
      return {
        total: 0,
        active: 0,
        dealers: 0,
        revenue: 0
      }
    }
    
    const totalCustomers = customers.length
    const activeCustomers = customers.filter(c => c.status === 'active').length
    const dealerCustomers = customers.filter(c => c.is_dealer).length
    const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)

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
              <div className="flex items-center space-x-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klanten Beheren</h1>
          <p className="text-gray-600">Beheer uw klantdatabase</p>
        </div>
        <div className="flex space-x-3">
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

      {/* Export/Import knoppen verwijderd; verplaatst naar Instellingen → Data (Import/Export) */}

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
                <option value="postal_code">Sorteer op Postcode</option>
                <option value="city">Sorteer op Woonplaats</option>
                <option value="address">Sorteer op Straatnaam</option>
                <option value="total_orders">Sorteer op Bestellingen</option>
                <option value="total_spent">Sorteer op Omzet</option>
                <option value="created_at">Sorteer op Datum</option>
              </select>
            </div>
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
                  Postcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Woonplaats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Straatnaam
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
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
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
                        {customer.postal_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.address}
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

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CustomerCSVImportModal
          onClose={() => setShowCSVImport(false)}
          onImport={handleCSVImport}
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
        notes: '',
        customer_since: ''
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
      customer_since: formData.customer_since || '',
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
              
              <div className="mb-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.address || !formData.postal_code || !formData.city) {
                      alert('Voer eerst een volledig adres in (adres, postcode en plaats)');
                      return;
                    }
                    
                    try {
                      const fullAddress = `${formData.address}, ${formData.postal_code} ${formData.city}, ${formData.country}`;
                      const response = await fetch(`/api/geocode?address=${encodeURIComponent(fullAddress)}`);
                      const data = await response.json();
                      
                      if (response.ok && data.latitude && data.longitude) {
                        setFormData(prev => ({
                          ...prev,
                          latitude: data.latitude,
                          longitude: data.longitude
                        }));
                        alert(`✅ Locatie opgehaald!\nLatitude: ${data.latitude}\nLongitude: ${data.longitude}`);
                      } else {
                        alert('Locatie niet gevonden voor dit adres');
                      }
                    } catch (error) {
                      console.error('Error looking up location:', error);
                      alert('Fout bij het opzoeken van de locatie');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  disabled={!editingCustomer && !!customer}
                >
                  🔍 Haal locatie op uit adres
                </button>
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
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  disabled={!editingCustomer && !!customer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="https://www.example.com"
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

            {/* Klant Sinds */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Klant Sinds
              </label>
              <input
                type="date"
                value={formData.customer_since || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_since: e.target.value }))}
                disabled={!editingCustomer && !!customer}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
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

interface CustomerCSVImportModalProps {
  onClose: () => void
  onImport: (customers: Customer[]) => void
}

function CustomerCSVImportModal({ onClose, onImport }: CustomerCSVImportModalProps) {
  const [csvData, setCsvData] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)

  // Available customer fields for mapping
  const customerFields = [
    { key: 'name', label: 'Naam', required: false },
    { key: 'email', label: 'Email *', required: true },
    { key: 'phone', label: 'Telefoon', required: false },
    { key: 'company_name', label: 'Bedrijfsnaam', required: false },
    { key: 'address', label: 'Adres', required: false },
    { key: 'city', label: 'Woonplaats', required: false },
    { key: 'postal_code', label: 'Postcode', required: false },
    { key: 'country', label: 'Land', required: false },
    { key: 'is_dealer', label: 'Is Dealer', required: false },
    { key: 'dealer_group', label: 'Dealer Groep', required: false },
    { key: 'total_orders', label: 'Totaal Bestellingen', required: false },
    { key: 'total_spent', label: 'Totaal Uitgegeven', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'contact_first_name', label: 'Voornaam Contact', required: false },
    { key: 'contact_last_name', label: 'Achternaam Contact', required: false },
    { key: 'shipping_address', label: 'Verzendadres', required: false },
    { key: 'shipping_city', label: 'Verzendplaats', required: false },
    { key: 'shipping_postal_code', label: 'Verzendpostcode', required: false },
    { key: 'shipping_country', label: 'Verzendland', required: false },
    { key: 'kvk_number', label: 'KVK Nummer', required: false },
    { key: 'invoice_email', label: 'Factuur Email', required: false },
    { key: 'vat_number', label: 'BTW Nummer', required: false },
    { key: 'website', label: 'Website', required: false },
    { key: 'contact_person', label: 'Contactpersoon', required: false },
    { key: 'payment_terms', label: 'Betaaltermijn', required: false },
    { key: 'credit_limit', label: 'Kredietlimiet', required: false },
    { key: 'notes', label: 'Notities', required: false }
  ]

  // Special field splitting rules
  const fieldSplittingRules = [
    {
      name: 'Adres Splitsen',
      description: 'Split één kolom met adres, postcode en plaats in aparte velden',
      fields: ['address', 'postal_code', 'city'],
      pattern: /^(.+?)\s+(\d{4}\s*[A-Z]{2})\s+(.+)$/i, // Adres Postcode Plaats
      example: 'Hoofdstraat 123 1234 AB Amsterdam'
    }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setCsvData(text)
        parseCSV(text)
      }
      reader.readAsText(file)
    }
  }

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n')
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setHeaders(headers)
      
      // Clear existing mapping when new CSV is loaded
      setMapping({})
      
      // Generate preview
      if (lines.length > 1) {
        const previewData = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: any = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })
        setPreview(previewData)
      }
    }
  }

  const handleImport = () => {
    if (!csvData) return
    
    const lines = csvData.split('\n')
    if (lines.length < 2) return
    
    const importedCustomers: Customer[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const customerData: any = {
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
        status: 'active' as const,
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
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      headers.forEach((header, index) => {
        const field = mapping[header]
        if (field && values[index]) {
          const value = values[index]
          
          // Handle special field types
          if (field === 'is_dealer') {
            customerData[field] = ['true', '1', 'yes', 'ja'].includes(value.toLowerCase())
          } else if (field === 'total_orders' || field === 'total_spent' || field === 'credit_limit') {
            customerData[field] = parseFloat(value) || 0
          } else if (field === 'status') {
            customerData[field] = ['active', 'inactive', 'pending'].includes(value.toLowerCase()) ? value.toLowerCase() : 'active'
          } else {
            customerData[field] = value
          }
        }
      })
      
      // Handle address splitting after normal mapping
      Object.keys(mapping).forEach(header => {
        if (header.includes(' (address)') || header.includes(' (postal_code)') || header.includes(' (city)')) {
          const baseColumn = header.split(' (')[0]
          const splitField = header.split(' (')[1].replace(')', '')
          const originalValue = values[headers.indexOf(baseColumn)]
          
          if (originalValue) {
            // Try multiple regex patterns for Dutch addresses
            let addressMatch = null
            
            // Pattern 1: "Straat 123 1234 AB Stad" (most common)
            addressMatch = originalValue.match(/^(.+?)\s+(\d{4}\s*[A-Z]{2})\s+(.+)$/i)
            
            // Pattern 2: "Straat 123 1234AB Stad" (no space in postcode)
            if (!addressMatch) {
              addressMatch = originalValue.match(/^(.+?)\s+(\d{4}[A-Z]{2})\s+(.+)$/i)
            }
            
            // Pattern 3: "Straat 123 Stad 1234 AB" (city before postcode)
            if (!addressMatch) {
              addressMatch = originalValue.match(/^(.+?)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})$/i)
              if (addressMatch) {
                // Reorder groups: address, postcode, city
                const temp = addressMatch[2]
                addressMatch[2] = addressMatch[3]
                addressMatch[3] = temp
              }
            }
            
            if (addressMatch) {
              if (splitField === 'address') {
                customerData.address = addressMatch[1].trim()
              } else if (splitField === 'postal_code') {
                customerData.postal_code = addressMatch[2].trim()
              } else if (splitField === 'city') {
                customerData.city = addressMatch[3].trim()
              }
            } else {
              // Fallback: try to split by common patterns
              const parts = originalValue.split(/\s+/)
              if (parts.length >= 3) {
                // Look for postcode pattern (4 digits + 2 letters)
                const postcodeIndex = parts.findIndex(part => /^\d{4}[A-Z]{2}$/i.test(part))
                if (postcodeIndex > 0 && postcodeIndex < parts.length - 1) {
                  if (splitField === 'address') {
                    customerData.address = parts.slice(0, postcodeIndex).join(' ')
                  } else if (splitField === 'postal_code') {
                    customerData.postal_code = parts[postcodeIndex]
                  } else if (splitField === 'city') {
                    customerData.city = parts.slice(postcodeIndex + 1).join(' ')
                  }
                }
              }
            }
          }
        }
      })
      
      // Validate required fields
      if (customerData.email) {
        importedCustomers.push(customerData as Customer)
      }
    }
    
    if (importedCustomers.length > 0) {
      onImport(importedCustomers)
    } else {
      alert('Geen geldige klanten gevonden in de CSV. Controleer of de verplichte velden (naam en email) zijn ingevuld.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">CSV Import - Klanten</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV Bestand
              </label>
              <div className="flex space-x-3 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    // Create example CSV content with ALL available fields
                    const csvContent = `Klant_ID,Naam,Email,Telefoon,Bedrijfsnaam,Adres,Woonplaats,Postcode,Land,Is_Dealer,Dealer_Groep,Totaal_Bestellingen,Totaal_Uitgegeven,Laatste_Bestelling,Aangemaakt_Op,Bijgewerkt_Op,Notities,Status,Factuur_Email,BTW_Nummer,BTW_Geverifieerd,BTW_Reverse_Charge,Latitude,Longitude,Website,Contactpersoon,Betaaltermijn,Kredietlimiet,Betaaltermijn_Dagen,BTW_Vrijgesteld,BTW_Vrijstelling_Reden,Contact_Voornaam,Contact_Achternaam,Apart_Verzendadres,Verzendadres,Verzendplaats,Verzendpostcode,Verzendland,KVK_Nummer,Apart_Factuur_Email,Toon_Op_Kaart,Op_Rekening_Toegestaan
"#2000","Jan Jansen","jan@example.com","0612345678","Jansen B.V.","Hoofdstraat 123 1234 AB Amsterdam","Amsterdam","1234 AB","Nederland","ja","Premium","15","1250.50","2024-01-15","2023-01-15","2024-01-20","Klant sinds 2020","active","jan@jansen.nl","NL123456789B01","ja","nee","52.3676","4.9041","www.jansen.nl","Jan Jansen","30 dagen","5000","30","nee","","Jan","Jansen","nee","","","","","12345678","nee","ja","ja"
"#2001","Piet Pietersen","piet@bedrijf.nl","0201234567","Pietersen & Co","Kerkstraat 45 5678 CD Rotterdam","Rotterdam","5678 CD","Nederland","nee","","8","750.25","2024-01-10","2023-03-20","2024-01-18","","active","piet@bedrijf.nl","NL876543210B02","nee","nee","51.9225","4.4792","www.pietersen.nl","Piet Pietersen","14 dagen","2500","14","nee","","Piet","Pietersen","nee","","","","","87654321","nee","nee","nee"
"#2002","Maria de Vries","maria@firma.com","0309876543","De Vries Groothandel","Industrieweg 78 9012 EF Utrecht","Utrecht","9012 EF","Nederland","ja","Gold","25","2100.75","2024-01-12","2023-02-10","2024-01-19","Belangrijke klant","active","maria@firma.com","NL112233445B03","ja","nee","52.0907","5.1214","www.devries.nl","Maria de Vries","60 dagen","10000","60","nee","","Maria","de Vries","ja","Industrieweg 78","Utrecht","9012 EF","Nederland","11223344","ja","ja","ja"`
                    
                    // Create and download CSV file
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    const url = URL.createObjectURL(blob)
                    link.setAttribute('href', url)
                    link.setAttribute('download', 'voorbeeld_klanten_compleet.csv')
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  📥 Download Voorbeeld CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Show CSV format instructions
                    alert(`CSV Formaat Instructies - ALLE Beschikbare Velden:

Basis Informatie:
- Klant_ID: Unieke klant ID (wordt automatisch gegenereerd)
- Naam: Voornaam en achternaam
- Email: Email adres (VERPLICHT)
- Telefoon: Telefoonnummer
- Bedrijfsnaam: Naam van het bedrijf
- Adres: Straat en huisnummer
- Woonplaats: Stad/dorp
- Postcode: Postcode
- Land: Land (standaard: Nederland)

Dealer Informatie:
- Is_Dealer: "ja" of "nee"
- Dealer_Groep: Groep/type dealer

Bestellingen:
- Totaal_Bestellingen: Aantal bestellingen
- Totaal_Uitgegeven: Totaalbedrag besteed
- Laatste_Bestelling: Datum laatste bestelling (YYYY-MM-DD)

Timestamps:
- Aangemaakt_Op: Aanmaakdatum (YYYY-MM-DD)
- Bijgewerkt_Op: Laatste wijziging (YYYY-MM-DD)

Status & Notities:
- Status: "active", "inactive" of "pending"
- Notities: Extra informatie

Facturering:
- Factuur_Email: Email voor facturen
- BTW_Nummer: BTW nummer
- BTW_Geverifieerd: "ja" of "nee"
- BTW_Reverse_Charge: "ja" of "nee"
- BTW_Vrijgesteld: "ja" of "nee"
- BTW_Vrijstelling_Reden: Reden voor vrijstelling

Locatie:
- Latitude: Breedtegraad
- Longitude: Lengtegraad
- Toon_Op_Kaart: "ja" of "nee"

Contact & Website:
- Website: Website URL
- Contactpersoon: Naam contactpersoon
- Contact_Voornaam: Voornaam contact
- Contact_Achternaam: Achternaam contact

Financiële Instellingen:
- Betaaltermijn: Tekst beschrijving
- Kredietlimiet: Bedrag
- Betaaltermijn_Dagen: Aantal dagen
- Op_Rekening_Toegestaan: "ja" of "nee"

Verzendadres (indien anders):
- Apart_Verzendadres: "ja" of "nee"
- Verzendadres: Verzendadres
- Verzendplaats: Verzendplaats
- Verzendpostcode: Verzendpostcode
- Verzendland: Verzendland

Bedrijfsinformatie:
- KVK_Nummer: KVK nummer
- Apart_Factuur_Email: "ja" of "nee"

Download het voorbeeld bestand en vul het in met je eigen data!`)
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  ℹ️ CSV Formaat Uitleg
                </button>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload een CSV bestand met klantgegevens. De eerste rij moet kolomnamen bevatten.
              </p>
            </div>

            {/* Field Mapping */}
            {headers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Veld Mapping</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Kies voor elk veld in je site welke CSV kolom daarbij hoort:
                </p>
                
                {/* Address Splitting Section */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">🔧 Adres Splitsen</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Als je CSV één kolom heeft met adres, postcode en plaats, kun je deze automatisch splitsen:
                  </p>
                  {fieldSplittingRules.map(rule => (
                    <div key={rule.name} className="mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`split-${rule.fields.join('-')}`}
                          checked={Object.values(mapping).some(value => rule.fields.includes(value))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Find a column that might contain address data
                              const addressColumn = headers.find(header => 
                                header.toLowerCase().includes('adres') || 
                                header.toLowerCase().includes('address') ||
                                header.toLowerCase().includes('straat') ||
                                header.toLowerCase().includes('woonplaats') ||
                                header.toLowerCase().includes('postcode') ||
                                header.toLowerCase().includes('plaats')
                              )
                              if (addressColumn) {
                                const newMapping = { ...mapping }
                                // Remove any existing mappings for these fields
                                Object.keys(newMapping).forEach(key => {
                                  if (rule.fields.includes(newMapping[key])) {
                                    delete newMapping[key]
                                  }
                                })
                                // Add split field mappings
                                rule.fields.forEach(field => {
                                  newMapping[`${addressColumn} (${field})`] = field
                                })
                                setMapping(newMapping)
                              }
                            } else {
                              // Remove all split field mappings
                              const newMapping = { ...mapping }
                              Object.keys(newMapping).forEach(key => {
                                if (rule.fields.includes(newMapping[key])) {
                                  delete newMapping[key]
                                }
                              })
                              setMapping(newMapping)
                            }
                          }}
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-yellow-300 rounded"
                        />
                        <label htmlFor={`split-${rule.fields.join('-')}`} className="text-sm font-medium text-yellow-800">
                          {rule.name}
                        </label>
                      </div>
                      <p className="text-xs text-yellow-600 ml-7 mt-1">
                        {rule.description} - Voorbeeld: "{rule.example}"
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  {customerFields.map(field => (
                    <div key={field.key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-[200px]">
                        <label className="text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {field.key}
                        </p>
                      </div>
                      <div className="flex-1">
                        <select
                          value={Object.keys(mapping).find(key => mapping[key] === field.key) || ''}
                          onChange={(e) => {
                            const selectedColumn = e.target.value
                            if (selectedColumn) {
                              // Remove any existing mapping for this field
                              const newMapping = { ...mapping }
                              Object.keys(newMapping).forEach(key => {
                                if (newMapping[key] === field.key) {
                                  delete newMapping[key]
                                }
                              })
                              // Add new mapping
                              newMapping[selectedColumn] = field.key
                              setMapping(newMapping)
                            } else {
                              // Remove mapping for this field
                              const newMapping = { ...mapping }
                              Object.keys(newMapping).forEach(key => {
                                if (newMapping[key] === field.key) {
                                  delete newMapping[key]
                                }
                              })
                              setMapping(newMapping)
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">-- Kies CSV kolom --</option>
                          {headers.map(header => (
                            <option 
                              key={header} 
                              value={header}
                              disabled={Object.values(mapping).includes(field.key) && mapping[header] !== field.key}
                            >
                              {header} {Object.values(mapping).includes(field.key) && mapping[header] === field.key ? '(✓)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-[100px] text-xs text-gray-500">
                        {field.required ? 'Verplicht' : 'Optioneel'}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mapping Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Mapping Overzicht:</h4>
                  <div className="text-sm text-blue-800">
                    {customerFields.filter(field => field.required).map(field => {
                      const mappedColumn = Object.keys(mapping).find(key => mapping[key] === field.key)
                      return (
                        <div key={field.key} className="flex items-center space-x-2">
                          <span className="font-medium">{field.label}:</span>
                          {mappedColumn ? (
                            <span className="text-green-600">✓ {mappedColumn}</span>
                          ) : (
                            <span className="text-red-600">✗ Niet gemapt</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Voorvertoning (eerste 5 rijen)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map(header => (
                          <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                        {/* Show split fields if any */}
                        {Object.keys(mapping).some(key => key.includes(' (')) && (
                          <>
                            {customerFields.filter(field => 
                              Object.values(mapping).some(mappedKey => 
                                mappedKey === field.key && mappedKey.includes(' (')
                              )
                            ).map(field => (
                              <th key={`split-${field.key}`} className="px-3 py-2 text-left text-xs font-medium text-blue-500 uppercase tracking-wider">
                                {field.label} (gesplitst)
                              </th>
                            ))}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {headers.map(header => (
                            <td key={header} className="px-3 py-2 text-sm text-gray-900">
                              {row[header] || ''}
                            </td>
                          ))}
                          {/* Show split field values */}
                          {Object.keys(mapping).some(key => key.includes(' (')) && (
                            <>
                              {customerFields.filter(field => 
                                Object.values(mapping).some(mappedKey => 
                                  mappedKey === field.key && mappedKey.includes(' (')
                                )
                              ).map(field => {
                                const splitHeader = Object.keys(mapping).find(key => mapping[key] === field.key)
                                if (splitHeader) {
                                  const baseColumn = splitHeader.split(' (')[0]
                                  const splitField = splitHeader.split(' (')[1].replace(')', '')
                                  const originalValue = row[baseColumn]
                                  
                                  let splitValue = ''
                                  if (originalValue) {
                                    // Try multiple regex patterns for Dutch addresses
                                    let addressMatch = null
                                    
                                    // Pattern 1: "Straat 123 1234 AB Stad" (most common)
                                    addressMatch = originalValue.match(/^(.+?)\s+(\d{4}\s*[A-Z]{2})\s+(.+)$/i)
                                    
                                    // Pattern 2: "Straat 123 1234AB Stad" (no space in postcode)
                                    if (!addressMatch) {
                                      addressMatch = originalValue.match(/^(.+?)\s+(\d{4}[A-Z]{2})\s+(.+)$/i)
                                    }
                                    
                                    // Pattern 3: "Straat 123 Stad 1234 AB" (city before postcode)
                                    if (!addressMatch) {
                                      addressMatch = originalValue.match(/^(.+?)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})$/i)
                                      if (addressMatch) {
                                        // Reorder groups: address, postcode, city
                                        const temp = addressMatch[2]
                                        addressMatch[2] = addressMatch[3]
                                        addressMatch[3] = temp
                                      }
                                    }
                                    
                                    if (addressMatch) {
                                      if (splitField === 'address') splitValue = addressMatch[1].trim()
                                      else if (splitField === 'postal_code') splitValue = addressMatch[2].trim()
                                      else if (splitField === 'city') splitValue = addressMatch[3].trim()
                                    } else {
                                      // Fallback: try to split by common patterns
                                      const parts = originalValue.split(/\s+/)
                                      if (parts.length >= 3) {
                                        // Look for postcode pattern (4 digits + 2 letters)
                                        const postcodeIndex = parts.findIndex(part => /^\d{4}[A-Z]{2}$/i.test(part))
                                        if (postcodeIndex > 0 && postcodeIndex < parts.length - 1) {
                                          if (splitField === 'address') splitValue = parts.slice(0, postcodeIndex).join(' ')
                                          else if (splitField === 'postal_code') splitValue = parts[postcodeIndex]
                                          else if (splitField === 'city') splitValue = parts.slice(postcodeIndex + 1).join(' ')
                                        }
                                      }
                                    }
                                  }
                                  
                                  return (
                                    <td key={`split-${field.key}`} className="px-3 py-2 text-sm text-blue-600 font-medium">
                                      {splitValue || '-'}
                                    </td>
                                  )
                                }
                                return null
                              })}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Button */}
            {csvData && (
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || !customerFields.filter(field => field.required).every(field => 
                    Object.values(mapping).includes(field.key)
                  )}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title={
                    !customerFields.filter(field => field.required).every(field => 
                      Object.values(mapping).includes(field.key)
                    ) 
                      ? 'Email moet gemapt worden om te kunnen importeren' 
                      : 'Klik om te importeren'
                  }
                >
                  {importing ? 'Importeren...' : 'Importeren'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
