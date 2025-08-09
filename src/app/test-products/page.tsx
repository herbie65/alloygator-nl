'use client'

import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'

interface Product {
  id: string
  name: string
  price: number
  description: string
  [key: string]: any
}

export default function TestProductsPage() {
  const [products, loading, error] = useFirebaseRealtime<Product>('products')

  console.log('TestProductsPage - Products:', products)
  console.log('TestProductsPage - Loading:', loading)
  console.log('TestProductsPage - Error:', error)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Products Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>Error:</strong> {error ? error.message : 'null'}</p>
            <p><strong>Products Count:</strong> {products.length}</p>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2">Loading products...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error.message}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
            
            {products.length === 0 ? (
              <p className="text-gray-500">No products found</p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-gray-600">{product.description}</p>
                    <p className="text-green-600 font-semibold">€{product.price}</p>
                    <p className="text-sm text-gray-500">ID: {product.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
