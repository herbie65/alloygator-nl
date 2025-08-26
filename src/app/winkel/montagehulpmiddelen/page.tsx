'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'
import SEO from '../../components/SEO'
import { generateWebPageData } from '../../lib/structured-data'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  image?: string // Backward compatibility
  category: string
  slug?: string
  vat_category?: string
}

export default function MontageHulpmiddelenPage() {
  const [allProducts, loading, error] = useFirebaseRealtime<Product>('products')
  const dealer = useDealerPricing()
  const [vatSettings, setVatSettings] = useState<any[]>([])

  // Filter products for this category
  const normalizeCategory = (v: any) => String(v || '').toLowerCase().replace(/\s+/g, '-')
  const list: any[] = Array.isArray(allProducts) ? (allProducts as unknown as any[]) : []
  const products = list.filter((p) => normalizeCategory(p.category) === 'montagehulpmiddelen')

  // Helper function to get the correct image URL
  const getProductImage = (product: Product) => {
    return product.image_url || product.image || null
  }

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
    // Load VAT settings from database
    const loadVatSettings = async () => {
      try {
        const { FirebaseService } = await import('@/lib/firebase')
        const vatData = await FirebaseService.getVatSettings()
        if (vatData && Array.isArray(vatData)) {
          setVatSettings(vatData)
        }
      } catch (error) {
        console.error('Fout bij laden BTW instellingen:', error)
      }
    }
    
    loadVatSettings()
  }, [])

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('alloygator-cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)

    const itemToStore = {
      id: product.id,
      name: product.name,
      price: dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : getPriceIncludingVat(product.price, product.vat_category || 'standard'),
      quantity: 1,
      image: getProductImage(product),
      category: product.category,
      vat_category: product.vat_category
    }

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push(itemToStore)
    }

    localStorage.setItem('alloygator-cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
  }

  return (
    <>
      <SEO 
        title="Montagehulpmiddelen - AlloyGator Installatie Tools"
        description="Professionele montage tools voor AlloyGator velgbescherming. Complete set met montagewiel, rubber hamer, snijtang en pomp voor perfecte installatie."
        keywords="montagehulpmiddelen, alloygator installatie, velgbescherming monteren, montagewiel, rubber hamer, snijtang, band op spanning brengen"
        canonical="/winkel/montagehulpmiddelen"
        structuredData={generateWebPageData({
          name: "Montagehulpmiddelen - AlloyGator Installatie Tools",
          description: "Professionele tools voor eenvoudige montage van AlloyGator velgbescherming",
          url: "/winkel/montagehulpmiddelen",
          breadcrumb: {
            items: [
              { name: "Home", url: "/" },
              { name: "Winkel", url: "/winkel" },
              { name: "Montagehulpmiddelen", url: "/winkel/montagehulpmiddelen" }
            ]
          }
        })}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/winkel" className="hover:text-green-600">Winkel</Link></li>
            <li>/</li>
            <li className="text-gray-900">Montagehulpmiddelen</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Montagehulpmiddelen</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            De Montage Tool Set is speciaal ontwikkeld om AlloyGators eenvoudig, snel en professioneel te installeren.
          </p>
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Complete Montage Set Inhoud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Montagewiel</h3>
                <p className="text-gray-600">Speciaal ontwikkeld wiel voor het perfect positioneren van de AlloyGator tussen band en velg.</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Rubber Hamer</h3>
                <p className="text-gray-600">Zachte hamer voor het veilig aanslaan van de velgbeschermer zonder schade aan te richten.</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Snijtang</h3>
                <p className="text-gray-600">Professionele tang voor het precies afknippen van overtollig materiaal na installatie.</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-600 mb-2">Bandenpomp</h3>
                <p className="text-gray-600">Pomp voor het op spanning brengen van de band na montage van de AlloyGator.</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Gebruik</h3>
              <p className="text-green-700">
                Met deze set druk je de AlloyGator stevig tussen de band en de velg, waarna je overtollig materiaal afknipt en de band op de juiste spanning brengt. 
                Ideaal voor monteurs en doe-het-zelvers.
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image - Clickable link to product detail */}
              <Link href={`/winkel/product/${product.slug || product.id}`}>
                <div className="h-48 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                  {getProductImage(product) ? (
                    <img 
                      src={getProductImage(product)!} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-4xl">🔨</div>
                  )}
                </div>
              </Link>
              
              <div className="p-6">
                {/* Product Name - Clickable link to product detail */}
                <Link href={`/winkel/product/${product.slug || product.id}`}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-green-600 cursor-pointer">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    €{getDisplayPrice(product).price.toFixed(2)}
                    <span className="text-sm text-gray-500 ml-2">{getDisplayPrice(product).vatText}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    In winkelwagen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Geen montagehulpmiddelen gevonden.</p>
            <Link href="/admin" className="text-green-600 hover:text-green-700 mt-4 inline-block">
              Beheer producten
            </Link>
          </div>
        )}

        {/* Category Navigation */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Andere categorieën</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/winkel/alloygator-set" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">AlloyGator Sets</h3>
                <p className="text-gray-600 mt-2">Complete sets voor verschillende velgmaten</p>
              </div>
            </Link>
            <Link href="/winkel/accessoires" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">Accessoires</h3>
                <p className="text-gray-600 mt-2">Extra onderdelen en accessoires</p>
              </div>
            </Link>
            <Link href="/winkel" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">Alle producten</h3>
                <p className="text-gray-600 mt-2">Bekijk ons complete assortiment</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 