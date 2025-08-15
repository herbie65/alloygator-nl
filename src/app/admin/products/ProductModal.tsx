'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import dynamic from 'next/dynamic'
// TipTapEditor als stabiele module-scope component, zodat hij NIET remount bij elke toetsaanslag
const TipTapEditor = dynamic(() => import('../cms/TipTapEditor'), { ssr: false })
import MediaPickerModal from '../components/MediaPickerModal'
import type { Product } from '@/types/product'

interface ProductModalProps {
  product?: Partial<Product> | null;   // <-- nu optioneel & partial
  isEditing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Product) => void | Promise<void>;
}

export default function ProductModal({ product, isEditing, isOpen, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product & { min_stock?: number }>>({})
  const [productAttributes, setProductAttributes] = useState<any[]>([])
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({})
  const [productColors, setProductColors] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showMedia, setShowMedia] = useState(false)
  // Lokale conceptvelden voor WYSIWYG zodat er niets buiten deze modal wordt geüpdatet tijdens typen
  const [shortDraft, setShortDraft] = useState<string>('')
  const [longDraft, setLongDraft] = useState<string>('')

  const normalizeCategory = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, '-')
  const categoryLabelFromSlug = (slug: string) => {
    switch (slug) {
      case 'alloygator-set': return 'AlloyGator Set'
      case 'montagehulpmiddelen': return 'Montagehulpmiddelen'
      case 'accessoires': return 'Accessoires'
      default: return slug || 'Algemeen'
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      // Als we een product-ID hebben: vers, direct uit de database ophalen
      if (product?.id) {
        try {
          const latest: any = await FirebaseService.getDocument('products', String(product.id))
          if (latest) {
            const normalizedCat = normalizeCategory(latest.category)
            setFormData({ ...latest, category: normalizedCat })
            setShortDraft(String(latest.short_description || latest.description || ''))
            setLongDraft(String(latest.long_description || ''))
            return
          }
        } catch (_) {
          // fallback op meegegeven product-object
        }
        const normalizedCat = normalizeCategory((product as any).category)
        setFormData({ ...(product as any), category: normalizedCat })
        setShortDraft(String((product as any).short_description || (product as any).description || ''))
        setLongDraft(String((product as any).long_description || ''))
        return
      }

      // Nieuw product
      setFormData({
        name: '',
        description: '',
        price: 0,
        cost_price: 0,
        vat_category: 'standard',
        category: 'alloygator-set',
        sku: '',
        ean_code: '',
        stock_quantity: 0,
        min_stock: 0,
        weight: 0,
        dimensions: '',
        material: '',
        color: '',
        warranty: '',
        instructions: '',
        features: [],
        specifications: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setShortDraft('')
      setLongDraft('')
    }
    load()
  }, [product?.id, isOpen])

  // Load product attributes and colors
  useEffect(() => {
    const loadData = async () => {
      try {
        const [attributes, colors, supplierList] = await Promise.all([
          FirebaseService.getProductAttributes(),
          FirebaseService.getProductColors(),
          FirebaseService.getSuppliers()
        ])
        const attrs: any[] = Array.isArray(attributes) ? attributes : []
        setProductAttributes(attrs)
        setProductColors(Array.isArray(colors) ? colors : [])
        setSuppliers(Array.isArray(supplierList) ? supplierList : [])

        // Load existing dynamic values from product if editing
        if (product) {
          const dynamic: Record<string, any> = {}
          attrs.forEach((attr: any) => {
            const key = attr?.name
            if (!key) return
            const value = (product as any)[key]
            if (value !== undefined) dynamic[key] = value
          })
          setDynamicValues(dynamic)
        }
      } catch (error) {
        console.error('Error loading product data:', error)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && (shortDraft || formData.short_description || formData.description)) {
      const categorySlug = normalizeCategory(formData.category)
      const productData = {
  ...formData,
  ...dynamicValues,
  id: product?.id || `product_${Date.now()}`,
  price: Number(formData.price) || 0,
  cost_price: Number(formData.cost_price) || 0,
  stock_quantity: Number(formData.stock_quantity) || 0,
  min_stock: Number(formData.min_stock) || 0,
  weight: Number(formData.weight) || 0,
  features: Array.isArray(formData.features) ? formData.features : [],
  specifications: formData.specifications || {},
  created_at: formData.created_at ?? new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category: categorySlug,
  short_description: shortDraft || formData.short_description || formData.description || '',
  long_description: longDraft || formData.long_description || '',
} as Product
      
      onSave(productData)
      onClose()
    }
  }

  const handleFeaturesChange = (value: string) => {
    const features = value.split(',').map(f => f.trim()).filter(f => f.length > 0)
    setFormData(prev => ({ ...prev, features }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Product Bewerken' : product ? 'Product Bekijken' : 'Nieuw Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EAN Code
                </label>
                <input
                  type="text"
                  value={formData.ean_code || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ean_code: e.target.value }))}
                  disabled={!isEditing && !!product}
                  placeholder="13 cijfers"
                  pattern="[0-9]{13}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prijs (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kostprijs (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voorraad
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimale voorraad</label>
                <input
                  type="number"
                  value={formData.min_stock || ''}
                  onChange={(e)=> setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) || 0 }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorie
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="alloygator-set">AlloyGator Set</option>
                  <option value="accessoires">Accessoires</option>
                  <option value="montagehulpmiddelen">Montagehulpmiddelen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leverancier</label>
                <select
                  value={(formData as any).supplier_id || ''}
                  onChange={(e)=> setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">-- Selecteer leverancier --</option>
                  {suppliers.map((s:any)=> (
                    <option key={s.id || s.name} value={s.id || s.name}>{s.name || s.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BTW Categorie
                </label>
                <select
                  value={formData.vat_category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_category: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="standard">Standaard (hoog)</option>
                  <option value="reduced">Verlaagd (laag)</option>
                  <option value="zero">Nultarief</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Hoog = {`{`}settings.vatHighRate || 21{`}`}% • Laag = {`{`}settings.vatLowRate || 9{`}`}% • Nul = 0%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gewicht (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afmetingen
                </label>
                <input
                  type="text"
                  value={formData.dimensions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materiaal
                </label>
                <input
                  type="text"
                  value={formData.material || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kleur
                </label>
                <select
                  value={formData.color || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">-- Selecteer kleur --</option>
                  {productColors.map((color) => (
                    <option key={color.id} value={color.name}>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.hex_code }}
                        ></div>
                        {color.name}
                      </div>
                    </option>
                  ))}
                </select>
                {productColors.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Geen kleuren beschikbaar. Voeg kleuren toe in 
                    <a href="/admin/settings/colors" className="text-green-600 hover:underline ml-1">
                      Instellingen → Kleuren
                    </a>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Garantie
                </label>
                <input
                  type="text"
                  value={formData.warranty || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, warranty: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowMedia(true)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    Kies uit Media…
                  </button>
                </div>
                {formData.image_url && (
                  <div className="mt-3">
                    <img src={String(formData.image_url)} alt="preview" className="max-h-32 rounded border" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Korte omschrijving *</label>
              <TipTapEditor value={shortDraft} onChange={setShortDraft} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lange omschrijving</label>
              <TipTapEditor value={longDraft} onChange={setLongDraft} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructies
              </label>
              <textarea
                value={formData.instructions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                disabled={!isEditing && !!product}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features (komma gescheiden)
              </label>
              <input
                type="text"
                value={Array.isArray(formData.features) ? formData.features.join(', ') : ''}
                onChange={(e) => handleFeaturesChange(e.target.value)}
                disabled={!isEditing && !!product}
                placeholder="Feature 1, Feature 2, Feature 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Dynamic Attributes */}
            {productAttributes.length > 0 && (
              <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6 border-t pt-4">
                  🔧 Dynamische Attributen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productAttributes.map((attr: any) => (
                    <div key={attr.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.label} ({attr.type})
                      </label>
                      
                      {attr.type === 'text' && (
                        <input
                          type="text"
                          value={dynamicValues[attr.name] || ''}
                          onChange={(e) => setDynamicValues(prev => ({
                            ...prev,
                            [attr.name]: e.target.value
                          }))}
                          disabled={!isEditing && !!product}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      )}
                      
                      {attr.type === 'number' && (
                        <input
                          type="number"
                          step="0.01"
                          value={dynamicValues[attr.name] || ''}
                          onChange={(e) => setDynamicValues(prev => ({
                            ...prev,
                            [attr.name]: parseFloat(e.target.value) || 0
                          }))}
                          disabled={!isEditing && !!product}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />
                      )}
                      
                      {attr.type === 'boolean' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={dynamicValues[attr.name] || false}
                            onChange={(e) => setDynamicValues(prev => ({
                              ...prev,
                              [attr.name]: e.target.checked
                            }))}
                            disabled={!isEditing && !!product}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {dynamicValues[attr.name] ? 'Ja' : 'Nee'}
                          </span>
                        </div>
                      )}
                      
                      {attr.type === 'select' && (
                        <select
                          value={dynamicValues[attr.name] || ''}
                          onChange={(e) => setDynamicValues(prev => ({
                            ...prev,
                            [attr.name]: e.target.value
                          }))}
                          disabled={!isEditing && !!product}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        >
                          <option value="">-- Selecteer --</option>
                          {/* TODO: Add predefined options based on attribute configuration */}
                          <option value="optie1">Optie 1</option>
                          <option value="optie2">Optie 2</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isEditing || !product) && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {product ? 'Opslaan' : 'Aanmaken'}
                </button>
              </div>
            )}
          </form>
        </div>

        {product && !isEditing && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
      <MediaPickerModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        onSelect={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
      />
    </div>
  )
}
