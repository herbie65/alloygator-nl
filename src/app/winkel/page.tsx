'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'
import { FirebaseClientService } from '@/lib/firebase-client'

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

export default function WinkelPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [vatSettings, setVatSettings] = useState<VatSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products and VAT settings from Firebase
        const [productsData, vatSettingsData] = await Promise.all([
          FirebaseClientService.getProducts(),
          FirebaseClientService.getVatSettings()
        ])

        setProducts(productsData as Product[])
        setVatSettings(vatSettingsData as VatSettings[])
        
        // Load cart from localStorage
        const savedCart = localStorage.getItem('alloygator-cart')
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    let newCart: CartItem[]
    
    if (existingItem) {
      newCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      newCart = [...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image_url,
        vat_category: product.vat_category
      }]
    }
    
    setCart(newCart)
    // Save to localStorage
    localStorage.setItem('alloygator-cart', JSON.stringify(newCart))
  }

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.id !== productId)
    setCart(newCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(newCart))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      const newCart = cart.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      )
      setCart(newCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(newCart))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-lg text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Winkel</h1>
            <p className="text-gray-600 mt-2">Ontdek onze AlloyGator producten</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/cart"
              className="relative bg-white p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(products || []).map((product) => {
            const vatRate = vatSettings.find(v => v.vat_category === product.vat_category)?.vat_rate || 21
            const priceWithVat = calculatePriceWithVat(product.price, vatRate)
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <div className="aspect-w-1 aspect-h-1 w-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">€{priceWithVat.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{getVatDisplayText(vatRate)}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.sku}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Voorraad: {product.stock_quantity}
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Toevoegen aan winkelwagen
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Geen producten gevonden</p>
          </div>
        )}
      </div>
    </div>
  )
} 