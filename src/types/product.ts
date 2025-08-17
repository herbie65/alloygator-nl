export interface Product {
  id: string
  name: string
  title?: string
  slug?: string
  description?: string
  short_description?: string
  long_description?: string
  
  // Basis product eigenschappen (altijd beschikbaar)
  price: number
  category?: string
  vat_category?: string
  image_url?: string
  active?: boolean
  
  // Configurable product eigenschappen
  is_configurable?: boolean
  base_sku?: string
  configurable_attributes?: ProductAttribute[]
  
  // Fysieke product eigenschappen (alleen voor niet-configurable products)
  sku?: string
  cost_price?: number
  stock_quantity?: number
  min_stock?: number
  ean_code?: string
  weight?: number
  dimensions?: string
  material?: string
  color?: string
  warranty?: string
  instructions?: string
  features?: string[]
  specifications?: Record<string, any> | string
  supplier_id?: string
  
  // SEO metadata (optioneel)
  meta_title?: string
  meta_description?: string
  meta_image_url?: string
  created_at?: string
  updated_at?: string
}

// Product variant (child product)
export interface ProductVariant {
  id: string
  parent_product_id: string  // Verplicht - verwijst naar het configurable product
  
  // Fysieke product eigenschappen (verplicht voor varianten)
  sku: string
  name: string
  ean_code: string
  price: number
  stock_quantity: number
  min_stock: number
  image_url?: string
  
  // Variant-specifieke eigenschappen
  color?: string  // Kleur van deze variant
  attribute_values: ProductAttributeValue[]
  price_adjustment?: number  // Extra kosten voor deze variant
  weight_adjustment?: number
  active?: boolean
  
  // Timestamps
  created_at?: string
  updated_at?: string
}

// Product attribuut definitie
export interface ProductAttribute {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'size'
  required: boolean
  options?: string[]  // Voor select en color types
  default_value?: string | number | boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Product attribuut waarde (voor een specifieke variant)
export interface ProductAttributeValue {
  attribute_id: string
  value: string | number | boolean
  price_adjustment?: number  // Extra kosten voor deze waarde
  stock_quantity?: number
  is_active: boolean
}

// Configurable product (uitgebreide interface)
export interface ConfigurableProduct extends Product {
  is_configurable: true
  base_sku: string
  variants: ProductVariant[]
  configurable_attributes: ProductAttribute[]
}