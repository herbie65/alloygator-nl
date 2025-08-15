'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'
import { useFirebaseRealtime } from '@/hooks/useFirebaseRealtime'
import ProductModal from './ProductModal'
import CSVImport from './CSVImport'
import type { Product } from '@/types/product'


export default function ProductsPage() {
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [products, loading, error] = useFirebaseRealtime<Product>('products', undefined, refreshKey)
  const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCSVImport, setShowCSVImport] = useState(false)

// Debug logging (type‑safe)
const productsArray: any[] = Array.isArray(products) ? (products as unknown as any[]) : []
console.log('ProductsPage - Products:', productsArray)
console.log('ProductsPage - Loading:', loading)
console.log('ProductsPage - Error:', error)
console.log('ProductsPage - Products length:', productsArray.length)
console.log(
  'ProductsPage - Products details:',
  productsArray.map((p: Product) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    // onderstaande velden zijn in sommige datasets aanwezig, maar niet in het type:
    // cast naar any om TS stil te houden en geen .stock te gebruiken
    title: (p as any).title,
    cost_price: (p as any).cost_price,
    stock_quantity: (p as any).stock_quantity,
    // stock NIET loggen (bestaat niet in het Product-type)
  }))
)


  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleDuplicateProduct = async (product: any) => {
    try {
      // Maak een nieuwe id en kopieer velden; reset gevoelige unieke velden
      const nowIso = new Date().toISOString()
      const newProduct: any = {
        ...product,
        // Laat id weg zodat backend een numerieke id toewijst
        id: undefined,
        name: `${product.name || product.title || 'Product'} (kopie)`,
        sku: '',
        ean_code: '',
        created_at: nowIso,
        updated_at: nowIso,
      }
      const created = await FirebaseService.addProduct(newProduct)
      // Open direct in bewerken-modus voor snelle aanpassing met nieuwe numerieke ID
      setEditingProduct(created as Product)
      setSelectedProduct(null)
      setShowProductModal(true)
      // ververse lijst
      setRefreshKey(k => k + 1)
    } catch (e) {
      console.error('Duplicate product error:', e)
      alert('Fout bij dupliceren van product')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        await FirebaseService.deleteProduct(productId)
        // Products will be updated automatically via the real-time listener
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Fout bij het verwijderen van het product')
      }
    }
  }



  const handleCSVImport = async (importedProducts: any[]) => {
    try {
      console.log(`Importing ${importedProducts.length} products from CSV...`)
      
      for (const product of importedProducts) {
        try {
          await FirebaseService.addProduct(product)
          console.log(`Imported product: ${product.name || product.sku}`)
        } catch (error) {
          console.error(`Error importing product ${product.sku}:`, error)
        }
      }
      
      alert(`${importedProducts.length} producten succesvol geïmporteerd!`)
    } catch (error) {
      console.error('CSV import error:', error)
      alert('Fout bij importeren van producten')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Producten Beheren</h1>
          <p className="text-gray-600">Beheer uw productcatalogus</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setSelectedProduct(null)
              setEditingProduct(null)
              setShowProductModal(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            + Nieuw Product
          </button>
                    <button 
            onClick={() => setShowCSVImport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            📁 CSV Import
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Laden van producten...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Producten ({productsArray.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kostprijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voorraad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    EAN Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productsArray.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Geen producten gevonden</h3>
                        <p className="text-sm text-gray-500 mb-4">Er zijn nog geen producten toegevoegd aan de database.</p>
                        <button 
                          onClick={() => window.location.href = '/winkel'}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Ga naar winkel om producten te laden
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : productsArray.map((product: any, index: number) => (
                  <tr key={`${product.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          📦
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name || product.title || product.id || 'Onbekend product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category || 'Algemeen'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{(product.price || product.cost_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{(product.cost_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (product.stock_quantity || product.stock || 0) > 10 
                          ? 'bg-green-100 text-green-800' 
                          : (product.stock_quantity || product.stock || 0) > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock_quantity || product.stock || 0} stuks
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || 'Geen SKU'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.ean_code || 'Geen EAN'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewProduct(product)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Bekijken
                      </button>
                      <button 
                        onClick={() => handleEditProduct(product)}
                       className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => handleDuplicateProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Dupliceren
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Verwijderen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductModal
        product={selectedProduct || editingProduct}
        isEditing={!!editingProduct}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false)
          setSelectedProduct(null)
          setEditingProduct(null)
          // force reload list after closing (e.g., after save)
          setRefreshKey(k => k + 1)
        }}
        onSave={async (productData) => {
          try {
            if (editingProduct) {
              await FirebaseService.updateProduct(productData.id, productData)
            } else {
              await FirebaseService.addProduct(productData)
            }
            setRefreshKey(k => k + 1)
          } catch (error) {
            console.error('Error saving product:', error)
            alert('Fout bij opslaan van product')
          }
        }}
      />

      <CSVImport
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleCSVImport}
      />
    </div>
  )
}
