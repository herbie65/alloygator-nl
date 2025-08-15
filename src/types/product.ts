export interface Product {
  id: string
  sku: string
  name: string            // ← kies: verplicht (of maak 'm overal optional)
  title?: string
  slug?: string
  description?: string
  short_description?: string
  long_description?: string
  price: number
  cost_price?: number
  stock_quantity?: number
  min_stock?: number
  ean_code?: string
  weight?: number
  category?: string
  vat_category?: string
  image_url?: string
  dimensions?: string
  material?: string
  color?: string
  warranty?: string
  instructions?: string
  features?: string[]     // of string
  specifications?: Record<string, any> | string
  // SEO metadata (optioneel)
  meta_title?: string
  meta_description?: string
  meta_image_url?: string
  created_at: string
  updated_at: string
}