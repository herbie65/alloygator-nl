'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'

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
  reviews?: { rating: number; comment: string; author: string; date: string }[]
}

// Static product data (in real app, this would come from Firebase)
const staticProducts: Product[] = [
  {
    id: '1',
    name: 'AlloyGator Complete Set 17"',
    description: 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen. Professionele velgbescherming tegen stoeprandschade.',
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
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', '2 jaar garantie'],
    specifications: {
      'Velgmaat': '17 inch',
      'Materiaal': 'Kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '2.5 kg',
      'Garantie': '2 jaar'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      { rating: 5, comment: 'Uitstekende kwaliteit, makkelijk te monteren!', author: 'Jan S.', date: '2024-01-15' },
      { rating: 4, comment: 'Goede bescherming, aanrader.', author: 'Piet M.', date: '2024-01-10' }
    ]
  },
  {
    id: '2',
    name: 'AlloyGator Complete Set 18"',
    description: 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen. Professionele velgbescherming tegen stoeprandschade.',
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
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', '2 jaar garantie'],
    specifications: {
      'Velgmaat': '18 inch',
      'Materiaal': 'Kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '2.8 kg',
      'Garantie': '2 jaar'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      { rating: 5, comment: 'Perfecte pasvorm voor mijn 18 inch velgen!', author: 'Mark V.', date: '2024-01-20' }
    ]
  },
  {
    id: '3',
    name: 'Montage Tool Set',
    description: 'Professionele montagehulpmiddelen voor eenvoudige installatie van AlloyGator velgbescherming.',
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
    features: ['Complete gereedschap', 'Professioneel', 'Duurzaam', '1 jaar garantie'],
    specifications: {
      'Inhoud': 'Complete gereedschap set',
      'Materiaal': 'Staal',
      'Kleur': 'Zilver',
      'Gewicht': '0.5 kg',
      'Garantie': '1 jaar'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      { rating: 4, comment: 'Goede kwaliteit gereedschap', author: 'Tom B.', date: '2024-01-12' }
    ]
  },
  {
    id: '4',
    name: 'Vervangingsonderdelen Set',
    description: 'Extra onderdelen voor onderhoud en reparatie van AlloyGator velgbescherming.',
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
    features: ['Onderdelen', 'Onderhoud', 'Reparatie', '1 jaar garantie'],
    specifications: {
      'Inhoud': 'Vervangingsonderdelen',
      'Materiaal': 'Kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '0.3 kg',
      'Garantie': '1 jaar'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      { rating: 5, comment: 'Handig voor onderhoud', author: 'Lisa K.', date: '2024-01-08' }
    ]
  }
]

export default function ProductDetailPage() {
  const dealer = useDealerPricing()
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    // Find product by ID
    const foundProduct = staticProducts.find(p => p.id === productId)
    if (foundProduct) {
      setProduct(foundProduct)
    } else {
      router.push('/winkel')
    }
    setLoading(false)
  }, [productId, router])

  const addToCart = () => {
    if (!product) return

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image_url,
      vat_category: product.vat_category,
      sku: product.sku,
      category: (product as any).category
    }

    const existingCart = JSON.parse(localStorage.getItem('alloygator-cart') || '[]')
    const existingItem = existingCart.find((item: any) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      existingCart.push(cartItem)
    }

    localStorage.setItem('alloygator-cart', JSON.stringify(existingCart))
    alert('Product toegevoegd aan winkelwagen!')
  }

  const getAverageRating = () => {
    if (!product?.reviews || product.reviews.length === 0) return 0
    return product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Product laden...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product niet gevonden</h1>
          <Link href="/winkel" className="text-green-600 hover:text-green-700">
            Terug naar winkel
          </Link>
        </div>
      </div>
    )
  }

  const base = dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : product.price
  const displayPrice = dealer.isDealer ? base : calculatePriceWithVat(base, 21)
  const vatText = getVatDisplayText(21, 'NL')
  const averageRating = getAverageRating()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/winkel" className="hover:text-green-600">Winkel</Link></li>
            <li>/</li>
            <li><Link href={`/winkel?category=${product.category}`} className="hover:text-green-600">
              {product.category === 'alloygator-set' ? 'AlloyGator Sets' : 
               product.category === 'montagehulpmiddelen' ? 'Montagehulpmiddelen' : 'Accessoires'}
            </Link></li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="aspect-w-1 aspect-h-1 w-full">
                <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 text-8xl">🛞</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {/* Reviews */}
              {product.reviews && product.reviews.length > 0 && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= averageRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({product.reviews.length} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900">
                    €{displayPrice.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500">{dealer.isDealer ? 'excl. BTW' : vatText}</span>
                </div>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <span className="text-green-600 font-medium">
                    ✓ Op voorraad ({product.stock_quantity})
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">
                    ✗ Niet op voorraad
                  </span>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aantal
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={addToCart}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {product.stock_quantity > 0 ? 'Toevoegen aan winkelwagen' : 'Niet beschikbaar'}
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Kenmerken</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'description', label: 'Beschrijving' },
                  { id: 'specifications', label: 'Specificaties' },
                  { id: 'reviews', label: 'Reviews' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Productbeschrijving</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                  
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Inclusief:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Specifications Tab */}
              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specificaties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-200 pb-2">
                        <dt className="text-sm font-medium text-gray-500">{key}</dt>
                        <dd className="text-sm text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                  {product.reviews && product.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {product.reviews.map((review, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                          <p className="text-sm text-gray-500">- {review.author}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nog geen reviews voor dit product.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 