'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import dynamic from 'next/dynamic'
// TipTapEditor als stabiele module-scope component, zodat hij NIET remount bij elke toetsaanslag
const TipTapEditor = dynamic(() => import('../cms/TipTapEditor'), { ssr: false })
import MediaPickerModal from '../components/MediaPickerModal'
import type { Product, ProductVariant } from '@/types/product'

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
  
  // Configurable product state
  const [isConfigurable, setIsConfigurable] = useState(false)
  const [baseSku, setBaseSku] = useState('')
  const [selectedAttributeSet, setSelectedAttributeSet] = useState('')
  const [configurableAttributes, setConfigurableAttributes] = useState<string[]>([])
  const [linkedVariants, setLinkedVariants] = useState<string[]>([])
  const [attributeSets, setAttributeSets] = useState<any[]>([])
  const [variants, setVariants] = useState<any[]>([])
  
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
      // Reset configurable product state when modal closes
      setIsConfigurable(false)
      setBaseSku('')
      setSelectedAttributeSet('')
      setConfigurableAttributes([])
      setLinkedVariants([])
      setAttributeSets([])
      setVariants([])
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
            
            // Load configurable product data
            if (latest.is_configurable) {
              setIsConfigurable(true)
              setBaseSku(latest.base_sku || '')
              setSelectedAttributeSet(latest.configurable_attribute_set || '')
              setConfigurableAttributes(latest.configurable_attributes?.map((attr: any) => attr.id) || [])
              
              // Load variants
              try {
                const variantsData = await FirebaseService.getProductVariants(latest.id)
                setVariants(variantsData || [])
              } catch (error) {
                console.error('Error loading variants:', error)
                setVariants([])
              }
            }
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
        
        // Load configurable product data from product object
        if ((product as any).is_configurable) {
          setIsConfigurable(true)
          setBaseSku((product as any).base_sku || '')
          setSelectedAttributeSet((product as any).configurable_attribute_set || '')
          setConfigurableAttributes((product as any).configurable_attributes?.map((attr: any) => attr.id) || [])
        }
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

  // Load product colors and attributes
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading product data...');
        
        const [attributes, colors, supplierList] = await Promise.all([
          FirebaseService.getProductAttributes(),
          FirebaseService.getProductColors(),
          FirebaseService.getSuppliers()
        ])
        
        console.log('📊 Loaded data:', {
          attributes: Array.isArray(attributes) ? attributes.length : 'not array',
          colors: Array.isArray(colors) ? colors.length : 'not array',
          suppliers: Array.isArray(supplierList) ? supplierList.length : 'not array'
        });
        
        const attrs: any[] = Array.isArray(attributes) ? attributes : []
        setProductAttributes(attrs)
        setProductColors(Array.isArray(colors) ? colors : [])
        setSuppliers(Array.isArray(supplierList) ? supplierList : [])

        // If no colors exist, create some default ones
        if (!Array.isArray(colors) || colors.length === 0) {
          console.log('🎨 No colors found, creating default colors...');
          await createDefaultColors();
        } else {
          console.log('✅ Colors already exist:', colors.length);
        }

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

        try {
          const all = await FirebaseService.getDocuments('products')
          const slugs = (Array.isArray(all) ? all : []).map((p: any) => String(p.slug || '').toLowerCase()).filter(Boolean)
          setExistingSlugs(slugs)
        } catch {}
      } catch (error) {
        console.error('❌ Error loading product data:', error)
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, product])

  // Load attribute sets and variants when modal opens
  useEffect(() => {
    const loadConfigurableData = async () => {
      if (isOpen) {
        try {
          const [setsData, variantsData] = await Promise.all([
            FirebaseService.getAttributeSets(),
            FirebaseService.getProductVariants('')
          ])
          setAttributeSets(setsData || [])
          setVariants(variantsData || [])
        } catch (error) {
          console.error('Error loading configurable data:', error)
        }
      }
    }
    
    loadConfigurableData()
  }, [isOpen])

  // Update configurable attributes when attribute set changes
  useEffect(() => {
    if (selectedAttributeSet) {
      const set = attributeSets.find(s => s.id === selectedAttributeSet)
      if (set) {
        setConfigurableAttributes(set.attributes || [])
      }
    } else {
      setConfigurableAttributes([])
    }
  }, [selectedAttributeSet, attributeSets])

  // Create default colors if none exist
  const createDefaultColors = async () => {
    try {
      console.log('🎨 Starting to create default colors...');
      
      const defaultColors = [
        { name: 'Rood', hex_code: '#FF0000' },
        { name: 'Blauw', hex_code: '#0000FF' },
        { name: 'Groen', hex_code: '#00FF00' },
        { name: 'Geel', hex_code: '#FFFF00' },
        { name: 'Zwart', hex_code: '#000000' },
        { name: 'Wit', hex_code: '#FFFFFF' },
        { name: 'Grijs', hex_code: '#808080' },
        { name: 'Oranje', hex_code: '#FFA500' },
        { name: 'Paars', hex_code: '#800080' },
        { name: 'Bruin', hex_code: '#A52A2A' }
      ];
      
      console.log('📝 Creating colors:', defaultColors.length);
      
      for (const color of defaultColors) {
        console.log('➕ Creating color:', color.name);
        const result = await FirebaseService.createProductColor(color);
        console.log('✅ Color created:', result);
      }
      
      console.log('🔄 Reloading colors after creation...');
      
      // Reload colors after creating defaults
      const colors = await FirebaseService.getProductColors();
      console.log('📊 Reloaded colors:', colors);
      
      setProductColors(Array.isArray(colors) ? colors : []);
      
      console.log('🎉 Default colors created successfully');
    } catch (error) {
      console.error('❌ Error creating default colors:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && (shortDraft || formData.short_description || formData.description)) {
      const categorySlug = normalizeCategory(formData.category)
      
      // Prepare configurable product data
      const configurableData = isConfigurable ? {
        is_configurable: true,
        base_sku: baseSku,
        configurable_attribute_set: selectedAttributeSet,
        configurable_attributes: configurableAttributes.map(attrId => 
          productAttributes.find(attr => attr.id === attrId)
        ).filter(Boolean)
      } : {}
      
      // For configurable products, remove physical product fields
      const physicalProductFields = isConfigurable ? {} : {
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
        supplier_id: formData.supplier_id
      }
      
      const productData = {
        ...formData,
        ...dynamicValues,
        ...configurableData,
        ...physicalProductFields,
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

              {!isConfigurable && (
                <>
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
                </>
              )}

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

              {!isConfigurable && (
                <>
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
                </>
              )}

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

                {/* Configurable Product Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configurable Product Instellingen</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isConfigurable"
                        checked={isConfigurable}
                        onChange={(e) => setIsConfigurable(e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isConfigurable" className="ml-2 block text-sm font-medium text-gray-700">
                        Dit product is configureerbaar
                      </label>
                    </div>

                    {isConfigurable && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Basis SKU
                          </label>
                          <input
                            type="text"
                            value={baseSku}
                            onChange={(e) => setBaseSku(e.target.value)}
                            placeholder="bijv. TSHIRT-BASE"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Basis SKU voor het configurable product (zonder varianten)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Attribuutset
                          </label>
                          <select
                            value={selectedAttributeSet}
                            onChange={(e) => setSelectedAttributeSet(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">-- Selecteer attribuutset --</option>
                            {attributeSets.map((set) => (
                              <option key={set.id} value={set.id}>
                                {set.name} ({set.attributes?.length || 0} attributen)
                              </option>
                            ))}
                          </select>
                          {attributeSets.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Geen attribuutsets beschikbaar. Maak eerst een attribuutset aan in 
                              <a href="/admin/attributes/attribute-sets" className="text-green-600 hover:underline ml-1">
                                Attributen → Attribuutsets
                              </a>
                            </p>
                          )}
                        </div>

                        {configurableAttributes.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Configureerbare Attributen
                            </label>
                            <div className="space-y-2">
                              {configurableAttributes.map((attrId) => {
                                const attribute = productAttributes.find(attr => attr.id === attrId)
                                return attribute ? (
                                  <div key={attrId} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={true}
                                      disabled
                                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                      {attribute.label} ({attribute.type})
                                    </span>
                                  </div>
                                ) : null
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Deze attributen zijn automatisch geselecteerd op basis van de gekozen attribuutset
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gekoppelde Varianten
                          </label>
                          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                            {variants
                              .filter(v => v.parent_product_id === product?.id)
                              .map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">
                                    {variant.name} - €{variant.price}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {variant.color && `${variant.color}`}
                                    {variant.size && ` ${variant.size}`}
                                  </span>
                                </div>
                              ))}
                            {variants.filter(v => v.parent_product_id === product?.id).length === 0 && (
                              <p className="text-sm text-gray-500">
                                Geen varianten gekoppeld. Maak varianten aan in 
                                <a href="/admin/products/product-variants" className="text-green-600 hover:underline ml-1">
                                  Product Varianten
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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

              {!isConfigurable && (
                <>
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
                </>
              )}

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
              <TipTapEditor 
                value={shortDraft} 
                onChange={(value) => {
                  console.log('Short description changed:', value)
                  setShortDraft(value)
                }} 
              />
              <p className="text-xs text-gray-500 mt-1">Gebruik de toolbar bovenaan om tekst op te maken</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lange omschrijving</label>
              <TipTapEditor 
                value={longDraft} 
                onChange={(value) => {
                  console.log('Long description changed:', value)
                  setLongDraft(value)
                }} 
              />
              <p className="text-xs text-gray-500 mt-1">Gebruik de toolbar bovenaan om tekst op te maken</p>
            </div>

            {!isConfigurable && (
              <>
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
              </>
            )}

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

            {/* Variant Management for Configurable Products */}
            {isConfigurable && isEditing && (
              <div className="col-span-2 border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    🎨 Product Varianten
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      // setEditingVariant({
                      //   name: '',
                      //   sku: '',
                      //   ean_code: '',
                      //   price: 0,
                      //   stock_quantity: 0,
                      //   min_stock: 0,
                      //   color: '',
                      //   active: true
                      // });
                      // setShowVariantModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    + Variant Toevoegen
                  </button>
                </div>
                
                {variants.length > 0 ? (
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{variant.name}</h4>
                                <p className="text-sm text-gray-600">SKU: {variant.sku} • EAN: {variant.ean_code}</p>
                                <p className="text-sm text-gray-600">
                                  Prijs: €{variant.price} • Voorraad: {variant.stock_quantity} • Min: {variant.min_stock}
                                  {variant.color && ` • Kleur: ${variant.color}`}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // setEditingVariant(variant)
                                    // setShowVariantModal(true)
                                  }}
                                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Bewerken
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Weet je zeker dat je deze variant wilt verwijderen?')) {
                                      try {
                                        await FirebaseService.deleteProductVariant(variant.id);
                                        setVariants(prev => prev.filter(v => v.id !== variant.id));
                                      } catch (error) {
                                        console.error('Error deleting variant:', error);
                                        alert('Fout bij verwijderen van variant: ' + error.message);
                                      }
                                    }
                                  }}
                                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Verwijderen
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nog geen varianten toegevoegd.</p>
                    <p className="text-sm mt-1">Klik op "Variant Toevoegen" om de eerste variant te maken.</p>
                  </div>
                )}
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Over Configurable Products</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Het hoofdproduct is een container voor alle varianten</li>
                    <li>• Elke variant heeft eigen SKU, EAN, voorraad en prijs</li>
                    <li>• Varianten worden verkocht in plaats van het hoofdproduct</li>
                    <li>• Het hoofdproduct heeft geen eigen voorraad of EAN</li>
                  </ul>
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
      
      {/* Variant Modal */}
      {/* {showVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVariant?.id ? 'Variant Bewerken' : 'Nieuwe Variant'}
              </h2>
              <button
                onClick={() => {
                  setShowVariantModal(false)
                  setEditingVariant(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam *
                    </label>
                    <input
                      type="text"
                      value={editingVariant?.name || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={editingVariant?.sku || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EAN Code *
                    </label>
                    <input
                      type="text"
                      value={editingVariant?.ean_code || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, ean_code: e.target.value }))}
                      placeholder="13 cijfers"
                      pattern="[0-9]{13}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prijs (€) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingVariant?.price || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voorraad *
                    </label>
                    <input
                      type="number"
                      value={editingVariant?.stock_quantity || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimale voorraad *
                    </label>
                    <input
                      type="number"
                      value={editingVariant?.min_stock || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, min_stock: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kleur
                    </label>
                    <select
                      value={editingVariant?.color || ''}
                      onChange={(e) => setEditingVariant(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Selecteer kleur --</option>
                      {productColors.map((color) => (
                        <option key={color.id} value={color.name}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                    {productColors.length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Geen kleuren beschikbaar. Voeg kleuren toe in 
                        <a href="/admin/settings/colors" className="text-green-600 hover:underline ml-1">
                          Instellingen → Kleuren
                        </a>
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Debug: {productColors.length} kleuren geladen
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantModal(false)
                      setEditingVariant(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (editingVariant?.id) {
                          // Update existing variant
                          await FirebaseService.updateProductVariant(editingVariant.id, {
                            ...editingVariant,
                            parent_product_id: product?.id
                          });
                          
                          // Update local variants state
                          setVariants(prev => prev.map(v => 
                            v.id === editingVariant.id ? { ...v, ...editingVariant } as ProductVariant : v
                          ));
                        } else {
                          // Create new variant
                          const newVariant = await FirebaseService.addProductVariant({
                            ...editingVariant,
                            parent_product_id: product?.id,
                            active: true
                          });
                          
                          // Add to local variants state
                          setVariants(prev => [...prev, newVariant]);
                        }
                        
                        setShowVariantModal(false)
                        setEditingVariant(null)
                      } catch (error) {
                        console.error('Error saving variant:', error)
                        alert('Fout bij opslaan van variant: ' + error.message)
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingVariant?.id ? 'Opslaan' : 'Aanmaken'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  )
}
