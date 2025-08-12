'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils';
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'

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

export default function CartPage() {
  const dealer = useDealerPricing()
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const router = useRouter();

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
    setLoading(false);
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedCart = cartItems.filter(item => item.id !== id);
      setCartItems(updatedCart);
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    } else {
      const updatedCart = cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    }
  };

  const removeItem = (id: string) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
  };

  const saveForLater = (item: CartItem) => {
    // Remove from cart
    const updatedCart = cartItems.filter(cartItem => cartItem.id !== item.id);
    setCartItems(updatedCart);
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart));
    
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
  };

  const removeSavedItem = (id: string) => {
    const updatedSavedItems = savedItems.filter(item => item.id !== id);
    setSavedItems(updatedSavedItems);
    localStorage.setItem('alloygator-saved-items', JSON.stringify(updatedSavedItems));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('alloygator-cart');
  };

  // Calculate totals with dealer discounts if applicable
  const subtotal = cartItems.reduce((sum, item) => {
    const base = dealer.isDealer ? applyDealerDiscount(item.price, dealer.discountPercent) : item.price
    return sum + (base * item.quantity)
  }, 0);
  const vatAmount = cartItems.reduce((sum, item) => {
    const base = dealer.isDealer ? applyDealerDiscount(item.price, dealer.discountPercent) : item.price
    const priceWithVat = calculatePriceWithVat(base, 21);
    const vatOnItem = priceWithVat - base;
    return sum + (vatOnItem * item.quantity);
  }, 0);
  const shippingCost = subtotal > 50 ? 0 : 4.95; // Free shipping over €50
  const total = subtotal + vatAmount + shippingCost;

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      // Prefill customer details from currentUser if available
      try {
        const sessionStr = localStorage.getItem('currentUser')
        if (sessionStr) {
          const u = JSON.parse(sessionStr)
          const existing = JSON.parse(localStorage.getItem('customerDetails') || '{}')
          const merged = {
            voornaam: existing.voornaam || u.voornaam || u.name || '',
            achternaam: existing.achternaam || u.achternaam || '',
            email: existing.email || u.email || '',
            telefoon: existing.telefoon || u.telefoon || u.phone || '',
            adres: existing.adres || u.adres || u.address || '',
            postcode: existing.postcode || u.postcode || u.postal_code || '',
            plaats: existing.plaats || u.plaats || u.city || '',
            land: existing.land || u.land || u.country || 'NL',
            bedrijfsnaam: existing.bedrijfsnaam || u.company_name || '',
            factuurEmail: existing.factuurEmail || u.invoice_email || u.email || '',
            btwNummer: existing.btwNummer || u.vat_number || '',
            separateShippingAddress: existing.separateShippingAddress ?? !!u.separate_shipping_address,
            shippingAdres: existing.shippingAdres || u.shipping_address || '',
            shippingPostcode: existing.shippingPostcode || u.shipping_postal_code || '',
            shippingPlaats: existing.shippingPlaats || u.shipping_city || '',
            shippingLand: existing.shippingLand || u.shipping_country || 'NL'
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
                            €{(dealer.isDealer ? applyDealerDiscount(item.price, dealer.discountPercent) : item.price).toFixed(2)} per stuk{dealer.isDealer ? ' (excl. BTW)' : ''}
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
                            €{((dealer.isDealer ? applyDealerDiscount(item.price, dealer.discountPercent) : item.price) * item.quantity).toFixed(2)}
                          </p>
                          {!dealer.isDealer && (
                            <p className="text-sm text-gray-500">
                              €{calculatePriceWithVat(item.price, 21).toFixed(2)} incl. BTW
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
                  <span>Subtotaal ({cartItems.length} items)</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>BTW (21%)</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Verzendkosten</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                {shippingCost > 0 && (
                  <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                    Voeg nog €{(50 - subtotal).toFixed(2)} toe voor gratis verzending
                  </div>
                )}
                
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