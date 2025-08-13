'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  sku: string
  stock_quantity: number
  features: string[]
  image_url?: string
  reviews?: { rating: number; comment: string }[]
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  vat_category?: string
}

// Static product data (same as in winkel page)
const staticProducts: Product[] = [
  {
    id: '1',
    name: 'AlloyGator Complete Set 17"',
    description: 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen',
    price: 89.95,
    category: 'alloygator-set',
    sku: 'AG-17-SET',
    stock_quantity: 50,
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', 'Professionele kwaliteit'],
    reviews: [
      { rating: 5, comment: 'Perfecte kwaliteit en montagehulpmiddelen. Zeer tevreden!' },
      { rating: 4, comment: 'Goed product, maar de montagehulpmiddelen zijn niet zo groot als verwacht.' }
    ]
  },
  {
    id: '2',
    name: 'AlloyGator Complete Set 18"',
    description: 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen',
    price: 99.95,
    category: 'alloygator-set',
    sku: 'AG-18-SET',
    stock_quantity: 45,
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', 'Voor 18 inch velgen'],
    reviews: [
      { rating: 3, comment: 'Niet zo goed als verwacht. Montagehulpmiddelen zijn te klein.' },
      { rating: 5, comment: 'Perfecte kwaliteit en montagehulpmiddelen. Zeer tevreden!' }
    ]
  },
  {
    id: '3',
    name: 'Montage Tool Set',
    description: 'Professionele montagehulpmiddelen voor eenvoudige installatie van AlloyGator velgbescherming',
    price: 24.95,
    category: 'montagehulpmiddelen',
    sku: 'MT-TOOL-SET',
    stock_quantity: 100,
    features: ['Complete gereedschap', 'Professioneel', 'Duurzaam', 'Eenvoudig in gebruik'],
    reviews: [
      { rating: 4, comment: 'Goed gereedschap, maar de opbergdoos is wat klein.' }
    ]
  },
  {
    id: '4',
    name: 'Vervangingsonderdelen Set',
    description: 'Extra onderdelen voor onderhoud en reparatie van uw AlloyGator velgbescherming',
    price: 19.95,
    category: 'accessoires',
    sku: 'VR-ONDERDELEN',
    stock_quantity: 75,
    features: ['Onderdelen', 'Onderhoud', 'Reparatie', 'Originele kwaliteit'],
    reviews: [
      { rating: 2, comment: 'Niet zo goed als verwacht. Onderdelen zijn niet compatibel.' }
    ]
  }
]

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('alloygator-wishlist')
    if (savedWishlist) {
      const wishlistIds = JSON.parse(savedWishlist)
      setWishlist(wishlistIds)
      
      // Filter products that are in wishlist
      const products = staticProducts.filter(product => wishlistIds.includes(product.id))
      setWishlistProducts(products)
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    setLoading(false)
  }, [])

  const removeFromWishlist = (productId: string) => {
    const updatedWishlist = wishlist.filter(id => id !== productId)
    setWishlist(updatedWishlist)
    setWishlistProducts(prev => prev.filter(product => product.id !== productId))
    localStorage.setItem('alloygator-wishlist', JSON.stringify(updatedWishlist))
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      )
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image_url
      }
      const updatedCart = [...cart, newItem]
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    }
  }

  const moveAllToCart = () => {
    const updatedCart = [...cart]
    
    wishlistProducts.forEach(product => {
      const existingItem = updatedCart.find(item => item.id === product.id)
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        updatedCart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image_url
        })
      }
    })
    
    setCart(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    alert('Alle producten toegevoegd aan winkelwagen!')
  }

  const clearWishlist = () => {
    setWishlist([])
    setWishlistProducts([])
    localStorage.removeItem('alloygator-wishlist')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Wenslijst laden...</p>
        </div>
      </div>
    )
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💝</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Je wenslijst is leeg</h1>
            <p className="text-lg text-gray-600 mb-8">Je hebt nog geen producten toegevoegd aan je wenslijst.</p>
            <Link
              href="/winkel"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
            >
              Ga naar de winkel
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mijn Wenslijst</h1>
          <p className="text-gray-600">
            {wishlistProducts.length} product{wishlistProducts.length !== 1 ? 'en' : ''} in je wenslijst
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
            <button
              onClick={moveAllToCart}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Alles toevoegen aan winkelwagen
            </button>
            <button
              onClick={clearWishlist}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Wenslijst legen
            </button>
          </div>
          
          <Link
            href="/winkel"
            className="text-green-600 hover:text-green-700 transition-colors"
          >
            Verder winkelen →
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => {
            const priceWithVat = calculatePriceWithVat(product.price, 21)
            const vatText = getVatDisplayText(21, 'NL')
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/winkel/product/${product.id}`}>
                  <div className="h-48 bg-gray-200 flex items-center justify-center cursor-pointer">
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
                </Link>
                
                <div className="p-6">
                  <Link href={`/winkel/product/${product.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Reviews */}
                  {product.reviews && product.reviews.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const averageRating = product.reviews!.reduce((sum, review) => sum + review.rating, 0) / product.reviews!.length
                            return (
                              <svg
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )
                          })}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({product.reviews!.length} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        €{priceWithVat.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">{vatText}</span>
                    </div>
                    {product.stock_quantity > 0 ? (
                      <span className="text-green-600 text-sm font-medium">Op voorraad</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">Niet op voorraad</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {product.stock_quantity > 0 ? 'Toevoegen' : 'Niet beschikbaar'}
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wenslijst Samenvatting</h3>
              <p className="text-gray-600">
                {wishlistProducts.length} product{wishlistProducts.length !== 1 ? 'en' : ''} • 
                Totaalwaarde: €{wishlistProducts.reduce((sum, product) => sum + calculatePriceWithVat(product.price, 21), 0).toFixed(2)}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/cart"
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Bekijk winkelwagen ({cart.length})
              </Link>
              <button
                onClick={moveAllToCart}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Alles toevoegen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 