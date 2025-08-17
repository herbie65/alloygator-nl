'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'

interface ProductAttribute {
  id: string
  name: string
  label: string
  type: 'dropdown' | 'select' | 'text' | 'number' | 'boolean'
  is_used_for_configurable: boolean
  is_active: boolean
  sort_order: number
  values?: Array<{
    id: string
    label: string
    value: string
    hex_code?: string
    sort_order: number
  }>
  created_at: string
  updated_at: string
}

export default function ProductAttributesPage() {
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [attributes, loading, error] = useFirebaseRealtime<ProductAttribute>('product_attributes', undefined, refreshKey)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    label: string
    type: 'dropdown' | 'select' | 'text' | 'number' | 'boolean'
    is_used_for_configurable: boolean
    is_active: boolean
    sort_order: number
  }>({
    name: '',
    label: '',
    type: 'dropdown',
    is_used_for_configurable: true, // Default to true for configurable products
    is_active: true,
    sort_order: 0
  })

  // Create default attributes if none exist
  useEffect(() => {
    const createDefaultAttributes = async () => {
      if (!loading && (!Array.isArray(attributes) || attributes.length === 0)) {
        try {
          console.log('🏷️ Creating default product attributes...')
          
          // Create "Kleur" attribute
          await FirebaseService.createProductAttribute({
            name: 'color',
            label: 'Kleur',
            type: 'dropdown',
            is_used_for_configurable: true,
            is_active: true,
            sort_order: 1
          })
          
          // Create "Maat" attribute
          await FirebaseService.createProductAttribute({
            name: 'size',
            label: 'Maat',
            type: 'dropdown',
            is_used_for_configurable: true,
            is_active: true,
            sort_order: 2
          })
          
          console.log('✅ Default attributes created successfully')
          setRefreshKey(k => k + 1)
        } catch (error) {
          console.error('❌ Error creating default attributes:', error)
        }
      }
    }
    
    createDefaultAttributes()
  }, [loading, attributes, refreshKey])

  // Migrate existing colors to attribute values
  useEffect(() => {
    const migrateColorsToAttributes = async () => {
      try {
        // Check if we have the color attribute but no values yet
        if (Array.isArray(attributes)) {
          const colorAttribute = attributes.find(attr => attr.name === 'color')
          console.log('🎨 Color attribute found:', colorAttribute)
          
          if (colorAttribute && !colorAttribute.values) {
            console.log('🎨 Migrating existing colors to attribute values...')
            
            // Get existing colors from the old system
            const existingColors = await FirebaseService.getProductColors()
            console.log('🎨 Existing colors found:', existingColors?.length || 0)
            
            if (Array.isArray(existingColors) && existingColors.length > 0) {
              // Convert colors to attribute values
              const colorValues = existingColors.map(color => ({
                id: color.id,
                label: color.name,
                value: color.name.toLowerCase(),
                hex_code: color.hex_code,
                sort_order: 0
              }))
              
              console.log('🎨 Color values to add:', colorValues)
              
              // Update the color attribute with values
              await FirebaseService.updateProductAttribute(colorAttribute.id, {
                ...colorAttribute,
                values: colorValues
              })
              
              console.log(`✅ Migrated ${colorValues.length} colors to attribute values`)
              setRefreshKey(k => k + 1)
            } else {
              console.log('⚠️ No existing colors found to migrate')
            }
          } else if (colorAttribute && colorAttribute.values) {
            console.log('✅ Color attribute already has values:', colorAttribute.values.length)
          } else {
            console.log('⚠️ Color attribute not found')
          }
        }
      } catch (error) {
        console.error('❌ Error migrating colors:', error)
      }
    }
    
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      migrateColorsToAttributes()
    }
  }, [attributes, refreshKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const attributeData = {
        ...formData,
        created_at: editingAttribute?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingAttribute) {
        await FirebaseService.updateProductAttribute(editingAttribute.id, attributeData)
      } else {
        await FirebaseService.createProductAttribute(attributeData)
      }

      setShowAddModal(false)
      setEditingAttribute(null)
      setFormData({
        name: '',
        label: '',
        type: 'dropdown',
        is_used_for_configurable: false,
        is_active: true,
        sort_order: 0
      })
      setRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Error saving attribute:', error)
      alert('Fout bij opslaan van attribuut')
    }
  }

  const handleEdit = (attribute: ProductAttribute) => {
    setEditingAttribute(attribute)
    setFormData({
      name: attribute.name,
      label: attribute.label,
      type: attribute.type,
      is_used_for_configurable: attribute.is_used_for_configurable,
      is_active: attribute.is_active,
      sort_order: attribute.sort_order
    })
    setShowAddModal(true)
  }

  const handleDelete = async (attributeId: string) => {
    if (confirm('Weet je zeker dat je dit attribuut wilt verwijderen?')) {
      try {
        await FirebaseService.deleteProductAttribute(attributeId)
        setRefreshKey(k => k + 1)
      } catch (error) {
        console.error('Error deleting attribute:', error)
        alert('Fout bij verwijderen van attribuut')
      }
    }
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setEditingAttribute(null)
    setFormData({
      name: '',
      label: '',
      type: 'dropdown',
      is_used_for_configurable: false,
      is_active: true,
      sort_order: 0
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Attributen</h1>
          <p className="text-gray-600">Beheer product attributen voor configurable products</p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Hoe werkt het?</strong> Attributen bepalen welke eigenschappen klanten kunnen kiezen bij configurable products.
              <br />
              <strong>Voorbeeld:</strong> Een T-shirt met attributen "Kleur" en "Maat" kan klanten laten kiezen tussen "Rood + M", "Blauw + L", etc.
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            ➕ Nieuw Attribuut
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Laden...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Beschikbare Attributen</h2>
          </div>
          
          {(!Array.isArray(attributes) || attributes.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">🏷️</div>
              <p>Nog geen attributen toegevoegd</p>
              <p className="text-sm mt-2">Voeg je eerste attribuut toe om te beginnen</p>
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-md mx-auto">
                <p className="text-xs text-gray-600">
                  <strong>💡 Tip:</strong> Standaard worden "Kleur" en "Maat" attributen automatisch aangemaakt.
                  <br />
                  Deze verschijnen hier zodra ze zijn aangemaakt.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Naam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waarden
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Configurable
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
                  {(attributes as any[]).map((attribute) => (
                    <tr key={attribute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {attribute.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attribute.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          attribute.type === 'dropdown' ? 'bg-blue-100 text-blue-800' :
                          attribute.type === 'select' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {attribute.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attribute.values && attribute.values.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {attribute.values.map((value, index) => (
                              <span
                                key={value.id}
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  value.hex_code ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {value.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Geen waarden</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attribute.is_used_for_configurable ? (
                          <span className="text-green-600">✓ Ja</span>
                        ) : (
                          <span className="text-gray-400">✗ Nee</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attribute.is_active ? (
                          <span className="text-green-600">Actief</span>
                        ) : (
                          <span className="text-red-600">Inactief</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(attribute)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => handleDelete(attribute.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAttribute ? 'Attribuut Bewerken' : 'Nieuw Attribuut Toevoegen'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="bijv. color, size, material"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Interne naam voor het attribuut (Engels, geen spaties)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="bijv. Kleur, Maat, Materiaal"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Naam die klanten zien in de webshop
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="select">Select</option>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Hoe het attribuut wordt weergegeven in de webshop
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_used_for_configurable"
                    checked={formData.is_used_for_configurable}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_used_for_configurable: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_used_for_configurable" className="ml-2 text-sm text-gray-700">
                    Gebruikt voor Configurable Product
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Actief
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sorteer Volgorde
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingAttribute ? 'Opslaan' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
