export interface Product {
  id: string
  sku: string
  name: string            // ← kies: verplicht (of maak 'm overal optional)
  title?: string
  description?: string
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
  created_at: string
  updated_at: string
}