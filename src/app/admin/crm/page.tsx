'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FirebaseService } from '@/lib/firebase'
import { FirebaseClientService } from '@/lib/firebase-client'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'
import Link from 'next/link'

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
  invoice_payment_terms_days?: number
  // CRM velden
  last_contact?: string
  last_visit?: string
  target?: number
  sales_notes?: string
}

interface CustomerGroup {
  id: string
  name: string
  discount_percentage: number
  description: string
  created_at: string
}

export default function CRMPage() {
  const [customers, customersLoading, customersError] = useFirebaseRealtime<Customer[]>('customers')
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [sortBy, setSortBy] = useState('company_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [groupTargets, setGroupTargets] = useState<Record<string, number>>({})
  const [lastContactByCustomer, setLastContactByCustomer] = useState<Record<string, string>>({})
  const [lastVisitByCustomer, setLastVisitByCustomer] = useState<Record<string, string>>({})

  // Kolom configuratie state - CRM focus
  const [columnConfig, setColumnConfig] = useState({
    id: { visible: true, width: 100, order: 0 },
    company_name: { visible: true, width: 200, order: 1 },
    contact_person: { visible: true, width: 150, order: 2 },
    postal_code: { visible: true, width: 100, order: 3 },
    city: { visible: true, width: 150, order: 4 },
    address: { visible: true, width: 200, order: 5 },
    email: { visible: true, width: 180, order: 6 },
    total_spent: { visible: true, width: 120, order: 7 },
    total_orders: { visible: true, width: 100, order: 8 },
    last_contact: { visible: true, width: 120, order: 9 },
    last_visit: { visible: true, width: 120, order: 10 },
    target: { visible: true, width: 100, order: 11 },
    status: { visible: true, width: 100, order: 12 },
    actions: { visible: true, width: 150, order: 13 }
  })

  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)

  // Kolom beheer functies
  const toggleColumnVisibility = (columnKey: string) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: { ...prev[columnKey as keyof typeof prev], visible: !prev[columnKey as keyof typeof prev].visible }
    }))
  }

  const updateColumnWidth = (columnKey: string, width: number) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnKey]: { ...prev[columnKey as keyof typeof prev], width: Math.max(50, width) }
    }))
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const columns = Object.entries(columnConfig).sort((a, b) => a[1].order - b[1].order)
    const [movedColumn] = columns.splice(fromIndex, 1)
    columns.splice(toIndex, 0, movedColumn)
    
    const newConfig = columns.reduce((acc, [key, config], index) => {
      acc[key] = { ...config, order: index }
      return acc
    }, {} as typeof columnConfig)
    
    setColumnConfig(newConfig)
  }

  const getVisibleColumns = () => {
    return Object.entries(columnConfig)
      .filter(([_, config]) => config.visible)
      .sort((a, b) => a[1].order - b[1].order)
  }

  const handleColumnResize = (columnKey: string, newWidth: number) => {
    updateColumnWidth(columnKey, newWidth)
  }

  const handleDragStart = (columnKey: string) => {
    setDraggedColumn(columnKey)
  }

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault()
    if (draggedColumn && draggedColumn !== columnKey) {
      const columns = getVisibleColumns()
      const fromIndex = columns.findIndex(([key]) => key === draggedColumn)
      const toIndex = columns.findIndex(([key]) => key === columnKey)
      if (fromIndex !== -1 && toIndex !== -1) {
        moveColumn(fromIndex, toIndex)
      }
    }
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  const router = useRouter()

  // VIES API functie voor BTW verificatie
  const verifyVatNumber = async (vatNumber: string, countryCode: string) => {
    try {
      const response = await fetch(`https://api.vatsensing.com/1.0/validate/?vat_number=${countryCode}${vatNumber}`)
      const data = await response.json()
      
      if (data.valid) {
        return {
          valid: true,
          company_name: data.company_name,
          address: data.address,
          country: data.country
        }
      } else {
        return {
          valid: false,
          error: 'BTW nummer is niet geldig'
        }
      }
    } catch (error) {
      console.error('VIES API error:', error)
      return {
        valid: false,
        error: 'Fout bij verificatie van BTW nummer'
      }
    }
  }

  // Update loading state based on customers loading
  useEffect(() => {
    setLoading(customersLoading)
  }, [customersLoading])

  // Load customer groups on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      // Try to load Firebase data first
      try {
        const [groupsData] = await Promise.all([
          FirebaseService.getCustomerGroups()
        ])
        
        if (groupsData && groupsData.length > 0) {
          setCustomerGroups(groupsData)
        } else {
          // Fallback to dummy groups
          const dummyGroups: CustomerGroup[] = [
            {
              id: '1',
              name: 'Premium Dealers',
              discount_percentage: 15,
              description: 'Hoogste korting voor premium dealers',
              created_at: '2023-01-01'
            },
            {
              id: '2',
              name: 'Standard Dealers',
              discount_percentage: 10,
              description: 'Standaard korting voor dealers',
              created_at: '2023-01-01'
            },
            {
              id: '3',
              name: 'Retail Klanten',
              discount_percentage: 5,
              description: 'Korting voor particuliere klanten',
              created_at: '2023-01-01'
            }
          ]
          setCustomerGroups(dummyGroups)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Fout bij het laden van data')
        
        console.log('Firebase data not available, using dummy data')
        // Use dummy data if Firebase fails
        const dummyGroups: CustomerGroup[] = [
          {
            id: '1',
            name: 'Premium Dealers',
            discount_percentage: 15,
            description: 'Hoogste korting voor premium dealers',
            created_at: '2023-01-01'
          },
          {
            id: '2',
            name: 'Standard Dealers',
            discount_percentage: 10,
            description: 'Standaard korting voor dealers',
            created_at: '2023-01-01'
          },
          {
            id: '3',
            name: 'Retail Klanten',
            discount_percentage: 5,
            description: 'Korting voor particuliere klanten',
            created_at: '2023-01-01'
          }
        ]
        setCustomerGroups(dummyGroups)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredCustomers = (customers || [])
    .filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus
      const matchesGroup = filterGroup === 'all' || customer.dealer_group === filterGroup
      
      return matchesSearch && matchesStatus && matchesGroup
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'id':
          comparison = (a.id || '').localeCompare(b.id || '')
          break
        case 'company_name':
          comparison = (a.company_name || '').localeCompare(b.company_name || '')
          break
        case 'contact_person':
          const contactA = `${a.contact_first_name || ''} ${a.contact_last_name || ''}`.trim()
          const contactB = `${b.contact_first_name || ''} ${b.contact_last_name || ''}`.trim()
          comparison = contactA.localeCompare(contactB)
          break
        case 'postal_code':
          comparison = (a.postal_code || '').localeCompare(b.postal_code || '')
          break
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '')
          break
        case 'address':
          comparison = (a.address || '').localeCompare(b.address || '')
          break
        case 'email':
          comparison = a.email.localeCompare(b.email)
          break
        case 'total_spent':
          comparison = a.total_spent - b.total_spent
          break
        case 'total_orders':
          comparison = a.total_orders - b.total_orders
          break
        case 'last_contact':
          const dateA = (lastContactByCustomer[a.id] ? new Date(lastContactByCustomer[a.id]).getTime() : (a.last_contact ? new Date(a.last_contact).getTime() : 0))
          const dateB = (lastContactByCustomer[b.id] ? new Date(lastContactByCustomer[b.id]).getTime() : (b.last_contact ? new Date(b.last_contact).getTime() : 0))
          comparison = dateA - dateB
          break
        case 'last_visit':
          const visitA = (lastVisitByCustomer[a.id] ? new Date(lastVisitByCustomer[a.id]).getTime() : (a.last_visit ? new Date(a.last_visit).getTime() : 0))
          const visitB = (lastVisitByCustomer[b.id] ? new Date(lastVisitByCustomer[b.id]).getTime() : (b.last_visit ? new Date(b.last_visit).getTime() : 0))
          comparison = visitA - visitB
          break
        case 'target':
          comparison = (a.target || 0) - (b.target || 0)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const getCustomerStats = () => {
    const total = (customers || []).length
    const active = (customers || []).filter(c => c.status === 'active').length
    const dealers = (customers || []).filter(c => c.is_dealer).length
    const totalRevenue = (customers || []).reduce((sum, c) => sum + (c.total_spent || 0), 0)
    
    return { total, active, dealers, totalRevenue }
  }

  // Calculate sets sold per customer for selected year (category = 'alloygator-set')
  // Note: this uses client Firestore read; for large datasets use server aggregation.
  const [salesByCustomer, setSalesByCustomer] = useState<Record<string, number>>({})
  useEffect(() => {
    const load = async () => {
      try {
        const orders = await FirebaseClientService.getOrders()
        const start = new Date(year, 0, 1).getTime()
        const end = new Date(year + 1, 0, 1).getTime()
        const map: Record<string, number> = {}
        for (const o of orders as any[]) {
          const ts = new Date(o.createdAt || o.created_at || new Date()).getTime()
          if (ts >= start && ts < end) {
            const cid = o.customer?.email || o.customer?.id || 'unknown'
            const sets = (o.items || []).filter((it: any) => (it.category || it.cat || '') === 'alloygator-set')
            const qty = sets.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0)
            map[cid] = (map[cid] || 0) + qty
          }
        }
        setSalesByCustomer(map)
      } catch (e) {
        setSalesByCustomer({})
      }
    }
    load()
  }, [year, customers])

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    if (columnKey === 'actions') return // Don't sort action column
    
    if (sortBy === columnKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, start with ascending
      setSortBy(columnKey)
      setSortDirection('asc')
    }
  }

  // Get sort indicator icon
  const getSortIcon = (columnKey: string) => {
    if (columnKey === 'actions') return null
    if (sortBy !== columnKey) {
      return <span className="text-gray-400 text-xs">↕️</span>
    }
    return sortDirection === 'asc' ? 
      <span className="text-green-600 text-xs">↑</span> : 
      <span className="text-green-600 text-xs">↓</span>
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Weet je zeker dat je deze klant wilt verwijderen?')) {
      try {
        await FirebaseService.deleteCustomer(customerId)
        // Customers will automatically update via useFirebaseRealtime
        alert('Klant succesvol verwijderd')
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Fout bij verwijderen van klant: ' + error)
      }
    }
  }

  const handleUpdateCustomer = async (customerId: string, updates: Partial<Customer>) => {
    try {
      await FirebaseService.updateCustomer(customerId, updates)
      // Customers will automatically update via useFirebaseRealtime
      alert('Klant succesvol bijgewerkt')
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Fout bij bijwerken van klant: ' + error)
    }
  }

  const handleAddCustomer = async (newCustomer: Omit<Customer, 'id'>) => {
    try {
      await FirebaseService.addCustomer(newCustomer)
      // Customers will automatically update via useFirebaseRealtime
      alert('Klant succesvol toegevoegd')
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Fout bij toevoegen van klant: ' + error)
    }
  }

  const handleSaveCustomer = async (customerData: Customer) => {
    try {
      setSaving(true)
      setError('')

      if (editingCustomer) {
        // Update existing customer
        await handleUpdateCustomer(editingCustomer.id, customerData)
      } else {
        // Create new customer
        await handleAddCustomer(customerData)
      }

      setShowCustomerModal(false)
      setSelectedCustomer(null)
      setEditingCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      setError('Fout bij het opslaan van klant')
    } finally {
      setSaving(false)
    }
  }

  const stats = getCustomerStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">CRM data laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM - Sales & Relaties</h1>
          <p className="text-gray-600">Beheer zakelijke relaties, sales activiteiten en targets</p>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2 bg-white border rounded px-3 py-2">
            <span className="text-sm text-gray-600">Jaar</span>
            <select value={year} onChange={(e)=>setYear(parseInt(e.target.value,10))} className="text-sm border rounded px-2 py-1">
              {[year-1, year, year+1].map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
          </div>
          <button
            onClick={() => setShowAddGroup(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            + Nieuwe Groep
          </button>
          <button
            onClick={() => setShowColumnSettings(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Kolom Instellingen
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
           <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
           <p className="text-sm text-green-700">
              <strong>CRM Focus:</strong> Deze pagina toont alleen essentiële zakelijke informatie. 
              Voor volledige klantgegevens en het toevoegen van nieuwe klanten, ga naar 
             <Link href="/admin/customers" className="font-medium underline hover:text-green-600">
                Klanten Overzicht
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
           <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totaal Klanten</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Actieve Klanten</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dealers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dealers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Omzet</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoeken</label>
            <input
              type="text"
              placeholder="Zoek op naam, email of bedrijf..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Alle statussen</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
              <option value="pending">In behandeling</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Groep</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Alle groepen</option>
              {customerGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sorteren</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="name">Naam A-Z</option>
              <option value="email">Email A-Z</option>
              <option value="total_orders">Meeste bestellingen</option>
              <option value="total_spent">Hoogste omzet</option>
              <option value="created_at">Nieuwste eerst</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Klanten ({filteredCustomers.length}) — Target performance ({year})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {getVisibleColumns().map(([columnKey, config]) => (
                  <th 
                    key={columnKey}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider relative"
                    style={{ width: config.width }}
                    draggable
                    onDragStart={() => handleDragStart(columnKey)}
                    onDragOver={(e) => handleDragOver(e, columnKey)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className={`cursor-move ${columnKey !== 'actions' ? 'cursor-pointer hover:text-green-600' : ''}`}
                        onClick={() => handleSort(columnKey)}
                      >
                        <div className="flex items-center space-x-1">
                          <span>
                            {columnKey === 'id' && 'Klant-ID'}
                            {columnKey === 'company_name' && 'Bedrijf'}
                            {columnKey === 'contact_person' && 'Contact'}
                            {columnKey === 'postal_code' && 'Postcode'}
                            {columnKey === 'city' && 'Woonplaats'}
                            {columnKey === 'address' && 'Straatnaam'}
                            {columnKey === 'email' && 'Email'}
                            {columnKey === 'total_spent' && 'Omzet'}
                            {columnKey === 'total_orders' && 'Bestellingen'}
                            {columnKey === 'last_contact' && 'Laatst Contact'}
                            {columnKey === 'last_visit' && 'Laatst Bezocht'}
                            {columnKey === 'target' && 'Target'}
                            {columnKey === 'status' && 'Status'}
                            {columnKey === 'actions' && 'Acties'}
                          </span>
                          {getSortIcon(columnKey)}
                        </div>
                      </span>
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-1 h-4 bg-gray-300 cursor-col-resize hover:bg-gray-400"
                          onMouseDown={() => setResizingColumn(columnKey)}
                        />
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sets ({year})</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer, idx) => (
                <tr key={`${customer.id || customer.email || 'row'}_${idx}`} className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer" onClick={() => {
                  console.log('🚀 Row clicked!')
                  console.log('Customer:', customer)
                  console.log('Customer ID:', customer.id)
                  const url = `/admin/crm/${customer.id}`
                  console.log('🚀 Navigating to:', url)
                  window.location.href = url
                }}>
                  {getVisibleColumns().map(([columnKey, config]) => (
                    <td 
                      key={columnKey} 
                      className="px-6 py-4 whitespace-nowrap"
                      style={{ width: config.width }}
                    >
                      {columnKey === 'id' && (
                        <div className="text-sm font-medium text-gray-900 font-mono">#{customer.id}</div>
                      )}
                      {columnKey === 'company_name' && (
                        <div className="text-sm font-semibold text-gray-900">{customer.company_name || '-'}</div>
                      )}
                      {columnKey === 'contact_person' && (
                        <div className="text-sm text-gray-900">{customer.contact_person || customer.name || '-'}</div>
                      )}
                      {columnKey === 'postal_code' && (
                        <div className="text-sm text-gray-900 font-mono">{customer.postal_code || '-'}</div>
                      )}
                      {columnKey === 'city' && (
                        <div className="text-sm text-gray-900">{customer.city || '-'}</div>
                      )}
                      {columnKey === 'address' && (
                        <div className="text-sm text-gray-900">{customer.address || '-'}</div>
                      )}
                      {columnKey === 'email' && (
                        <div className="text-sm text-gray-900">{customer.email}</div>
                      )}
                      {columnKey === 'total_spent' && (
                        <div className="text-sm font-semibold text-gray-900">€{(customer.total_spent || 0).toFixed(2)}</div>
                      )}
                      {columnKey === 'total_orders' && (
                        <div className="text-sm text-gray-900">{customer.total_orders}</div>
                      )}
                      {columnKey === 'last_contact' && (
                        <div className="text-sm text-gray-500">
                          {(lastContactByCustomer[customer.id] || customer.last_contact)
                            ? new Date(lastContactByCustomer[customer.id] || customer.last_contact).toLocaleDateString('nl-NL')
                            : '-'}
                        </div>
                      )}
                      {columnKey === 'last_visit' && (
                        <div className="text-sm text-gray-500">
                          {(lastVisitByCustomer[customer.id] || customer.last_visit)
                            ? new Date(lastVisitByCustomer[customer.id] || customer.last_visit).toLocaleDateString('nl-NL')
                            : '-'}
                        </div>
                      )}
                      {columnKey === 'target' && (
                        <div className="text-sm font-semibold text-green-600">
                          {customer.target ? `€${customer.target.toFixed(2)}` : '-'}
                        </div>
                      )}
                      {columnKey === 'status' && (
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' :
                          customer.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {customer.status === 'active' ? 'Actief' :
                           customer.status === 'inactive' ? 'Inactief' : 'In behandeling'}
                        </span>
                      )}
                      {columnKey === 'actions' && (
                        <div className="text-sm font-medium">
                          <button
                            onClick={() => {
                              console.log('🚀 CRM button clicked!')
                              console.log('Customer:', customer)
                              console.log('Customer ID:', customer.id)
                              const url = `/admin/crm/${customer.id}`
                              console.log('🚀 Navigating to:', url)
                              window.location.href = url
                            }}
                           className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                          >
                            CRM
                          </button>
                          <button 
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                          >
                            Bewerken
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            Verwijderen
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                  {(() => {
                    const id = customer.email || customer.id
                    const sold = salesByCustomer[id] || 0
                    const groupKey = String(customer.dealer_group || '').toLowerCase()
                    let target = groupTargets[groupKey] || 0
                    if (!target) {
                      const fuzzy = Object.entries(groupTargets).find(([k,v]) => Number(v)>0 && (groupKey.includes(k) || k.includes(groupKey)))
                      if (fuzzy) target = Number(fuzzy[1])
                    }
                    if (!target) {
                      const gk = groupKey ? groupKey.toLowerCase().replace(/dealers?|groep|group/g,'').trim() : ''
                      if (gk.includes('goud')||gk.includes('gold')) target = 30
                      else if (gk.includes('zilver')||gk.includes('silver')) target = 20
                      else if (gk.includes('brons')||gk.includes('bronze')) target = 10
                    }
                    const pct = target > 0 ? Math.min(100, Math.round((sold / target) * 100)) : 0
                    const badge = pct >= 100 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    return (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sold}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{target}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge}`}>{pct}%</span>
                        </td>
                      </>
                    )
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Groups */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Klantgroepen ({customerGroups.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Groep
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Korting
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customerGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{group.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {group.discount_percentage > 0 ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {group.discount_percentage}%
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                        Geen korting
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {group.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <button className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200">
                      Bewerken
                    </button>
                    <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
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

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <ColumnSettingsModal
          columnConfig={columnConfig}
          onUpdateConfig={(config) => setColumnConfig(config)}
          onClose={() => setShowColumnSettings(false)}
        />
      )}
    </div>
  )
}

// Customer Detail Modal Component
interface CustomerDetailModalProps {
  customer: Customer | null
  editingCustomer: Customer | null
  customerGroups: CustomerGroup[]
  onSave: (customer: Customer) => void
  onClose: () => void
  saving: boolean
}

function CustomerDetailModal({ customer, editingCustomer, customerGroups, onSave, onClose, saving }: CustomerDetailModalProps) {
  const [formData, setFormData] = useState<Customer>({
    id: '',
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
    last_order_date: '',
    created_at: '',
    notes: '',
    status: 'active',
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
    tax_exemption_reason: ''
  })



  useEffect(() => {
    if (editingCustomer) {
      setFormData(editingCustomer)
    } else if (customer) {
      setFormData(customer)
    }
  }, [customer, editingCustomer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const isEditing = !!editingCustomer
  const isViewing = !!customer && !editingCustomer

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Bewerk Klant' : isViewing ? 'Klant Details' : 'Nieuwe Klant'}
            </h2>
            <button
              onClick={onClose}
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
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Persoon
              </label>
              <input
                type="text"
                value={formData.contact_person || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefoon *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrijfsnaam
              </label>
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stad *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Land *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              />
            </div>

            {/* BTW/KvK velden verplaatst naar Klantgegevens pagina; hier weggehaald */}

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.vat_reverse_charge || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_reverse_charge: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={isViewing}
                />
                <span className="text-sm font-medium text-gray-700">BTW Verleggend</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.tax_exempt || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_exempt: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  disabled={isViewing}
                />
                <span className="text-sm font-medium text-gray-700">BTW Vrijgesteld</span>
              </label>
            </div>

            {formData.tax_exempt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BTW Vrijstelling Reden
                </label>
                <textarea
                  value={formData.tax_exemption_reason || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_exemption_reason: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  rows={2}
                  disabled={isViewing}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betalingsvoorwaarden
              </label>
              <select
                value={formData.payment_terms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              >
                <option value="">Selecteer betalingsvoorwaarden</option>
                <option value="immediate">Direct</option>
                <option value="7days">7 dagen</option>
                <option value="14days">14 dagen</option>
                <option value="30days">30 dagen</option>
                <option value="60days">60 dagen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kredietlimiet (€)
              </label>
              <input
                type="number"
                value={formData.credit_limit || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || null }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
                placeholder="52.3676"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || null }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
                placeholder="4.9041"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.is_dealer ? 'dealer' : 'customer'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_dealer: e.target.value === 'dealer' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              >
                <option value="customer">Klant</option>
                <option value="dealer">Dealer</option>
              </select>
            </div>

            {formData.is_dealer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dealer Groep
                </label>
                <select
                  value={formData.dealer_group || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealer_group: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  disabled={isViewing}
                >
                  <option value="">Selecteer groep</option>
                  {customerGroups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'pending' }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                disabled={isViewing}
              >
                <option value="active">Actief</option>
                <option value="inactive">Inactief</option>
                <option value="pending">In behandeling</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              rows={3}
              disabled={isViewing}
            />
          </div>

          {isViewing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Bestellingen</h3>
                <p className="text-2xl font-bold text-green-600">{formData.total_orders}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Totale Omzet</h3>
                <p className="text-2xl font-bold text-green-600">€{(formData.total_spent || 0).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">Laatste Bestelling</h3>
                <p className="text-sm text-gray-600">{formData.last_order_date || 'Geen'}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              {isViewing ? 'Sluiten' : 'Annuleren'}
            </button>
            {!isViewing && (
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Opslaan...' : (isEditing ? 'Bijwerken' : 'Aanmaken')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// Column Settings Modal Component
interface ColumnConfig {
  visible: boolean
  width: number
  order: number
}

interface ColumnSettingsModalProps {
  columnConfig: any
  onUpdateConfig: (config: any) => void
  onClose: () => void
}

function ColumnSettingsModal({ columnConfig, onUpdateConfig, onClose }: ColumnSettingsModalProps) {
  const [localConfig, setLocalConfig] = useState(columnConfig)

  const handleSave = () => {
    onUpdateConfig(localConfig)
    onClose()
  }

  const toggleColumnVisibility = (columnKey: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], visible: !prev[columnKey].visible }
    }))
  }

  const updateColumnWidth = (columnKey: string, width: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], width: Math.max(50, width) }
    }))
  }

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const columns = Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order)
    const [movedColumn] = columns.splice(fromIndex, 1)
    columns.splice(toIndex, 0, movedColumn)
    
    const newConfig = columns.reduce((acc, [key, config], index) => {
      acc[key] = { ...(config as ColumnConfig), order: index }
      return acc
    }, {} as any)
    
    setLocalConfig(newConfig)
  }

  const getColumnLabel = (columnKey: string) => {
    const labels: Record<string, string> = {
      id: 'Klant-ID',
      company_name: 'Bedrijf',
      contact_person: 'Contact',
      address: 'Adres',
      email: 'Email',
      total_spent: 'Omzet',
      total_orders: 'Bestellingen',
      last_contact: 'Laatst Contact',
      last_visit: 'Laatst Bezocht',
      target: 'Target',
      status: 'Status',
      actions: 'Acties'
    }
    return labels[columnKey] || columnKey
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Kolom Instellingen</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Zichtbare Kolommen</h3>
            <div className="space-y-3">
              {Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order).map(([columnKey, config]) => (
                <div key={columnKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={(config as ColumnConfig).visible}
                      onChange={() => toggleColumnVisibility(columnKey)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {getColumnLabel(columnKey)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Breedte:</span>
                      <input
                        type="number"
                        value={(config as ColumnConfig).width}
                        onChange={(e) => updateColumnWidth(columnKey, parseInt(e.target.value) || 100)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="50"
                        max="500"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          const columns = Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order)
                          const currentIndex = columns.findIndex(([key]) => key === columnKey)
                          if (currentIndex > 0) {
                            moveColumn(currentIndex, currentIndex - 1)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        disabled={Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order).findIndex(([key]) => key === columnKey) === 0}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const columns = Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order)
                          const currentIndex = columns.findIndex(([key]) => key === columnKey)
                          if (currentIndex < columns.length - 1) {
                            moveColumn(currentIndex, currentIndex + 1)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        disabled={Object.entries(localConfig).sort((a, b) => (a[1] as ColumnConfig).order - (b[1] as ColumnConfig).order).findIndex(([key]) => key === columnKey) === Object.entries(localConfig).length - 1}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
