'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'
import { useDealerPricing, applyDealerDiscount } from '@/hooks/useDealerPricing'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image?: string
  category: string
}



export default function AlloyGatorSetPage() {
  const [allProducts, loading, error] = useFirebaseRealtime<Product>('products', 'created_at')
  const dealer = useDealerPricing()

  // Filter products for this category
  const products = allProducts.filter(p => p.category === 'alloygator-set')

  useEffect(() => {}, [])

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('alloygator-cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)

    const itemToStore = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: (product as any).image,
      category: product.category
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/winkel" className="hover:text-green-600">Winkel</Link></li>
            <li>/</li>
            <li className="text-gray-900">AlloyGator Sets</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AlloyGator Sets</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Complete sets voor verschillende velgmaten en voertuigtypes. 
            Elke set bevat alle benodigde onderdelen voor professionele velgbescherming.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {product.image && (
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-600">
                    €{(dealer.isDealer ? applyDealerDiscount(product.price, dealer.discountPercent) : product.price).toFixed(2)}
                    <span className="text-sm text-gray-500 ml-2">{dealer.isDealer ? 'excl. BTW' : 'incl. BTW'}</span>
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
            <p className="text-gray-500 text-lg">Geen AlloyGator sets gevonden.</p>
            <Link href="/admin" className="text-green-600 hover:text-green-700 mt-4 inline-block">
              Beheer producten
            </Link>
          </div>
        )}

        {/* Category Navigation */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Andere categorieën</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/winkel/accessoires" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">Accessoires</h3>
                <p className="text-gray-600 mt-2">Extra onderdelen en accessoires</p>
              </div>
            </Link>
            <Link href="/winkel/montagehulpmiddelen" className="group">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">Montagehulpmiddelen</h3>
                <p className="text-gray-600 mt-2">Professionele tools voor eenvoudige montage</p>
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
  )
} 