'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'

interface Product {
  id: string
  name: string
  description: string
  price: number
  vat_category: string
  category: string
  image_url?: string
  sku: string
  stock_quantity: number
  weight: number
  dimensions: string
  material: string
  color: string
  warranty: string
  instructions: string
  features: string[]
  specifications: Record<string, any>
  created_at: string
  updated_at: string
}

interface VatSettings {
  id: string
  country: string
  vat_rate: number
  customer_type: string
  vat_category: string
  created_at: string
  updated_at: string
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  vat_category?: string
}

// Static product data
const staticProducts: Product[] = [
  {
    id: '1',
    name: 'AlloyGator Complete Set 17"',
    description: 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen',
    price: 89.95,
    vat_category: 'standard',
    category: 'alloygator-set',
    sku: 'AG-17-SET',
    stock_quantity: 50,
    weight: 2.5,
    dimensions: '17 inch',
    material: 'Kunststof',
    color: 'Zwart',
    warranty: '2 jaar',
    instructions: 'Inclusief montagehandleiding',
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding'],
    specifications: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    name: 'AlloyGator Complete Set 18"',
    description: 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen',
    price: 99.95,
    vat_category: 'standard',
    category: 'alloygator-set',
    sku: 'AG-18-SET',
    stock_quantity: 45,
    weight: 2.8,
    dimensions: '18 inch',
    material: 'Kunststof',
    color: 'Zwart',
    warranty: '2 jaar',
    instructions: 'Inclusief montagehandleiding',
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding'],
    specifications: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    name: 'Montage Tool Set',
    description: 'Professionele montagehulpmiddelen voor eenvoudige installatie',
    price: 24.95,
    vat_category: 'standard',
    category: 'montagehulpmiddelen',
    sku: 'MT-TOOL-SET',
    stock_quantity: 100,
    weight: 0.5,
    dimensions: 'Toolbox',
    material: 'Staal',
    color: 'Zilver',
    warranty: '1 jaar',
    instructions: 'Professionele gereedschappen',
    features: ['Complete gereedschap', 'Professioneel', 'Duurzaam'],
    specifications: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    name: 'Vervangingsonderdelen Set',
    description: 'Extra onderdelen voor onderhoud en reparatie',
    price: 19.95,
    vat_category: 'standard',
    category: 'accessoires',
    sku: 'VR-ONDERDELEN',
    stock_quantity: 75,
    weight: 0.3,
    dimensions: 'Klein',
    material: 'Kunststof',
    color: 'Zwart',
    warranty: '1 jaar',
    instructions: 'Vervangingsonderdelen',
    features: ['Onderdelen', 'Onderhoud', 'Reparatie'],
    specifications: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

// Static VAT settings
const staticVatSettings: VatSettings[] = [
  {
    id: '1',
    country: 'Nederland',
    vat_rate: 21,
    customer_type: 'consumer',
    vat_category: 'standard',
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
]

export default function WinkelPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [vatSettings, setVatSettings] = useState<VatSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Use static data
    setProducts(staticProducts)
    setVatSettings(staticVatSettings)
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    
    setLoading(false)
  }, [])

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image_url,
        vat_category: product.vat_category
      }
      const updatedCart = [...cart, newItem]
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    }
  }

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.id !== productId)
    setCart(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    const updatedCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'alloygator-set': return 'AlloyGator Sets'
      case 'montagehulpmiddelen': return 'Montagehulpmiddelen'
      case 'accessoires': return 'Accessoires'
      default: return category
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Producten laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AlloyGator Winkel</h1>
          <p className="text-lg text-gray-600">
            Professionele velgbescherming en montagehulpmiddelen
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek producten
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek op naam of beschrijving..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">Alle categorieën</option>
                <option value="alloygator-set">AlloyGator Sets</option>
                <option value="montagehulpmiddelen">Montagehulpmiddelen</option>
                <option value="accessoires">Accessoires</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sorteren op
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="name">Naam A-Z</option>
                <option value="price-low">Prijs: Laag naar Hoog</option>
                <option value="price-high">Prijs: Hoog naar Laag</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 'en' : ''} gevonden
            {searchTerm && ` voor "${searchTerm}"`}
            {selectedCategory !== 'all' && ` in ${getCategoryDisplayName(selectedCategory)}`}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const priceWithVat = calculatePriceWithVat(product.price, 21) // 21% VAT for Netherlands
            const vatText = getVatDisplayText(21, 'NL')
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-4xl">🛞</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Features */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {product.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          €{priceWithVat.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">{vatText}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </div>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mb-4">
                    {product.stock_quantity > 0 ? (
                      <span className="text-green-600 text-sm font-medium">
                        ✓ Op voorraad ({product.stock_quantity})
                      </span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">
                        ✗ Niet op voorraad
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity === 0}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {product.stock_quantity > 0 ? 'Toevoegen aan winkelwagen' : 'Niet beschikbaar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen producten gevonden</h3>
            <p className="text-gray-600">
              Probeer andere zoektermen of filters aan te passen.
            </p>
          </div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm text-gray-600">Winkelwagen</p>
                <p className="font-semibold">{getCartCount()} items - €{getCartTotal().toFixed(2)}</p>
              </div>
              <Link
                href="/cart"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Bekijk winkelwagen
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 