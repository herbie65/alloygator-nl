'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // We'll add this later when we have the Firebase service
        setProducts([])
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              AlloyGator Nederland
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Professionele velgbescherming tegen stoeprandschade
            </p>
            <Link 
              href="/winkel"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              Bekijk onze producten
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Eenvoudige montage
              </h3>
              <p className="text-gray-600">
                Monteer AlloyGator in slechts 30 minuten zonder speciale gereedschappen
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Onzichtbare bescherming
              </h3>
              <p className="text-gray-600">
                De bescherming is vrijwel onzichtbaar en behoudt de originele uitstraling
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Duurzaam materiaal
              </h3>
              <p className="text-gray-600">
                Hoogwaardige kunststof die bestand is tegen extreme weersomstandigheden
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Gegarandeerde bescherming
              </h3>
              <p className="text-gray-600">
                Beschermt uw velgen tegen schade tot 5cm van de stoeprand
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Onze Producten
            </h2>
            <p className="text-lg text-gray-600">
              Ontdek ons complete assortiment velgbescherming
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-green-100 flex items-center justify-center">
                <span className="text-6xl">🚗</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AlloyGator Sets</h3>
                <p className="text-gray-600 mb-4">
                  Complete sets voor verschillende velgmaten en voertuigtypes
                </p>
                <Link 
                  href="/winkel/alloygator-set"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Bekijk sets
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-blue-100 flex items-center justify-center">
                <span className="text-6xl">🔧</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Montagehulpmiddelen</h3>
                <p className="text-gray-600 mb-4">
                  Professionele gereedschappen voor eenvoudige montage
                </p>
                <Link 
                  href="/winkel/montagehulpmiddelen"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Bekijk gereedschappen
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-orange-100 flex items-center justify-center">
                <span className="text-6xl">🎒</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessoires</h3>
                <p className="text-gray-600 mb-4">
                  Handige accessoires en onderdelen voor uw AlloyGator
                </p>
                <Link 
                  href="/winkel/accessoires"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Bekijk accessoires
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Klaar om uw velgen te beschermen?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Vind een dealer bij u in de buurt of bestel direct online
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/vind-een-dealer"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              Vind een dealer
            </Link>
            <Link 
              href="/winkel"
              className="inline-block bg-white hover:bg-gray-100 text-green-600 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              Online bestellen
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
