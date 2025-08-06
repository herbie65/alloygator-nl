import { Metadata } from 'next'

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'

interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user_name?: string
}

interface ReviewsSectionProps {
  productId: string
  productName: string
}

function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  })
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date')

  useEffect(() => {
    // Load reviews from localStorage
    const savedReviews = JSON.parse(localStorage.getItem('product-reviews') || '[]')
    const productReviews = savedReviews.filter((review: Review) => review.product_id === productId)
    setReviews(productReviews)
  }, [productId])

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) return

    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')
    
    const review: Review = {
      id: Date.now().toString(),
      product_id: productId,
      user_id: user.id || 'anonymous',
      rating: newReview.rating,
      comment: newReview.comment,
      created_at: new Date().toISOString(),
      user_name: user.voornaam ? `${user.voornaam} ${user.achternaam}` : 'Anonieme gebruiker'
    }

    const allReviews = JSON.parse(localStorage.getItem('product-reviews') || '[]')
    allReviews.push(review)
    localStorage.setItem('product-reviews', JSON.stringify(allReviews))

    setReviews([...reviews, review])
    setNewReview({ rating: 5, comment: '' })
    setShowReviewForm(false)
  }

  const filteredReviews = reviews
    .filter(review => filterRating === null || review.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return b.rating - a.rating
      }
    })

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  const ratingCounts = reviews.reduce((counts, review) => {
    counts[review.rating] = (counts[review.rating] || 0) + 1
    return counts
  }, {} as Record<number, number>)

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Klantenreviews</h3>
      
      {/* Review Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mt-1">
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
            <div className="text-sm text-gray-600 mt-1">{reviews.length} reviews</div>
          </div>
          
          <div className="flex-1">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating] || 0
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                
                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm text-gray-600">{rating}</span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Review Form */}
      <div className="mb-6">
        {!showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Schrijf een review
          </button>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Schrijf een review voor {productName}</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beoordeling</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commentaar</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  placeholder="Deel je ervaring met dit product..."
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmitReview}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Review plaatsen
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Alle beoordelingen</option>
            <option value="5">5 sterren</option>
            <option value="4">4 sterren</option>
            <option value="3">3 sterren</option>
            <option value="2">2 sterren</option>
            <option value="1">1 ster</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">Nieuwste eerst</option>
            <option value="rating">Hoogste beoordeling eerst</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredReviews.length} van {reviews.length} reviews
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">⭐</div>
            <p className="text-gray-600">Nog geen reviews voor dit product</p>
            <p className="text-sm text-gray-500 mt-2">Wees de eerste om een review te schrijven!</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2">
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
                    <span className="text-sm font-medium text-gray-900">
                      {review.user_name || 'Anonieme gebruiker'}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('nl-NL')}
                </span>
              </div>
              
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

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
  reviews?: {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
  }[];
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
    description: 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen. Professionele velgbescherming die eenvoudig te monteren is en langdurige bescherming biedt tegen stoeprandschade.',
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
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', 'Professionele kwaliteit', 'Eenvoudige montage'],
    specifications: {
      'Velg diameter': '17 inch',
      'Materiaal': 'Hoogwaardig kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '2.5 kg',
      'Garantie': '2 jaar',
      'Inclusief': 'Montagehulpmiddelen, handleiding'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      {
        id: '1',
        product_id: '1',
        user_id: '1',
        rating: 5,
        comment: 'Perfecte kwaliteit en montagehulpmiddelen. Zeer tevreden!',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        product_id: '1',
        user_id: '2',
        rating: 4,
        comment: 'Goed product, maar de montagehulpmiddelen zijn niet zo groot als verwacht.',
        created_at: '2024-01-02T11:00:00Z'
      }
    ]
  },
  {
    id: '2',
    name: 'AlloyGator Complete Set 18"',
    description: 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen. Ideaal voor grotere velgen die extra bescherming nodig hebben.',
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
    features: ['Complete set', 'Montagehulpmiddelen', 'Handleiding', 'Voor 18 inch velgen', 'Extra bescherming'],
    specifications: {
      'Velg diameter': '18 inch',
      'Materiaal': 'Hoogwaardig kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '2.8 kg',
      'Garantie': '2 jaar',
      'Inclusief': 'Montagehulpmiddelen, handleiding'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      {
        id: '3',
        product_id: '2',
        user_id: '1',
        rating: 3,
        comment: 'Niet zo goed als verwacht. Montagehulpmiddelen zijn te klein.',
        created_at: '2024-01-03T12:00:00Z'
      },
      {
        id: '4',
        product_id: '2',
        user_id: '2',
        rating: 5,
        comment: 'Perfecte kwaliteit en montagehulpmiddelen. Zeer tevreden!',
        created_at: '2024-01-04T13:00:00Z'
      }
    ]
  },
  {
    id: '3',
    name: 'Montage Tool Set',
    description: 'Professionele montagehulpmiddelen voor eenvoudige installatie van AlloyGator velgbescherming. Complete set met alle benodigde gereedschappen.',
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
    features: ['Complete gereedschap', 'Professioneel', 'Duurzaam', 'Eenvoudig in gebruik', 'Compacte opbergdoos'],
    specifications: {
      'Inhoud': 'Complete gereedschap set',
      'Materiaal': 'Hoogwaardig staal',
      'Kleur': 'Zilver',
      'Gewicht': '0.5 kg',
      'Garantie': '1 jaar',
      'Opbergdoos': 'Inclusief'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      {
        id: '5',
        product_id: '3',
        user_id: '1',
        rating: 4,
        comment: 'Goed gereedschap, maar de opbergdoos is wat klein.',
        created_at: '2024-01-05T14:00:00Z'
      }
    ]
  },
  {
    id: '4',
    name: 'Vervangingsonderdelen Set',
    description: 'Extra onderdelen voor onderhoud en reparatie van uw AlloyGator velgbescherming. Ideaal voor het vervangen van beschadigde onderdelen.',
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
    features: ['Onderdelen', 'Onderhoud', 'Reparatie', 'Originele kwaliteit', 'Eenvoudig te vervangen'],
    specifications: {
      'Type': 'Vervangingsonderdelen',
      'Materiaal': 'Origineel kunststof',
      'Kleur': 'Zwart',
      'Gewicht': '0.3 kg',
      'Garantie': '1 jaar',
      'Compatibiliteit': 'Alle AlloyGator sets'
    },
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    reviews: [
      {
        id: '6',
        product_id: '4',
        user_id: '1',
        rating: 2,
        comment: 'Niet zo goed als verwacht. Onderdelen zijn niet compatibel.',
        created_at: '2024-01-06T15:00:00Z'
      }
    ]
  }
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState('description')
  const [wishlist, setWishlist] = useState<string[]>([])

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }

    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('alloygator-wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }

    // Find product by ID
    const productId = params.id as string
    const foundProduct = staticProducts.find(p => p.id === productId)
    
    if (foundProduct) {
      setProduct(foundProduct)
    } else {
      // Product not found, redirect to winkel
      router.push('/winkel')
    }
    
    setLoading(false)
  }, [params.id, router])

  const addToCart = () => {
    if (!product) return

    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        image: product.image_url,
        vat_category: product.vat_category
      }
      const updatedCart = [...cart, newItem]
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    }

    // Show success message
    alert(`${quantity}x ${product.name} toegevoegd aan winkelwagen`)
  }

  const toggleWishlist = () => {
    if (!product) return

    const updatedWishlist = [...wishlist]
    const index = updatedWishlist.indexOf(product.id)

    if (index > -1) {
      updatedWishlist.splice(index, 1)
      setWishlist(updatedWishlist)
      localStorage.setItem('alloygator-wishlist', JSON.stringify(updatedWishlist))
      alert(`${product.name} verwijderd uit wenslijst.`)
    } else {
      updatedWishlist.push(product.id)
      setWishlist(updatedWishlist)
      localStorage.setItem('alloygator-wishlist', JSON.stringify(updatedWishlist))
      alert(`${product.name} toegevoegd aan wenslijst!`)
    }
  }

  const isInWishlist = wishlist.includes(product?.id || '')

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
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product niet gevonden</h3>
          <p className="text-gray-600 mb-4">Het opgevraagde product bestaat niet.</p>
          <Link
            href="/winkel"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Terug naar winkel
          </Link>
        </div>
      </div>
    )
  }

  const priceWithVat = calculatePriceWithVat(product.price, 21)
  const vatText = getVatDisplayText(21, 'NL')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/winkel" className="hover:text-green-600">Winkel</Link></li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-8xl">🛞</div>
                )}
              </div>
            </div>
            
            {/* Additional images placeholder */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-2xl">🛞</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-lg text-gray-600">{product.description}</p>
            </div>

            {/* Price */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-gray-900">
                    €{priceWithVat.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">{vatText}</span>
                </div>
                <div className="text-sm text-gray-500">
                  SKU: {product.sku}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
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

              {/* Product Actions */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {product.stock_quantity > 0 ? 'Toevoegen aan winkelwagen' : 'Niet beschikbaar'}
                </button>
                
                <button
                  onClick={toggleWishlist}
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    isInWishlist
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isInWishlist ? 'fill-current' : 'stroke-current fill-none'}`}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'description'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Beschrijving
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'specifications'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Specificaties
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reviews ({product.reviews?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('warranty')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'warranty'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Garantie
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'description' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Productbeschrijving</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Inclusief</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Complete product set</li>
                      <li>Montagehulpmiddelen</li>
                      <li>Gedetailleerde handleiding</li>
                      <li>Garantie certificaat</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'specifications' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Technische specificaties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <ReviewsSection productId={product.id} productName={product.name} />
              )}

              {activeTab === 'warranty' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Garantie informatie</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Garantie periode</h4>
                      <p className="text-gray-600">{product.warranty} garantie op alle onderdelen</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Wat valt onder garantie</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Fabrieksfouten</li>
                        <li>Materiaal defecten</li>
                        <li>Montage problemen</li>
                        <li>Kwaliteitsproblemen</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Garantie voorwaarden</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Correcte montage vereist</li>
                        <li>Normaal gebruik</li>
                        <li>Originele onderdelen</li>
                        <li>Bewaar originele factuur</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerelateerde producten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {staticProducts
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/winkel/product/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <div className="text-gray-400 text-4xl">🛞</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      €{calculatePriceWithVat(relatedProduct.price, 21).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
} 