'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'
import { FirebaseService } from '@/lib/firebase'

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vat_category?: string;
  sku?: string;
  stock_quantity?: number;
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

interface CustomerDetails {
  contact_first_name: string;
  contact_last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  vat_number?: string;
  company_name?: string;
  invoice_email?: string;
  vat_verified?: boolean;
  vat_reverse_charge?: boolean;
  separate_shipping_address?: boolean;
  shipping_address?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
  shipping_country?: string;
}

export default function CartPage() {
  const dealer = useDealerPricing()
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [vatSettings, setVatSettings] = useState<VatSettings[]>([]);
  const router = useRouter();

  // BTW functies voor database-gebaseerde BTW berekening
  const getVatRate = (vatCategory: string = 'standard'): number => {
    if (!vatSettings || vatSettings.length === 0) {
      console.warn('BTW instellingen niet geladen, gebruik standaard 21%')
      return 21 // Standaard BTW rate als database niet geladen is
    }
    
    const vatSetting = vatSettings.find(v => v.country_code === 'NL')
    if (!vatSetting) {
      console.warn('BTW instellingen voor Nederland niet gevonden, gebruik standaard 21%')
      return 21 // Standaard BTW rate als Nederland niet gevonden is
    }
    
    // Gebruik de juiste BTW rate op basis van categorie
    if (vatCategory === 'reduced') {
      if (!vatSetting.reduced_rate) {
        console.warn('Verlaagde BTW rate niet gevonden in database, gebruik standaard 21%')
        return 21
      }
      return vatSetting.reduced_rate
    } else if (vatCategory === 'zero') {
      if (!vatSetting.zero_rate) {
        console.warn('Nul BTW rate niet gevonden in database, gebruik 0%')
        return 0
      }
      return vatSetting.zero_rate
    } else {
      if (!vatSetting.standard_rate) {
        console.warn('Standaard BTW rate niet gevonden in database, gebruik standaard 21%')
        return 21
      }
      return vatSetting.standard_rate
    }
  }
  
  const getPriceIncludingVat = (basePrice: number, vatCategory: string = 'standard'): number => {
    const vatRate = getVatRate(vatCategory)
    const priceIncludingVat = basePrice * (1 + vatRate / 100)
    return Math.round(priceIncludingVat * 100) / 100
  }
  
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

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('alloygator-cart');
    const savedForLater = localStorage.getItem('alloygator-saved-items');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedForLater) {
      setSavedItems(JSON.parse(savedForLater));
    }
    
    // Load settings from database
    loadSettings();
    
    // Load VAT settings from database
    loadVatSettings();
    
    setLoading(false);

    // Listen for logout events to clear cart
    const handleLogout = () => {
      console.log('🚪 Cart: Logout event ontvangen - cart data wissen...')
      
      // Reset cart state
      setCartItems([])
      setSavedItems([])
      
      // Verwijder ALLE gerelateerde localStorage items
      const itemsToRemove = [
        'alloygator-cart',
        'alloygator-saved-items',
        'dealerEmail',
        'dealerName',
        'dealerGroup',
        'dealerSession',
        'dealerDiscount',
        'customerDetails'
      ]
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item)
        console.log(`🗑️ Cart logout - verwijderd: ${item}`)
      })
      
      console.log('✅ Cart: Alle cart data gewist')
    }

    window.addEventListener('user-logout', handleLogout)

    return () => {
      window.removeEventListener('user-logout', handleLogout)
    }
  }, []);

  // Herbereken totalen wanneer gebruikerstype verandert
  useEffect(() => {
    if (!loading && cartItems.length > 0) {
      // De BTW logica wordt nu correct toegepast in de calculateTotals functie
      // Geen extra herberekening van prijzen nodig
    }
  }, [dealer.isDealer, dealer.discountPercent]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data && data.length > 0) {
        setSettings(data[0]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  const loadVatSettings = async () => {
    try {
      const vatData = await FirebaseService.getVatSettings()
      if (vatData && Array.isArray(vatData)) {
        setVatSettings(vatData)
      } else {
        setVatSettings([])
      }
    } catch (error) {
      console.error('Fout bij laden BTW instellingen:', error)
      // Fallback naar standaard BTW instellingen
      setVatSettings([{
        id: 'fallback',
        country_code: 'NL',
        standard_rate: 21,
        reduced_rate: 9,
        zero_rate: 0,
        description: 'Standaard BTW Nederland',
        is_eu_member: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
    }
  }

  // Deze functie is niet meer nodig omdat prijzen correct worden opgeslagen
  // De BTW logica wordt nu correct toegepast in de calculateTotals functie

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedCart = cartItems.filter(item => item.id !== id);
      setCartItems(updatedCart);
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    } else {
      const updatedCart = cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    }
  };

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
  };

  const saveForLater = (item: CartItem) => {
    // Remove from cart
    const updatedCart = cartItems.filter(cartItem => cartItem.id !== item.id);
    setCartItems(updatedCart);
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    
    // Add to saved items
    const updatedSavedItems = [...savedItems, item];
    setSavedItems(updatedSavedItems);
    localStorage.setItem('alloygator-saved-items', JSON.stringify(updatedSavedItems));
  };

  const moveToCart = (item: CartItem) => {
    // Remove from saved items
    const updatedSavedItems = savedItems.filter(savedItem => savedItem.id !== item.id);
    setSavedItems(updatedSavedItems);
    localStorage.setItem('alloygator-saved-items', JSON.stringify(updatedSavedItems));
    
    // Add to cart
    const updatedCart = [...cartItems, item];
    setCartItems(updatedCart);
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
  };

  const removeSavedItem = (id: string) => {
    const updatedSavedItems = savedItems.filter(item => item.id !== id);
    setSavedItems(updatedSavedItems);
    localStorage.setItem('alloygator-saved-items', JSON.stringify(updatedSavedItems));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('alloygator-cart');
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } })) } catch {}
  };

  // Calculate totals with dealer discounts if applicable
  // Gebruik alleen database waarden, geen hardcoded fallbacks
  const subtotal = cartItems.reduce((sum, item) => {
    if (dealer.isDealer) {
      // Voor dealers: prijs is al exclusief BTW met korting toegepast
      // GEEN korting opnieuw toepassen - item.price bevat al de dealer korting
      return sum + (item.price * item.quantity)
    } else {
      // Voor particuliere klanten: prijs is al inclusief BTW (geen conversie nodig)
      return sum + (item.price * item.quantity)
    }
  }, 0);
  
  // BTW berekening - alleen voor dealers
  const vatAmount = cartItems.reduce((sum, item) => {
    if (dealer.isDealer) {
      // Voor dealers: item.price is al exclusief BTW met korting
      // Bereken BTW op basis van deze prijs
      const priceWithVat = getPriceIncludingVat(item.price, item.vat_category)
      const vatOnItem = priceWithVat - item.price
      return sum + (vatOnItem * item.quantity)
    } else {
      // Voor particuliere klanten: geen BTW berekening nodig
      return sum
    }
  }, 0);
  
  // Verzendkosten berekening - gebruik database instellingen
  let shippingCostWithVat = 0;
  
  if (settings && settings.freeShippingThreshold) {
    const threshold = parseFloat(settings.freeShippingThreshold);
    if (subtotal >= threshold) {
      shippingCostWithVat = 0; // Gratis verzending
    } else if (settings.shippingCost) {
      const baseShippingCost = parseFloat(settings.shippingCost);
      if (dealer.isDealer) {
        // Voor dealers: verzendkosten ex BTW
        shippingCostWithVat = baseShippingCost;
      } else {
        // Voor particuliere klanten: converteer naar inclusief BTW
        shippingCostWithVat = getPriceIncludingVat(baseShippingCost, 'standard');
      }
    }
  }
  
  // In winkelwagen: geen verzendkosten toevoegen (worden berekend in checkout)
  const total = subtotal + vatAmount;
  
  // Debug logging voor totalen
  // console.log('Winkelwagen totalen berekend:', {
  //   dealer: dealer.isDealer,
  //   subtotal: subtotal,
  //   vatAmount: vatAmount,
  //   shippingCost: shippingCost,
  //   shippingCostWithVat: shippingCostWithVat,
  //   total: total,
  //   cartItems: cartItems.map(item => ({
  //     name: item.name,
  //     price: item.price,
  //     vat_category: item.vat_category,
  //     quantity: item.quantity
  //   }))
  // })
  
  // Test BTW functies
  // if (vatSettings && vatSettings.length > 0) {
  //   const testVatRate = getVatRate('standard')
  //   const testPrice = 100
  //   const testResult = getPriceIncludingVat(testPrice, 'standard')
  //   console.log('BTW functies test:', {
  //     testVatRate,
  //     testPrice,
  //     testResult,
  //     vatSettings: vatSettings.map(v => ({
  //       country_code: v.country_code,
  //       standard_rate: v.standard_rate,
  //       reduced_rate: v.reduced_rate,
  //       zero_rate: v.zero_rate
  //     }))
  //   })
  // }
  
  const handleCheckout = () => {
    if (cartItems.length > 0) {
      // Prefill customer details from currentUser if available
      try {
        const sessionStr = localStorage.getItem('currentUser')
        if (sessionStr) {
          const u = JSON.parse(sessionStr)
          const existing = JSON.parse(localStorage.getItem('customerDetails') || '{}')
          const merged = {
            contact_first_name: existing.contact_first_name || u.contact_first_name || u.first_name || '',
            contact_last_name: existing.contact_last_name || u.contact_last_name || u.last_name || '',
            email: existing.email || u.email || '',
            phone: existing.phone || u.phone || u.contact_phone || '',
            address: existing.address || u.address || u.contact_address || '',
            postal_code: existing.postal_code || u.postal_code || u.contact_postal_code || '',
            city: existing.city || u.city || u.contact_city || '',
            country: existing.country || u.country || u.contact_country || 'NL',
            company_name: existing.company_name || u.company_name || '',
            invoice_email: existing.invoice_email || u.invoice_email || u.email || '',
            vat_number: existing.vat_number || u.vat_number || '',
            separate_shipping_address: existing.separate_shipping_address ?? !!u.separate_shipping_address,
            shipping_address: existing.shipping_address || u.shipping_address || '',
            shipping_postal_code: existing.shipping_postal_code || u.shipping_postal_code || '',
            shipping_city: existing.shipping_city || u.shipping_city || '',
            shipping_country: existing.shipping_country || u.shipping_country || 'NL'
          }
          localStorage.setItem('customerDetails', JSON.stringify(merged))
        }
      } catch {}
      router.push('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-lg text-gray-600 mt-4">Winkelwagen laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Winkelwagen is leeg</h1>
            <p className="text-lg text-gray-600 mb-8">Je hebt nog geen producten in je winkelwagen.</p>
            <Link
              href="/winkel"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
            >
              Ga naar de winkel
            </Link>
          </div>

          {/* Saved Items */}
          {savedItems.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Opgeslagen voor later</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-gray-400 text-2xl">🛞</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">€{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => moveToCart(item)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        Toevoegen aan winkelwagen
                      </button>
                      <button
                        onClick={() => removeSavedItem(item.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Winkelwagen</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Producten ({cartItems.length})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm"
                  >
                    Winkelwagen legen
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-gray-400 text-3xl">🛞</div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            €{item.price.toFixed(2)} per stuk
                            {dealer.isDealer ? ' (excl. BTW)' : ' (incl. BTW)'}
                          </p>
                          {item.sku && (
                            <p className="text-xs text-gray-400">SKU: {item.sku}</p>
                          )}
                          {item.stock_quantity !== undefined && (
                            <p className={`text-xs ${item.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.stock_quantity > 0 ? '✓ Op voorraad' : '✗ Niet op voorraad'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 text-gray-900 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right min-w-[100px]">
                          <p className="text-lg font-medium text-gray-900">
                            €{(item.price * item.quantity).toFixed(2)}
                          </p>
                          {!dealer.isDealer && (
                            <p className="text-sm text-gray-500">
                              {getVatText(item.vat_category)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveForLater(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Bewaren voor later"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Verwijderen"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Besteloverzicht</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{dealer.isDealer ? 'Subtotaal' : 'Producten inclusief BTW'} ({cartItems.length} items)</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                {dealer.isDealer && vatAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>BTW ({getVatRate('standard')}%)</span>
                    <span>€{vatAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Verzendkosten worden alleen getoond in checkout, niet in winkelwagen */}
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  Verzendkosten worden berekend bij het afrekenen
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Totaal</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusief BTW en verzendkosten</p>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium mt-6"
              >
                Afrekenen
              </button>
              
              <div className="mt-4 text-center">
                <Link
                  href="/winkel"
                  className="text-green-600 hover:text-green-700 transition-colors font-medium text-sm"
                >
                  ← Verder winkelen
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Saved Items */}
        {savedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Opgeslagen voor later</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-2xl">🛞</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">€{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => moveToCart(item)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Toevoegen aan winkelwagen
                    </button>
                    <button
                      onClick={() => removeSavedItem(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 