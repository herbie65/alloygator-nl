'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, LinkIcon } from '@heroicons/react/24/outline'

interface ProductVariant {
  id: string
  name: string
  sku: string
  ean_code: string
  price: number
  stock_quantity: number
  min_stock: number
  color?: string
  size?: string
  parent_product_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductAttribute {
  id: string
  name: string
  label: string
  type: string
  values?: Array<{
    id: string
    label: string
    value: string
    hex_code?: string
  }>
}

interface Product {
  id: string
  name: string
  sku: string
  is_configurable: boolean
}

export default function ProductVariantsPage() {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const loadData = async () => {
    try {
      setLoading(true)
      const [variantsData, attributesData, productsData] = await Promise.all([
        FirebaseService.getProductVariants(''),
        FirebaseService.getProductAttributes(),
        FirebaseService.getProducts()
      ])
      
      setVariants(variantsData || [])
      setAttributes(attributesData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const variantData = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      ean_code: formData.get('ean_code') as string,
      price: parseFloat(formData.get('price') as string),
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      min_stock: parseInt(formData.get('min_stock') as string),
      color: formData.get('color') as string || undefined,
      size: formData.get('size') as string || undefined,
      parent_product_id: formData.get('parent_product_id') as string || undefined,
      is_active: true
    }

    try {
      if (editingVariant) {
        await FirebaseService.updateProductVariant(editingVariant.id, variantData)
      } else {
        await FirebaseService.addProductVariant(variantData)
      }
      
      setShowModal(false)
      setEditingVariant(null)
      setRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Error saving variant:', error)
    }
  }

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je deze variant wilt verwijderen?')) {
      try {
        await FirebaseService.deleteProductVariant(id)
        setRefreshKey(k => k + 1)
      } catch (error) {
        console.error('Error deleting variant:', error)
      }
    }
  }

  const getAttributeValues = (attributeName: string) => {
    const attribute = attributes.find(attr => attr.name === attributeName)
    return attribute?.values || []
  }

  const getParentProductName = (parentId?: string) => {
    if (!parentId) return 'Geen hoofdproduct'
    const product = products.find(p => p.id === parentId)
    return product?.name || 'Onbekend product'
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
          <h1 className="text-3xl font-bold text-gray-900">Product Varianten</h1>
          <p className="text-gray-600 mt-2">
            Beheer simple product varianten die gekoppeld zijn aan configurable products
          </p>
        </div>

        {/* Info Block */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Hoe werkt het?</strong> Product varianten zijn simple products (zoals "T-shirt rood maat M") 
            die gekoppeld zijn aan een configurable hoofdproduct. Elke variant heeft eigen SKU, prijs en voorraad.
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingVariant(null)
              setShowModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nieuwe Variant
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
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prijs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voorraad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attributen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoofdproduct
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Geen varianten gevonden. Maak je eerste variant aan!
                  </td>
                </tr>
              ) : (
                variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {variant.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.ean_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{variant.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {variant.stock_quantity} (min: {variant.min_stock})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {variant.color && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {variant.color}
                          </span>
                        )}
                        {variant.size && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {variant.size}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getParentProductName(variant.parent_product_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(variant)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(variant.id)}
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
                  {editingVariant ? 'Variant Bewerken' : 'Nieuwe Variant'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingVariant?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      name="sku"
                      defaultValue={editingVariant?.sku || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EAN Code
                    </label>
                    <input
                      type="text"
                      name="ean_code"
                      defaultValue={editingVariant?.ean_code || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prijs (€)
                    </label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      defaultValue={editingVariant?.price || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voorraad
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        defaultValue={editingVariant?.stock_quantity || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Voorraad
                      </label>
                      <input
                        type="number"
                        name="min_stock"
                        defaultValue={editingVariant?.min_stock || ''}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kleur
                    </label>
                    <select
                      name="color"
                      defaultValue={editingVariant?.color || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Selecteer kleur --</option>
                      {getAttributeValues('color').map((value) => (
                        <option key={value.id} value={value.label}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maat
                    </label>
                    <select
                      name="size"
                      defaultValue={editingVariant?.size || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Selecteer maat --</option>
                      {getAttributeValues('size').map((value) => (
                        <option key={value.id} value={value.label}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hoofdproduct (optioneel)
                    </label>
                    <select
                      name="parent_product_id"
                      defaultValue={editingVariant?.parent_product_id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Geen hoofdproduct --</option>
                      {products
                        .filter(p => p.is_configurable)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        setEditingVariant(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {editingVariant ? 'Bijwerken' : 'Aanmaken'}
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
