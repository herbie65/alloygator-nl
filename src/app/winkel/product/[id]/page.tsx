'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    updated_at: '2024-01-01'
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
    updated_at: '2024-01-01'
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
    updated_at: '2024-01-01'
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
    updated_at: '2024-01-01'
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

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
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

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Aantal
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={product.stock_quantity}
                      className="w-20 h-10 border border-gray-300 rounded-md text-center"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {product.stock_quantity > 0 ? 'Toevoegen aan winkelwagen' : 'Niet beschikbaar'}
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