'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  customer_group_id: string
  group_name?: string
  is_dealer: boolean
  show_on_map: boolean
  vat_number: string | null
  vat_verified: boolean
  vat_reverse_charge: boolean
  lat?: number
  lng?: number
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
  // CRM velden
  annual_target?: number
  current_sales?: number
  last_visit?: string
  last_call?: string
  next_follow_up?: string
  notes?: string
  birthday?: string
  contract_end_date?: string
}

interface VisitHistory {
  id: string
  customer_id: string
  visit_date: string
  visit_type: 'visit' | 'call' | 'email'
  notes: string
  follow_up_date?: string
  follow_up_notes?: string
  created_at: string
}

interface Task {
  id: string
  customer_id: string
  title: string
  description: string
  due_date: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed' | 'overdue'
  type: 'follow_up' | 'birthday' | 'contract' | 'target' | 'other'
  created_at: string
}

interface Document {
  id: string
  customer_id: string
  title: string
  type: 'quote' | 'contract' | 'photo' | 'note' | 'other'
  file_url: string
  description?: string
  created_at: string
}

export default function CustomerCRM() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'tasks' | 'documents' | 'map'>('overview')

  // Form states
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)

  // Form data
  const [newVisit, setNewVisit] = useState({
    visit_type: 'visit' as 'visit' | 'call' | 'email',
    notes: '',
    follow_up_date: '',
    follow_up_notes: ''
  })

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'follow_up' as 'follow_up' | 'birthday' | 'contract' | 'target' | 'other'
  })

  const [newDocument, setNewDocument] = useState({
    title: '',
    type: 'note' as 'quote' | 'contract' | 'photo' | 'note' | 'other',
    description: '',
    file_url: ''
  })

  const [targetData, setTargetData] = useState({
    annual_target: 0,
    current_sales: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      fetchVisitHistory(selectedCustomer.id)
      fetchTasks(selectedCustomer.id)
      fetchDocuments(selectedCustomer.id)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    try {
      const data = await FirebaseClientService.getCustomers()
      setCustomers(data as Customer[])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setLoading(false)
    }
  }

  const fetchVisitHistory = async (customerId: string) => {
    try {
      // Voor nu lege array - wordt later geïmplementeerd
      setVisitHistory([])
    } catch (error) {
      console.error('Error fetching visit history:', error)
    }
  }

  const fetchTasks = async (customerId: string) => {
    try {
      // Voor nu lege array - wordt later geïmplementeerd
      setTasks([])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchDocuments = async (customerId: string) => {
    try {
      // Voor nu lege array - wordt later geïmplementeerd
      setDocuments([])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      const visitData = {
        customer_id: selectedCustomer.id,
        visit_date: new Date().toISOString(),
        ...newVisit
      }
      await FirebaseClientService.addDocument('visit_history', visitData)
      setShowVisitModal(false)
      setNewVisit({
        visit_type: 'visit',
        notes: '',
        follow_up_date: '',
        follow_up_notes: ''
      })
      fetchVisitHistory(selectedCustomer.id)
      alert('Bezoek succesvol toegevoegd!')
    } catch (error) {
      console.error('Error adding visit:', error)
      alert('Fout bij toevoegen bezoek')
    }
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      const taskData = {
        customer_id: selectedCustomer.id,
        ...newTask,
        status: 'pending' as 'pending' | 'completed' | 'overdue'
      }
      await FirebaseClientService.addDocument('tasks', taskData)
      setShowTaskModal(false)
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        type: 'follow_up'
      })
      fetchTasks(selectedCustomer.id)
      alert('Taak succesvol toegevoegd!')
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Fout bij toevoegen taak')
    }
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      const documentData = {
        customer_id: selectedCustomer.id,
        ...newDocument
      }
      await FirebaseClientService.addDocument('documents', documentData)
      setShowDocumentModal(false)
      setNewDocument({
        title: '',
        type: 'note',
        description: '',
        file_url: ''
      })
      fetchDocuments(selectedCustomer.id)
      alert('Document succesvol toegevoegd!')
    } catch (error) {
      console.error('Error adding document:', error)
      alert('Fout bij toevoegen document')
    }
  }

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      await FirebaseClientService.updateDocumentInCollection('customers', selectedCustomer.id, {
        annual_target: targetData.annual_target,
        current_sales: targetData.current_sales
      })
      setShowTargetModal(false)
      fetchCustomers()
      alert('Target succesvol bijgewerkt!')
    } catch (error) {
      console.error('Error updating target:', error)
      alert('Fout bij bijwerken target')
    }
  }

  const getTargetProgress = (customer: Customer) => {
    if (!customer.annual_target) return 0
    return Math.round((customer.current_sales || 0) / customer.annual_target * 100)
  }

  const getTargetStatus = (customer: Customer) => {
    const progress = getTargetProgress(customer)
    if (progress >= 100) return 'success'
    if (progress >= 75) return 'warning'
    return 'danger'
  }

  if (loading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Relationship Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Klanten</h3>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-green-100 border-green-300 border'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{customer.name}</h4>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-gray-600">{customer.city}</p>
                    </div>
                    <div className="text-right">
                      {customer.annual_target && (
                        <div className={`text-xs px-2 py-1 rounded ${
                          getTargetStatus(customer) === 'success' ? 'bg-green-100 text-green-800' :
                          getTargetStatus(customer) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getTargetProgress(customer)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="lg:col-span-1">
          {selectedCustomer ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">{selectedCustomer.email}</p>
                  <p className="text-gray-600">{selectedCustomer.address}, {selectedCustomer.city}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowTargetModal(true)}
                   className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Target Instellen
                  </button>
                  <button
                    onClick={() => setShowVisitModal(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Bezoek Toevoegen
                  </button>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700"
                  >
                    Taak Toevoegen
                  </button>
                  <button
                    onClick={() => setShowDocumentModal(true)}
                    className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
                  >
                    Document Toevoegen
                  </button>
                </div>
              </div>

              {/* Target Progress */}
              {selectedCustomer.annual_target && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Jaarlijks Target</h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      €{selectedCustomer.current_sales?.toLocaleString() || 0} / €{selectedCustomer.annual_target.toLocaleString()}
                    </span>
                    <span className={`text-sm font-medium ${
                      getTargetStatus(selectedCustomer) === 'success' ? 'text-green-600' :
                      getTargetStatus(selectedCustomer) === 'warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {getTargetProgress(selectedCustomer)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        getTargetStatus(selectedCustomer) === 'success' ? 'bg-green-500' :
                        getTargetStatus(selectedCustomer) === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(getTargetProgress(selectedCustomer), 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overzicht' },
                    { id: 'visits', label: 'Bezoeken' },
                    { id: 'tasks', label: 'Taken' },
                    { id: 'documents', label: 'Documenten' },
                    { id: 'map', label: 'Kaart' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="bg-green-50 p-4 rounded-lg">
                     <h4 className="font-medium text-green-900">Laatste Bezoek</h4>
                     <p className="text-green-600">
                        {selectedCustomer.last_visit ? new Date(selectedCustomer.last_visit).toLocaleDateString('nl-NL') : 'Nog niet bezocht'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900">Laatste Gesprek</h4>
                      <p className="text-green-600">
                        {selectedCustomer.last_call ? new Date(selectedCustomer.last_call).toLocaleDateString('nl-NL') : 'Nog niet gebeld'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900">Volgende Follow-up</h4>
                      <p className="text-purple-600">
                        {selectedCustomer.next_follow_up ? new Date(selectedCustomer.next_follow_up).toLocaleDateString('nl-NL') : 'Geen gepland'}
                      </p>
                    </div>
                  </div>
                  {selectedCustomer.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Notities</h4>
                      <p className="text-gray-700">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visits' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Bezoekhistorie</h4>
                  <div className="space-y-3">
                    {visitHistory.map((visit) => (
                      <div key={visit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {visit.visit_type === 'visit' ? 'Bezoek' : visit.visit_type === 'call' ? 'Telefoongesprek' : 'Email'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(visit.visit_date).toLocaleDateString('nl-NL')}
                            </p>
                            <p className="text-gray-700 mt-2">{visit.notes}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            visit.visit_type === 'visit' ? 'bg-green-100 text-green-800' :
                            visit.visit_type === 'call' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {visit.visit_type}
                          </span>
                        </div>
                        {visit.follow_up_date && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                              Follow-up: {new Date(visit.follow_up_date).toLocaleDateString('nl-NL')}
                            </p>
                            {visit.follow_up_notes && (
                              <p className="text-sm text-gray-700 mt-1">{visit.follow_up_notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Taken</h4>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-600">
                              Vervaldatum: {new Date(task.due_date).toLocaleDateString('nl-NL')}
                            </p>
                            <p className="text-gray-700 mt-2">{task.description}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-100 text-red-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'overdue' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Documenten</h4>
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{document.title}</p>
                            <p className="text-sm text-gray-600">
                              Type: {document.type}
                            </p>
                            {document.description && (
                              <p className="text-gray-700 mt-2">{document.description}</p>
                            )}
                          </div>
                          <a
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Bekijken
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Locatie</h4>
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <p className="text-gray-600">Google Maps integratie komt hier</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Coördinaten: {selectedCustomer.lat}, {selectedCustomer.lng}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-600">Selecteer een klant om CRM gegevens te bekijken</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-[95vw] h-[95vh] mx-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bezoek Toevoegen</h3>
            <form onSubmit={handleAddVisit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newVisit.visit_type}
                  onChange={(e) => setNewVisit({ ...newVisit, visit_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="visit">Bezoek</option>
                  <option value="call">Telefoongesprek</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notities</label>
                                  <textarea
                    value={newVisit.notes}
                    onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Wat is besproken?"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Follow-up Datum</label>
                <input
                  type="date"
                  value={newVisit.follow_up_date}
                  onChange={(e) => setNewVisit({ ...newVisit, follow_up_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Follow-up Notities</label>
                                  <textarea
                    value={newVisit.follow_up_notes}
                    onChange={(e) => setNewVisit({ ...newVisit, follow_up_notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Wat moet er gebeuren?"
                  />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-[95vw] h-[95vh] mx-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Taak Toevoegen</h3>
            <form onSubmit={handleAddTask} className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschrijving</label>
                                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vervaldatum</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioriteit</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="low">Laag</option>
                    <option value="medium">Medium</option>
                    <option value="high">Hoog</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="follow_up">Follow-up</option>
                  <option value="birthday">Verjaardag</option>
                  <option value="contract">Contract</option>
                  <option value="target">Target</option>
                  <option value="other">Anders</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDocumentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-[95vw] h-[95vh] mx-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Document Toevoegen</h3>
            <form onSubmit={handleAddDocument} className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="quote">Offerte</option>
                  <option value="contract">Contract</option>
                  <option value="photo">Foto</option>
                  <option value="note">Notitie</option>
                  <option value="other">Anders</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={newDocument.file_url}
                  onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://example.com/document.pdf"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschrijving</label>
                <textarea
                  value={newDocument.description}
                  onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTargetModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-[95vw] h-[95vh] mx-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Target Instellen</h3>
            <form onSubmit={handleUpdateTarget} className="space-y-8">
              <div>
                <label className="block text-sm font-medium mb-1">Jaarlijks Target (€)</label>
                <input
                  type="number"
                  value={targetData.annual_target}
                  onChange={(e) => setTargetData({ ...targetData, annual_target: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Huidige Verkoop (€)</label>
                <input
                  type="number"
                  value={targetData.current_sales}
                  onChange={(e) => setTargetData({ ...targetData, current_sales: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 