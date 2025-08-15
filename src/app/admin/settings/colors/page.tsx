'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'

interface Color {
  id: string
  name: string
  hex_code: string
  created_at: string
  updated_at: string

}

export default function ColorsPage() {
  const [colors, loading, error] = useFirebaseRealtime<Color>('product_colors')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingColor, setEditingColor] = useState<Color | null>(null)
  const [formData, setFormData] = useState({ name: '', hex_code: '#000000' })



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const colorData = {
        ...formData,
        created_at: editingColor?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (editingColor) {
        await FirebaseService.updateProductColor(editingColor.id, colorData)
      } else {
        const colorDataWithId = {
          ...colorData,
          id: `color_${Date.now()}`
        }
        await FirebaseService.createProductColor(colorDataWithId)
      }

      setShowAddModal(false)
      setEditingColor(null)
      setFormData({ name: '', hex_code: '#000000' })
    } catch (error) {
      console.error('Error saving color:', error)
      alert('Fout bij opslaan van kleur')
    }
  }

  const handleEdit = (color: Color) => {
    setEditingColor(color)
    setFormData({ name: color.name, hex_code: color.hex_code })
    setShowAddModal(true)
  }

  const handleDelete = async (colorId: string) => {
    if (confirm('Weet je zeker dat je deze kleur wilt verwijderen?')) {
      try {
        await FirebaseService.deleteProductColor(colorId)
      } catch (error) {
        console.error('Error deleting color:', error)
        alert('Fout bij verwijderen van kleur')
      }
    }
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setEditingColor(null)
    setFormData({ name: '', hex_code: '#000000' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kleuren Beheer</h1>
          <p className="text-gray-600">Beheer beschikbare kleuren voor producten</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          ➕ Nieuwe Kleur
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Laden...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Beschikbare Kleuren</h2>
          </div>
          
          {(!Array.isArray(colors) || colors.length === 0) ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-4">🎨</div>
              <p>Nog geen kleuren toegevoegd</p>
              <p className="text-sm mt-2">Voeg je eerste kleur toe om te beginnen</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kleur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Naam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hex Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(colors as any[]).map((color) => (
                    <tr key={color.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-8 h-8 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex_code }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {color.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{color.hex_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(color)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => handleDelete(color.id)}
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
                {editingColor ? 'Kleur Bewerken' : 'Nieuwe Kleur Toevoegen'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kleur Naam
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="bijv. Rood, Blauw, Groen"
                    required
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kleur (Hex Code)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.hex_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, hex_code: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.hex_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, hex_code: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="#000000"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      required
                    />
                  </div>
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
                    {editingColor ? 'Opslaan' : 'Toevoegen'}
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
