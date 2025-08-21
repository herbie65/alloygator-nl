'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface OrderForm {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
  customerPostalCode: string
  customerCountry: string
  paymentMethod: string
  dealerId?: number
}

export default function CheckoutCartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const router = useRouter()

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart)
        setCartItems(items)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }, [])

  const [formData, setFormData] = useState<OrderForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerCity: '',
    customerPostalCode: '',
    customerCountry: 'Nederland',
    paymentMethod: 'ideal'
  })

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const vatAmount = subtotal * 0.21 // 21% BTW
  const shippingCost = subtotal > 50 ? 0 : 5.95 // Gratis verzending boven €50
  const totalAmount = subtotal + vatAmount + shippingCost

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    const updatedCart = cartItems.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
  }

  const removeFromCart = (productId: number) => {
    const updatedCart = cartItems.filter(item => item.id !== productId)
    setCartItems(updatedCart)
    localStorage.setItem('alloygator-cart', JSON.stringify(updatedCart))
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('alloygator-cart')
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } })) } catch {}
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        order_number: `AG${Date.now()}`,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        customer_address: formData.customerAddress,
        customer_city: formData.customerCity,
        customer_postal_code: formData.customerPostalCode,
        customer_country: formData.customerCountry,
        total_amount: totalAmount,
        vat_amount: vatAmount,
        shipping_cost: shippingCost,
        payment_method: formData.paymentMethod,
        dealer_id: formData.dealerId,
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      }

      // Create order in Firebase (simulated for static export)
      const orderNumber = `ORD-${Date.now()}`
      setOrderNumber(orderNumber)
      setOrderSuccess(true)
      clearCart()
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Er is een fout opgetreden bij het plaatsen van je bestelling. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Je winkelwagen is leeg</h2>
          <p className="text-gray-600 mb-6">Voeg producten toe aan je winkelwagen om af te rekenen.</p>
          <button
            onClick={() => router.push('/winkel')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Terug naar winkel
          </button>
        </div>
      </div>
    )
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bestelling geplaatst!</h2>
          <p className="text-gray-600 mb-4">Bedankt voor je bestelling.</p>
          <p className="text-sm text-gray-500 mb-6">Bestelnummer: <span className="font-mono">{orderNumber}</span></p>
          <p className="text-sm text-gray-600 mb-6">
            Je ontvangt een bevestiging per e-mail. We nemen binnen 24 uur contact met je op.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Terug naar home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Afrekenen</h1>
            <p className="text-gray-600">Controleer je bestelling en vul je gegevens in</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestelling ({totalItems} items)</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">€{item.price.toFixed(2)} per stuk</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>BTW:</span>
                  <span>€{vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Verzendkosten:</span>
                  <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Totaal:</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={clearCart}
                className="w-full mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Winkelwagen legen
              </button>
            </div>

            {/* Checkout Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Persoonlijke gegevens</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                  <input
                    type="text"
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plaats *</label>
                    <input
                      type="text"
                      name="customerCity"
                      value={formData.customerCity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                    <input
                      type="text"
                      name="customerPostalCode"
                      value={formData.customerPostalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                  <input
                    type="text"
                    name="customerCountry"
                    value={formData.customerCountry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betaalmethode *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="ideal">iDEAL</option>
                    <option value="banktransfer">Bankoverschrijving</option>
                    <option value="invoice">Factuur</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Bestelling plaatsen...' : `Bestelling plaatsen - €${totalAmount.toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 