'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import dynamic from 'next/dynamic'
import MediaPickerModal from '../components/MediaPickerModal'
import type { Product } from '@/types/product'

// TipTapEditor als stabiele module-scope component
const TipTapEditor = dynamic(() => import('../cms/TipTapEditor'), { 
  ssr: false,
  loading: () => <div className="p-4 text-gray-500">Editor laden...</div>
})

interface ProductModalProps {
  product?: Partial<Product> | null;   // <-- nu optioneel & partial
  isEditing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Product) => void | Promise<void>;
}

export default function ProductModal({ product, isEditing, isOpen, onClose, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product & { min_stock?: number }>>({})
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [productColors, setProductColors] = useState<any[]>([])
  const [showMedia, setShowMedia] = useState(false)
  
  // Lokale conceptvelden voor WYSIWYG zodat er niets buiten deze modal wordt geüpdatet tijdens typen
  const [shortDraft, setShortDraft] = useState<string>('')
  const [longDraft, setLongDraft] = useState<string>('')
  const [existingSlugs, setExistingSlugs] = useState<string[]>([])
  const [slugEdited, setSlugEdited] = useState<boolean>(false)

  const normalizeCategory = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, '-')
  const categoryLabelFromSlug = (slug: string) => {
    switch (slug) {
      case 'alloygator-set': return 'AlloyGator Set'
      case 'montagehulpmiddelen': return 'Montagehulpmiddelen'
      case 'accessoires': return 'Accessoires'
      default: return slug || 'Algemeen'
    }
  }
  const slugify = (text: string) =>
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  const uniqueSlug = (base: string, currentId?: string) => {
    let s = slugify(base)
    if (!s) return ''
    let candidate = s
    let i = 2
    while (existingSlugs.includes(candidate)) {
      // als je aan het editen bent met dezelfde slug/id, laat het staan
      if (currentId && candidate === (formData as any).slug && currentId === (formData as any).id) break
      candidate = `${s}-${i++}`
    }
    return candidate
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }
    
    const load = async () => {
      // Als we een product-ID hebben: vers, direct uit de database ophalen
      if (product?.id) {
        try {
          const latest: any = await FirebaseService.getDocument('products', String(product.id))
          if (latest) {
            const normalizedCat = normalizeCategory(latest.category)
            const currentSlug = latest.slug || uniqueSlug(latest.name || latest.title || 'product', latest.id)
            setFormData({ ...latest, category: normalizedCat, slug: currentSlug })
            setShortDraft(String(latest.short_description || latest.description || ''))
            setLongDraft(String(latest.long_description || ''))
            return
          }
        } catch (_) {
          // fallback op meegegeven product-object
        }
        const normalizedCat = normalizeCategory((product as any).category)
        const currentSlug = (product as any).slug || uniqueSlug((product as any).name || (product as any).title || 'product', (product as any).id)
        setFormData({ ...(product as any), category: normalizedCat, slug: currentSlug })
        setShortDraft(String((product as any).short_description || (product as any).description || ''))
        setLongDraft(String((product as any).long_description || (product as any).description || ''))
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
        slug: '',
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

  // Auto-slug uit naam wanneer niet handmatig aangepast
  useEffect(() => {
    if (!isOpen) return
    if (slugEdited) return
    const base = String(formData.name || '')
    if (!base) return
    const s = uniqueSlug(base, (formData as any).id)
    setFormData(prev => ({ ...prev, slug: s }))
  }, [formData.name, slugEdited, isOpen])

  // Load suppliers
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading supplier data...');
        
        const supplierList = await FirebaseService.getSuppliers()
        
        console.log('📊 Loaded suppliers:', {
          suppliers: Array.isArray(supplierList) ? supplierList.length : 'not array'
        });
        
        setSuppliers(Array.isArray(supplierList) ? supplierList : [])

        try {
          const all = await FirebaseService.getDocuments('products')
          const slugs = (Array.isArray(all) ? all : []).map((p: any) => String(p.slug || '').toLowerCase()).filter(Boolean)
          setExistingSlugs(slugs)
        } catch {}
      } catch (error) {
        console.error('❌ Error loading supplier data:', error)
      }
    }
    
    if (isOpen) {
      loadData()
    }
  }, [isOpen, product])

  // Load product colors from database (product_colors)
  useEffect(() => {
    const loadColors = async () => {
      try {
        const colors = await FirebaseService.getDocuments('product_colors')
        setProductColors(Array.isArray(colors) ? colors : [])
      } catch (_) {
        setProductColors([])
      }
    }
    if (isOpen) loadColors()
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name) { // Remove the description requirement
      const categorySlug = normalizeCategory(formData.category)
      
      const productData = {
        ...formData,
        sku: formData.sku,
        cost_price: Number(formData.cost_price) || 0,
        stock_quantity: Number(formData.stock_quantity) || 0,
        min_stock: Number(formData.min_stock) || 0,
        ean_code: formData.ean_code,
        weight: Number(formData.weight) || 0,
        dimensions: formData.dimensions,
        material: formData.material,
        color: formData.color,
        warranty: formData.warranty,
        instructions: formData.instructions,
        supplier_id: formData.supplier_id,
        // Laat id leeg bij nieuw product zodat backend een numerieke id toewijst
        id: product?.id, 
        price: Number(formData.price) || 0,
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
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stock: parseInt(e.target.value) }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
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
                  placeholder="bijv. 100x50x25 cm"
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
                  Kleur {(!productColors || productColors.length === 0) && (
                    <span title="Geen kleuren in database gevonden" className="text-orange-500 ml-1">❗</span>
                  )}
                </label>
                {/* DB dropdown (additief) */}
                <select
                  value={formData.color || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">— Kies kleur (database) —</option>
                  {productColors.map((c: any) => (
                    <option key={c.id} value={c.name || c.id}>{c.name || c.id}</option>
                  ))}
                </select>
                {/* Vrije invoer blijft beschikbaar (niet verwijderen) */}
                <input
                  type="text"
                  value={formData.color || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  disabled={!isEditing && !!product}
                  placeholder="of typ handmatig een kleur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
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
                  placeholder="bijv. 2 jaar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructies
                </label>
                <input
                  type="text"
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  disabled={!isEditing && !!product}
                  placeholder="bijv. Inclusief montagehandleiding"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leverancier
                </label>
                <select
                  value={formData.supplier_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                >
                  <option value="">Geen leverancier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
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
                  <option value="montagehulpmiddelen">Montagehulpmiddelen</option>
                  <option value="accessoires">Accessoires</option>
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
                  <option value="standard">Standaard (21%)</option>
                  <option value="reduced">Verlaagd (9%)</option>
                  <option value="zero">Nul (0%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, slug: e.target.value }))
                    setSlugEdited(true)
                  }}
                  disabled={!isEditing && !!product}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Korte beschrijving
              </label>
              <TipTapEditor
                value={shortDraft}
                onChange={setShortDraft}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lange beschrijving
              </label>
              <TipTapEditor
                value={longDraft}
                onChange={setLongDraft}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kenmerken (komma-gescheiden)
              </label>
              <input
                type="text"
                value={Array.isArray(formData.features) ? formData.features.join(', ') : ''}
                onChange={(e) => handleFeaturesChange(e.target.value)}
                disabled={!isEditing && !!product}
                placeholder="bijv. Complete set, Montagehulpmiddelen, Handleiding"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Afbeelding URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  disabled={!isEditing && !!product}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowMedia(true)}
                  disabled={!isEditing && !!product}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Media
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Annuleren
              </button>
              {isEditing && (
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Opslaan
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showMedia && (
        <MediaPickerModal
          isOpen={showMedia}
          onClose={() => setShowMedia(false)}
          onSelect={(url) => {
            setFormData(prev => ({ ...prev, image_url: url }))
            setShowMedia(false)
          }}
        />
      )}
    </div>
  )
}
