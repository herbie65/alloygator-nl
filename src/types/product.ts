export interface Product {
  id: string
  name: string
  title?: string
  slug?: string
  description?: string
  short_description?: string
  long_description?: string
  
  // Basis product eigenschappen
  price: number
  category?: string
  vat_category?: string
  image_url?: string
  image?: string // Backward compatibility with existing database
  active?: boolean
  
  // Fysieke product eigenschappen
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
