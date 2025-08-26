'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils'
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'
import { FirebaseService } from '@/lib/firebase'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'
import SEO from '../components/SEO'
import { generateWebPageData } from '../lib/structured-data'

interface Product {
  id: string
  name: string
  description: string
  price: number
  vat_category: string
  category: string
  image_url?: string
  image?: string // Backward compatibility
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
  reviews?: { rating: number; comment: string }[]
}

interface VatSettings {
  id: string
  country_code: string
  standard_rate: number
  reduced_rate: number
  zero_rate: number
  description: string
  is_eu_member: boolean
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
  category?: string
}

export default function WinkelPage() {
  const dealer = useDealerPricing()
  const [products, loading, error] = useFirebaseRealtime<Product>('products')
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 })
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState(0)
  const [vatSettings, setVatSettings] = useState<any[]>([])

  // Directe test om te zien of de component wordt gerenderd
  console.log('=== WINKELPAGE TEST ===')
  console.log('Component wordt gerenderd')
  console.log('vatSettings:', vatSettings)
  console.log('products:', products)
  console.log('loading:', loading)
  console.log('=======================')

  // Test BTW instellingen direct laden
  useEffect(() => {
    console.log('=== DIRECTE BTW TEST ===')
    const testVat = async () => {
      try {
        console.log('Probeer BTW instellingen te laden...')
        const vatData = await FirebaseService.getVatSettings()
        console.log('BTW data geladen:', vatData)
        if (vatData && Array.isArray(vatData)) {
          const nlVat = vatData.find(v => v.country_code === 'NL')
          console.log('Nederlandse BTW:', nlVat)
        }
      } catch (error) {
        console.error('BTW test fout:', error)
      }
    }
    testVat()
  }, [])

  // Test BTW instellingen direct laden zonder useEffect
  const testVatDirect = async () => {
    try {
      console.log('=== DIRECTE BTW TEST ZONDER USEEFFECT ===')
      const vatData = await FirebaseService.getVatSettings()
      console.log('BTW data direct geladen:', vatData)
      if (vatData && Array.isArray(vatData)) {
        const nlVat = vatData.find(v => v.country_code === 'NL')
        console.log('Nederlandse BTW direct:', nlVat)
      }
    } catch (error) {
      console.error('BTW direct test fout:', error)
    }
  }
  
  // Roep de test direct aan
  testVatDirect()
  
  // Debug logging met type check voor producten
  const productList: Product[] = Array.isArray(products) ? (products as unknown as Product[]) : []
  const normalizeCategory = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, '-');
  
  // Functie om prijzen inclusief BTW te berekenen op basis van database instellingen
  const getPriceIncludingVat = (basePrice: number, vatCategory: string = 'standard'): number => {
    if (!vatSettings || vatSettings.length === 0) {
      console.warn('BTW instellingen niet geladen, gebruik standaard 21%')
      const priceIncludingVat = basePrice * 1.21
      return Math.round(priceIncludingVat * 100) / 100
    }
    
    // Zoek BTW instellingen voor Nederland
    const vatSetting = vatSettings.find(v => v.country_code === 'NL')
    if (!vatSetting) {
      console.warn('BTW instellingen voor Nederland niet gevonden, gebruik standaard 21%')
      const priceIncludingVat = basePrice * 1.21
      return Math.round(priceIncludingVat * 100) / 100
    }
    
    // Gebruik de juiste BTW rate op basis van categorie
    let vatRate = 0
    if (vatCategory === 'reduced') {
      if (!vatSetting.reduced_rate) {
        console.warn('Verlaagde BTW rate niet gevonden in database, gebruik standaard 21%')
        vatRate = 21
      } else {
        vatRate = vatSetting.reduced_rate
      }
    } else if (vatCategory === 'zero') {
      if (!vatSetting.zero_rate) {
        console.warn('Nul BTW rate niet gevonden in database, gebruik 0%')
        vatRate = 0
      } else {
        vatRate = vatSetting.zero_rate
      }
    } else {
      if (!vatSetting.standard_rate) {
        console.warn('Standaard BTW rate niet gevonden in database, gebruik standaard 21%')
        vatRate = 21
      } else {
        vatRate = vatSetting.standard_rate
      }
    }
    
    const priceIncludingVat = basePrice * (1 + vatRate / 100)
    
    return Math.round(priceIncludingVat * 100) / 100 // Afronden op 2 decimalen
  }
  
  // Functie om BTW rate op te halen op basis van database instellingen
  const getVatRate = (vatCategory: string = 'standard'): number => {
    if (!vatSettings || vatSettings.length === 0) {
      return 21 // Fallback naar standaard 21%
    }
    
    const vatSetting = vatSettings.find(v => v.country_code === 'NL')
    if (!vatSetting) {
      return 21 // Fallback naar standaard 21%
    }
    
    // Gebruik de juiste BTW rate op basis van categorie
    if (vatCategory === 'reduced') {
      return vatSetting.reduced_rate || 9
    } else if (vatCategory === 'zero') {
      return vatSetting.zero_rate || 0
    } else {
      return vatSetting.standard_rate || 21
    }
  }
  
  // Functie om BTW tekst te genereren op basis van database instellingen
  const getVatText = (vatCategory: string = 'standard'): string => {
    if (!vatSettings || vatSettings.length === 0) {
      console.warn('BTW instellingen niet geladen, gebruik standaard tekst')
      return 'incl. BTW'
    }
    
    const vatSetting = vatSettings.find(v => v.country_code === 'NL')
    if (!vatSetting) {
      console.warn('BTW instellingen voor Nederland niet gevonden, gebruik standaard tekst')
      return 'incl. BTW'
    }
    
    let vatRate = 0
    if (vatCategory === 'reduced') {
      if (!vatSetting.reduced_rate) {
        console.warn('Verlaagde BTW rate niet gevonden in database, gebruik standaard 21%')
        vatRate = 21
      } else {
        vatRate = vatSetting.reduced_rate
      }
    } else if (vatCategory === 'zero') {
      if (!vatSetting.zero_rate) {
        console.warn('Nul BTW rate niet gevonden in database, gebruik 0%')
        vatRate = 0
      } else {
        vatRate = vatSetting.zero_rate
      }
    } else {
      if (!vatSetting.standard_rate) {
        console.warn('Standaard BTW rate niet gevonden in database, gebruik standaard 21%')
        vatRate = 21
      } else {
        vatRate = vatSetting.standard_rate
      }
    }
    
    return `incl. ${vatRate}% BTW`
  }

  // Functie om de juiste weergave prijs te bepalen op basis van gebruikerstype
  const getDisplayPrice = (product: Product): { price: number; vatText: string } => {
    const basePrice = Number(product.price || 0)
    
    // Voor dealers: toon prijs exclusief BTW met korting toegepast
    if (dealer.isDealer) {
      const discountedPrice = applyDealerDiscount(basePrice, dealer.discountPercent)
      return {
        price: discountedPrice,
        vatText: 'excl. BTW'
      }
    }
    
    // Voor particuliere klanten en niet-ingelogde gebruikers: toon prijs inclusief BTW
    const priceIncludingVat = getPriceIncludingVat(basePrice, product.vat_category || 'standard')
    const vatText = getVatText(product.vat_category || 'standard')
    
    return {
      price: priceIncludingVat,
      vatText: vatText
    }
  }

  useEffect(() => {
    console.log('WinkelPage useEffect aangeroepen')
    
    // Load VAT settings from database
    const loadVatSettings = async () => {
      try {
        console.log('Start BTW instellingen laden...')
        const vatData = await FirebaseService.getVatSettings()
        console.log('BTW data ontvangen:', vatData)
        
        if (vatData && Array.isArray(vatData)) {
          console.log('BTW data is array, lengte:', vatData.length)
          setVatSettings(vatData)
          
          // Test of BTW instellingen correct zijn geladen
          const nlVat = vatData.find(v => v.country_code === 'NL')
          if (nlVat) {
            console.log('Nederlandse BTW instellingen gevonden:', {
              standard: nlVat.standard_rate,
              reduced: nlVat.reduced_rate,
              zero: nlVat.zero_rate
            })
          } else {
            console.warn('Geen Nederlandse BTW instellingen gevonden')
          }
        } else {
          console.warn('BTW data is geen array:', typeof vatData, vatData)
          setVatSettings([])
        }
      } catch (error) {
        console.error('Fout bij laden BTW instellingen:', error)
        setVatSettings([])
      }
    }
    
    loadVatSettings()
    
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
    
    // Real-time cart sync
    const syncCart = () => {
      const savedCart = localStorage.getItem('alloygator-cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setCart(parsedCart)
        } catch (error) {
          console.error('Error parsing cart:', error)
        }
      }
    }
    
    // React op dealer quick-login keys en cart updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'alloygator-cart') {
        syncCart()
      }
    }
    
    const onCartUpdated = () => {
      syncCart()
    }
    
    window.addEventListener('storage', onStorage)
    window.addEventListener('cart-updated', onCartUpdated)
    
    // Initial sync
    syncCart()
    
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('cart-updated', onCartUpdated)
    }
  }, [])

  // Filter and sort products (new logic)
  const filteredProducts = productList
    .filter(product => {
      const nameText = String(product.name || '').toLowerCase()
      const descText = String((product as any).short_description || product.description || '').toLowerCase()
      const matchesSearch = nameText.includes(searchTerm.toLowerCase()) || descText.includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || normalizeCategory(product.category) === selectedCategory
      
      // Gebruik inclusief BTW prijs voor de filter
      const basePrice = Number((product as any).price || 0)
      const priceIncludingVat = getPriceIncludingVat(basePrice, product.vat_category || 'standard')
      const matchesPrice = priceIncludingVat >= priceRange.min && priceIncludingVat <= priceRange.max
      
      const stockNum = Number((product as any).stock_quantity || 0)
      const matchesAvailability = availabilityFilter === 'all' || 
        (availabilityFilter === 'in-stock' && stockNum > 0) ||
        (availabilityFilter === 'out-of-stock' && stockNum === 0)
      const matchesRating = ratingFilter === 0 || 
        (product.reviews && product.reviews.length > 0 && 
         product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length >= ratingFilter)
      
      return matchesSearch && matchesCategory && matchesPrice && matchesAvailability && matchesRating
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': {
          // Sorteer op basis van gebruikerstype: dealers op ex BTW, anderen op inclusief BTW
          const priceA = dealer.isDealer ? Number((a as any).price || 0) : getPriceIncludingVat(Number((a as any).price || 0), a.vat_category || 'standard')
          const priceB = dealer.isDealer ? Number((b as any).price || 0) : getPriceIncludingVat(Number((b as any).price || 0), b.vat_category || 'standard')
          return priceA - priceB
        }
        case 'price-high': {
          // Sorteer op basis van gebruikerstype: dealers op ex BTW, anderen op inclusief BTW
          const priceA = dealer.isDealer ? Number((a as any).price || 0) : getPriceIncludingVat(Number((a as any).price || 0), a.vat_category || 'standard')
          const priceB = dealer.isDealer ? Number((b as any).price || 0) : getPriceIncludingVat(Number((b as any).price || 0), b.vat_category || 'standard')
          return priceB - priceA
        }
        case 'name': return String(a.name || '').localeCompare(String(b.name || ''))
        case 'rating': 
          const ratingA = a.reviews && a.reviews.length > 0 ? 
            a.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length : 0
          const ratingB = b.reviews && b.reviews.length > 0 ? 
            b.reviews.reduce((sum, review) => sum + review.rating, 0) / a.reviews.length : 0
          return ratingB - ratingA
        case 'newest': {
          const ta = new Date(String((a as any).created_at || '1970-01-01')).getTime()
          const tb = new Date(String((b as any).created_at || '1970-01-01')).getTime()
          return tb - ta
        }
        default: return 0
      }
    })

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      // Herbereken de prijs voor bestaande items om rekening te houden met gebruikerstype wijzigingen
      const updatedCart = cart.map(item =>
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              price: dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : getPriceIncludingVat(product.price, product.vat_category || 'standard')
            }
          : item
      )
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
      // Notify listeners
      window.dispatchEvent(new Event('cart-updated'))
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        // Gebruik de juiste prijs op basis van gebruikerstype
        price: dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : getPriceIncludingVat(product.price, product.vat_category || 'standard'),
        quantity: 1,
        image: product.image_url,
        vat_category: product.vat_category,
        category: product.category
      }
      const updatedCart = [...cart, newItem]
      setCart(updatedCart)
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
      // Notify listeners
      window.dispatchEvent(new Event('cart-updated'))
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
    
    const updatedCart = cart.map(item => {
      if (item.id === productId) {
        // Herbereken de prijs als de vat_category is veranderd
        const product = productList.find(p => p.id === productId)
        if (product) {
          // Gebruik de juiste prijs op basis van gebruikerstype
          const newPrice = dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : getPriceIncludingVat(product.price, product.vat_category || 'standard')
          return { ...item, quantity, price: newPrice }
        }
      }
      return item
    })
    
    setCart(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // Voor dealers: item.price bevat al de dealer korting (geen opnieuw toepassen)
      // Voor particuliere klanten: gebruik inclusief BTW prijs (geen korting)
      const finalPrice = item.price // Geen korting opnieuw toepassen
      return total + (finalPrice * item.quantity)
    }, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const toggleWishlist = (productId: string) => {
    setWishlist(prevWishlist => {
      const newWishlist = prevWishlist.includes(productId)
        ? prevWishlist.filter(id => id !== productId)
        : [...prevWishlist, productId]
      localStorage.setItem('alloygator-wishlist', JSON.stringify(newWishlist))
      return newWishlist
    })
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
    <>
      <SEO 
        title="Winkel - Velgen Bescherming Producten"
        description="Ontdek AlloyGator's complete assortiment velgen bescherming producten. Van complete sets tot accessoires en montagehulpmiddelen. Bescherm je velgen tegen stoeprandschade."
        keywords="velgen bescherming winkel, alloygator producten, velgbeschermers kopen, montagehulpmiddelen, velg accessoires, professionele velgen bescherming"
        canonical="/winkel"
        structuredData={generateWebPageData({
          name: "Winkel - Velgen Bescherming Producten",
          description: "Complete assortiment velgen bescherming producten van AlloyGator",
          url: "/winkel",
          breadcrumb: {
            items: [
              { name: "Home", url: "/" },
              { name: "Winkel", url: "/winkel" }
            ]
          }
        })}
      />
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
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Zoek producten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="name">Naam A-Z</option>
                  <option value="price-low">Prijs: Laag naar Hoog</option>
                  <option value="price-high">Prijs: Hoog naar Laag</option>
                  <option value="rating">Hoogste Beoordeling</option>
                  <option value="newest">Nieuwste Eerst</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-6 space-y-6">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Categorieën</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      onClick={() => setSelectedCategory('alloygator-set')}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === 'alloygator-set'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      AlloyGator Sets
                    </button>
                    <button
                      onClick={() => setSelectedCategory('montagehulpmiddelen')}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === 'montagehulpmiddelen'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Montagehulpmiddelen
                    </button>
                    <button
                      onClick={() => setSelectedCategory('accessoires')}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedCategory === 'accessoires'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Accessoires
                    </button>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Prijsbereik</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          min="0"
                          max={priceRange.max}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          min={priceRange.min}
                          max="500"
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      €{priceRange.min} - €{priceRange.max}
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Beschikbaarheid</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="all"
                        checked={availabilityFilter === 'all'}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        className="text-green-600"
                      />
                      <span className="text-sm">Alle producten</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="in-stock"
                        checked={availabilityFilter === 'in-stock'}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        className="text-green-600"
                      />
                      <span className="text-sm">Op voorraad</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="out-of-stock"
                        checked={availabilityFilter === 'out-of-stock'}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                        className="text-green-600"
                      />
                      <span className="text-sm">Niet op voorraad</span>
                    </label>
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Minimum beoordeling</h3>
                  <div className="flex items-center space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          ratingFilter === rating
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rating === 0 ? 'Alle' : `${rating}+ sterren`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setPriceRange({ min: 0, max: 200 })
                      setAvailabilityFilter('all')
                      setRatingFilter(0)
                    }}
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                  >
                    Alle filters wissen
                  </button>
                </div>
              </div>
            )}
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
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen producten beschikbaar</h3>
            <p className="text-sm text-gray-500 mb-4">
              Er zijn momenteel geen producten in de database. 
              {loading ? ' Bezig met laden...' : ' Gebruik de admin om producten toe te voegen.'}
            </p>
            {!loading && (
              <a
                href="/admin/products"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Ga naar Admin
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
            const rawBase = Number((product as any).price || 0)
            const base = dealer.isDealer ? applyDealerDiscount(rawBase, dealer.discountPercent) : rawBase
            const { price: displayPrice, vatText } = getDisplayPrice(product)
            
            return (
              <div key={`${(product as any).id || (product as any).sku || 'p'}-${index}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <Link href={`/winkel/product/${(product as any).slug || (product as any).id}`}>
                  <div className="h-48 flex items-center justify-center cursor-pointer">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🛞</div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-6">
                  <Link href={`/winkel/product/${(product as any).slug || (product as any).id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>
                  <div
                    className="text-gray-600 text-sm mb-4 line-clamp-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: String((product as any).short_description || product.description || '') }}
                  />
                  
                  {/* Features */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {(product.features || []).slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

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

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          €{displayPrice.toFixed(2)}
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

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      href={`/winkel/product/${product.id}`}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-center text-sm"
                    >
                      Bekijk details
                    </Link>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {product.stock_quantity > 0 ? 'Toevoegen' : 'Niet beschikbaar'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className={`px-3 py-2 rounded-md border transition-colors ${
                        wishlist.includes(product.id)
                          ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg
                        className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-current' : 'stroke-current fill-none'}`}
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
              </div>
            )
          })}
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
    </>
  )
} 