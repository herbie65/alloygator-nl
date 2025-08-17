'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'

interface AttributeSet {
  id: string
  name: string
  description: string
  attributes: string[] // Array van attribute IDs
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface ProductAttribute {
  id: string
  name: string
  label: string
  type: string
  is_used_for_configurable: boolean
  is_active: boolean
  sort_order: number
}

export default function AttributeSetsPage() {
  const [attributeSets, setAttributeSets] = useState<AttributeSet[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSet, setEditingSet] = useState<AttributeSet | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Create default attribute set if none exist
  useEffect(() => {
    const createDefaultAttributeSet = async () => {
      if (!loading && (!Array.isArray(attributeSets) || attributeSets.length === 0)) {
        try {
          console.log('📋 Creating default attribute set...')
          
          // Get color and size attributes
          const colorAttr = attributes.find(attr => attr.name === 'color')
          const sizeAttr = attributes.find(attr => attr.name === 'size')
          
          if (colorAttr && sizeAttr) {
            // Create "Kleur & Maat" attribute set
            await FirebaseService.createAttributeSet({
              name: 'Kleur & Maat',
              description: 'Standaard attribuutset voor producten met kleur en maat opties',
              attributes: [colorAttr.id, sizeAttr.id],
              is_active: true,
              sort_order: 1
            })
            
            console.log('✅ Default attribute set created successfully')
            setRefreshKey(k => k + 1)
          } else {
            console.log('⚠️ Color or size attributes not found, cannot create default set')
          }
        } catch (error) {
          console.error('❌ Error creating default attribute set:', error)
        }
      }
    }
    
    if (attributes && attributes.length > 0) {
      createDefaultAttributeSet()
    }
  }, [loading, attributeSets, attributes, refreshKey])

  useEffect(() => {
    loadData()
  }, [refreshKey])

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading attribute sets and attributes...')
      
      const [setsData, attributesData] = await Promise.all([
        FirebaseService.getAttributeSets(),
        FirebaseService.getProductAttributes()
      ])
      
      console.log('📋 Attribute sets loaded:', setsData?.length || 0)
      console.log('🏷️ Attributes loaded:', attributesData?.length || 0)
      console.log('📝 Attributes details:', attributesData?.map(a => ({ name: a.name, label: a.label, values: a.values?.length || 0 })))
      
      setAttributeSets(setsData || [])
      setAttributes(attributesData || [])
    } catch (error) {
      console.error('❌ Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const setData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      attributes: editingSet?.attributes || [],
      is_active: true,
      sort_order: editingSet?.sort_order || 0
    }

    try {
      if (editingSet) {
        await FirebaseService.updateAttributeSet(editingSet.id, setData)
      } else {
        await FirebaseService.createAttributeSet(setData)
      }
      
      setShowModal(false)
      setEditingSet(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Error saving attribute set:', error)
    }
  }

  const handleEdit = (set: AttributeSet) => {
    setEditingSet(set)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze attribuutset wilt verwijderen?')) {
      try {
        await FirebaseService.deleteAttributeSet(id)
        setRefreshKey(k => k + 1)
      } catch (error) {
        console.error('Error deleting attribute set:', error)
      }
    }
  }

  const toggleAttribute = (attributeId: string) => {
    if (!editingSet) return
    
    const newAttributes = editingSet.attributes.includes(attributeId)
      ? editingSet.attributes.filter(id => id !== attributeId)
      : [...editingSet.attributes, attributeId]
    
    setEditingSet({ ...editingSet, attributes: newAttributes })
  }

  const getAttributeLabel = (attributeId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId)
    return attribute?.label || 'Onbekend attribuut'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attribuutsets</h1>
          <p className="text-gray-600 mt-2">
            Groepeer attributen in sets die je kunt koppelen aan configurable products
          </p>
        </div>

        {/* Info Block */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Hoe werkt het?</strong> Attribuutsets groeperen meerdere attributen (zoals Kleur + Maat) 
            die samen gebruikt worden voor configurable products. Bijvoorbeeld: een T-shirt met kleur en maat opties.
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingSet(null)
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nieuwe Attribuutset
          </button>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Naam
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschrijving
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attributen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attributeSets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Geen attribuutsets gevonden. Maak je eerste set aan!
                  </td>
                </tr>
              ) : (
                attributeSets.map((set) => (
                  <tr key={set.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {set.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {set.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {set.attributes.map((attrId) => (
                          <span
                            key={attrId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getAttributeLabel(attrId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {set.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actief
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactief
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(set)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(set.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingSet ? 'Attribuutset Bewerken' : 'Nieuwe Attribuutset'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingSet?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beschrijving
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingSet?.description || ''}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecteer Attributen
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {attributes
                        .filter(attr => attr.is_used_for_configurable)
                        .map((attribute) => (
                          <label key={attribute.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingSet?.attributes.includes(attribute.id) || false}
                              onChange={() => toggleAttribute(attribute.id)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {attribute.label} ({attribute.type})
                            </span>
                          </label>
                        ))}
                    </div>
                    {attributes.filter(attr => attr.is_used_for_configurable).length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Geen configurable attributen beschikbaar. Voeg eerst attributen toe in Product Attributen.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingSet(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {editingSet ? 'Bijwerken' : 'Aanmaken'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
