"use client"

import { useEffect, useState } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

interface Group { id:string; name:string; discount_percentage?:number; description?:string; annual_target_sets?:number }

export default function CustomerGroupsPage(){
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<any[]>([])

  // Create form state
  const [newName, setNewName] = useState('')
  const [newDiscount, setNewDiscount] = useState<number>(0)
  const [newTarget, setNewTarget] = useState<number>(0)
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

useEffect(() => { (async () => {
  try {
    setLoading(true)
    const [g, custs] = await Promise.all([
      FirebaseClientService.getCustomerGroups(),
      FirebaseClientService.getCustomers()
    ])
    const raw = Array.isArray(g) ? g : []

    const norm: Group[] = raw.map((x: any) => ({
      id: String(x.id ?? `${Date.now()}-${Math.random()}`),
      name: String(x.name ?? 'Naamloos'),
      discount_percentage: Number(x.discount_percentage ?? 0),
      description: String(x.description ?? ''),
      annual_target_sets: Number(
        // gebruik bestaande target indien aanwezig; anders 0
        x.annual_target_sets ?? x.target ?? 0
      ),
    }))

    setGroups(norm)
    setCustomers(Array.isArray(custs) ? custs : [])
  } catch (e: any) {
    setError(e?.message || 'Fout bij laden')
  } finally {
    setLoading(false)
  }
})() }, [])

  const updateTarget = async (id:string, target:number)=>{
    try{
      await FirebaseClientService.updateDocumentInCollection('customer_groups', id, { annual_target_sets: target, updated_at: new Date().toISOString() })
      setGroups(prev=> prev.map(g=> g.id===id? { ...g, annual_target_sets: target}: g))
    }catch(e){ console.error(e) }
  }

  const updateDiscount = async (id:string, discount:number)=>{
    try{
      await FirebaseClientService.updateDocumentInCollection('customer_groups', id, { discount_percentage: discount, updated_at: new Date().toISOString() })
      setGroups(prev=> prev.map(g=> g.id===id? { ...g, discount_percentage: discount}: g))
    }catch(e){ console.error(e) }
  }

  const linkedCount = (groupName: string)=>{
    const normalize = (v:any)=> String(v||'').toLowerCase().trim()
    return customers.filter(c=> normalize(c.dealer_group) === normalize(groupName)).length
  }

  const deleteGroup = async (group: Group)=>{
    const count = linkedCount(group.name)
    if (count > 0){
      alert(`Kan niet verwijderen: ${count} klant(en) gekoppeld aan "${group.name}"`)
      return
    }
    if (!confirm(`Weet je zeker dat je "${group.name}" wilt verwijderen?`)) return
    try{
      await FirebaseClientService.deleteDocumentFromCollection('customer_groups', group.id)
      setGroups(prev=> prev.filter(g=> g.id !== group.id))
    }catch(e){ console.error(e); alert('Verwijderen mislukt') }
  }

  const createGroup = async ()=>{
    if (!newName.trim()) { alert('Naam is verplicht'); return }
    try{
      setCreating(true)
      const payload:any = {
        name: newName.trim(),
        discount_percentage: Number(newDiscount||0),
        description: newDescription.trim(),
        annual_target_sets: Number(newTarget||0),
      }
      const created = await FirebaseClientService.addDocument('customer_groups', payload)
      setGroups(prev=> [...prev, { id: created.id, ...payload }])
      setNewName(''); setNewDiscount(0); setNewTarget(0); setNewDescription('')
    }catch(e){ console.error(e); alert('Aanmaken mislukt') }
    finally{ setCreating(false) }
  }

  if (loading) return <div className="p-6">Laden…</div>
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Klantgroepen</h1>
        <p className="text-gray-600">Beheer groepen en jaarlijkse targets (sets/jr)</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="font-semibold mb-3">Nieuwe groep</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input placeholder="Naam" value={newName} onChange={(e)=> setNewName(e.target.value)} className="px-2 py-1 border rounded" />
          <input placeholder="Korting %" type="number" value={newDiscount} onChange={(e)=> setNewDiscount(parseFloat(e.target.value||'0'))} className="px-2 py-1 border rounded" />
          <input placeholder="Target (sets/jr)" type="number" value={newTarget} onChange={(e)=> setNewTarget(parseInt(e.target.value||'0',10))} className="px-2 py-1 border rounded" />
          <div className="flex items-center gap-2">
            <input placeholder="Beschrijving" value={newDescription} onChange={(e)=> setNewDescription(e.target.value)} className="flex-1 px-2 py-1 border rounded" />
            <button onClick={createGroup} disabled={creating} className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-60">{creating? 'Aanmaken…':'Aanmaken'}</button>
          </div>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Groep</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Korting</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Target (sets/jr)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Beschrijving</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {groups.map(g=> (
              <tr key={g.id}>
                <td className="px-6 py-3 font-medium text-gray-900">{g.name}</td>
                <td className="px-6 py-3">
                  <input type="number" value={g.discount_percentage ?? 0} onChange={(e)=> updateDiscount(g.id, parseFloat(e.target.value||'0'))} className="w-24 px-2 py-1 border rounded" />
                </td>
                <td className="px-6 py-3">
                  <input type="number" value={g.annual_target_sets ?? 0} onChange={(e)=> updateTarget(g.id, parseInt(e.target.value||'0',10))} className="w-24 px-2 py-1 border rounded"/>
                </td>
                <td className="px-6 py-3">{g.description || '-'}</td>
                <td className="px-6 py-3">
                  {linkedCount(g.name) > 0 ? (
                    <span className="text-gray-500">Gekoppeld ({linkedCount(g.name)})</span>
                  ) : (
                    <button onClick={()=> deleteGroup(g)} className="text-red-600 hover:underline">Verwijderen</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* // Legacy editor (uitgeschakeld, bewaard voor later gebruik). Niet exporteren/instantiëren.
// 'use client'
// import { useState, useEffect } from 'react'
// import { FirebaseService } from '@/lib/firebase'

interface CustomerGroup {
  id: string
  name: string
  description: string
  discount_percentage: number
  show_on_map: boolean
  created_at: string
  updated_at: string
}

function LegacyCustomerGroupsEditor() {
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CustomerGroup | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: 0,
    show_on_map: false
  })

  useEffect(() => {
    loadCustomerGroups()
  }, [])

  const loadCustomerGroups = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Probeer eerst Firebase data te laden
      try {
        const groups = await FirebaseService.getCustomerGroups()
        if (groups && groups.length > 0) {
          setCustomerGroups(groups)
          return
        }
      } catch (firebaseError) {
        console.log('Firebase data niet beschikbaar, gebruik dummy data')
      }
      
      // Fallback naar dummy data als Firebase leeg is
      const dummyGroups: CustomerGroup[] = [
        {
          id: '1',
          name: 'Particulieren',
          description: 'Reguliere particuliere klanten',
          discount_percentage: 0,
          show_on_map: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Brons Dealers',
          description: 'Brons niveau dealers',
          discount_percentage: 10,
          show_on_map: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          name: 'Zilver Dealers',
          description: 'Zilver niveau dealers',
          discount_percentage: 15,
          show_on_map: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'Goud Dealers',
          description: 'Goud niveau dealers',
          discount_percentage: 20,
          show_on_map: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      
      setCustomerGroups(dummyGroups)
    } catch (error) {
      console.error('Error loading customer groups:', error)
      setError('Fout bij het laden van klantgroepen')
    } finally {
      setLoading(false)
    }
  }

  const saveToFirebase = async (groupData: any, isUpdate = false) => {
    try {
      if (isUpdate) {
        await FirebaseService.updateCustomerGroup(groupData.id, groupData)
      } else {
        await FirebaseService.createCustomerGroup(groupData)
      }
      return true
    } catch (error) {
      console.error('Firebase save error:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError('')
      
      const groupData = {
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (editingGroup) {
        // Update bestaande groep
        const updatedGroup = { ...editingGroup, ...groupData }
        
        // Probeer Firebase update
        const firebaseSuccess = await saveToFirebase(updatedGroup, true)
        
        if (firebaseSuccess) {
          setCustomerGroups(prev => prev.map(group => 
            group.id === editingGroup.id ? updatedGroup : group
          ))
        } else {
          // Fallback naar lokale update
          setCustomerGroups(prev => prev.map(group => 
            group.id === editingGroup.id ? updatedGroup : group
          ))
        }
        
        setEditingGroup(null)
      } else {
        // Nieuwe groep toevoegen
        const newGroup: CustomerGroup = {
          id: Date.now().toString(),
          ...groupData
        }
        
        // Probeer Firebase save
        const firebaseSuccess = await saveToFirebase(newGroup)
        
        if (firebaseSuccess) {
          setCustomerGroups(prev => [...prev, newGroup])
        } else {
          // Fallback naar lokale save
          setCustomerGroups(prev => [...prev, newGroup])
        }
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        discount_percentage: 0,
        show_on_map: false
      })
      setShowForm(false)
      
    } catch (error) {
      console.error('Error saving customer group:', error)
      setError('Fout bij het opslaan van klantgroep')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (group: CustomerGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description,
      discount_percentage: group.discount_percentage,
      show_on_map: group.show_on_map
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze klantgroep wilt verwijderen?')) {
      try {
        // Probeer Firebase delete
        try {
          await FirebaseService.deleteCustomerGroup(id)
        } catch (error) {
          console.log('Firebase delete niet beschikbaar, lokale delete')
        }
        
        // Lokale delete
        setCustomerGroups(prev => prev.filter(group => group.id !== id))
      } catch (error) {
        console.error('Error deleting customer group:', error)
        setError('Fout bij het verwijderen van klantgroep')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGroup(null)
    setFormData({
      name: '',
      description: '',
      discount_percentage: 0,
      show_on_map: false
    })
    setError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klantgroepen</h1>
          <p className="text-gray-600">Beheer klantgroepen en kortingen</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          + Nieuwe Klantgroep
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {editingGroup ? 'Bewerk Klantgroep' : 'Nieuwe Klantgroep'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Naam *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                Korting (%)
              </label>
              <input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-center">
              <input
                id="show_on_map"
                type="checkbox"
                checked={formData.show_on_map}
                onChange={(e) => setFormData(prev => ({ ...prev, show_on_map: e.target.checked }))}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-all duration-200"
              />
              <label htmlFor="show_on_map" className="ml-3 block text-sm text-gray-700">
                Tonen op "Vind een Dealer" pagina
              </label>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? 'Opslaan...' : (editingGroup ? 'Bijwerken' : 'Aanmaken')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all duration-200"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Klantgroepen laden...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Naam
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Korting
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Dealer Pagina
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
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{group.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {group.discount_percentage > 0 ? (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {group.discount_percentage}%
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                          Geen korting
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      group.show_on_map 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.show_on_map ? 'Zichtbaar' : 'Verborgen'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

 */
