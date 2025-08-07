'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const data = await FirebaseService.getProducts()
        console.log('Products from database:', data)
        setProducts(data)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Kon producten niet laden')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          AlloyGator
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welkom bij AlloyGator - uw specialist in velgbescherming.
        </p>

        {/* Database Test Section */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Database Test</h2>
          {loading && <p className="text-blue-600">Laden van producten...</p>}
          {error && <p className="text-red-600">Fout: {error}</p>}
          {!loading && !error && (
            <div>
              <p className="text-green-600 mb-2">✅ Database verbinding werkt!</p>
              <p className="text-sm text-gray-600">
                Aantal producten in database: {products.length}
              </p>
              {products.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Eerste producten:</h3>
                  <ul className="text-sm text-gray-600">
                    {products.slice(0, 3).map((product: any) => (
                      <li key={product.id}>• {product.name || product.title || 'Onbekend product'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <a 
            href="/winkel" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Bekijk onze producten
          </a>
        </div>
      </div>
    </div>
  )
}
