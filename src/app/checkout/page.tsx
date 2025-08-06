'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vat_category?: string;
}

interface CustomerDetails {
  voornaam: string;
  achternaam: string;
  email: string;
  telefoon: string;
  adres: string;
  postcode: string;
  plaats: string;
  land: string;
  btwNummer?: string;
  bedrijfsnaam?: string;
  factuurEmail?: string;
  btwVerified?: boolean;
  btwReverseCharge?: boolean;
  separateShippingAddress?: boolean;
  shippingAdres?: string;
  shippingPostcode?: string;
  shippingPlaats?: string;
  shippingLand?: string;
}

interface VatCalculation {
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  vat_exempt: boolean;
  vat_reason: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<CustomerDetails>({
    voornaam: "",
    achternaam: "",
    email: "",
    telefoon: "",
    adres: "",
    postcode: "",
    plaats: "",
    land: "Nederland",
    bedrijfsnaam: "",
    factuurEmail: "",
    btwVerified: false,
    btwReverseCharge: false,
    separateShippingAddress: false,
    shippingAdres: "",
    shippingPostcode: "",
    shippingPlaats: "",
    shippingLand: "Nederland",
  });

  const [paymentMethod, setPaymentMethod] = useState("ideal");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['ideal', 'creditcard', 'banktransfer']);
  const [loading, setLoading] = useState(false);
  const [dealerGroup, setDealerGroup] = useState<string | null>(null);
  const [vatCalculation, setVatCalculation] = useState<VatCalculation>({
    vat_rate: 21,
    vat_amount: 0,
    total_amount: 0,
    vat_exempt: false,
    vat_reason: 'Nederlandse BTW (21%)'
  });

  const GROUP_DISCOUNTS: Record<string, number> = { brons: 20, zilver: 30, goud: 40 };

  useEffect(() => {
    console.log('Checkout page useEffect triggered');
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem("alloygator-cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load customer details from localStorage
    const savedCustomer = localStorage.getItem("customerDetails");
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }

    // Fetch shipping and payment methods with delay to ensure localStorage is ready
    setTimeout(() => {
      console.log('Loading methods after delay...');
      fetchShippingMethods();
      fetchPaymentMethods();
    }, 100);
  }, []);

  const fetchShippingMethods = async () => {
    try {
      console.log('Loading shipping methods from localStorage...');
      const savedShippingSettings = localStorage.getItem('shippingSettings')
      if (savedShippingSettings) {
        const settings = JSON.parse(savedShippingSettings)
        console.log('Raw shipping settings from localStorage:', settings)
        if (settings.methods && Array.isArray(settings.methods)) {
          // Transform the data structure to match what the checkout expects
          const transformedMethods = settings.methods.map((method: any) => ({
            method_name: method.method_name,
            display_name: method.display_name,
            cost: method.cost
          }))
          setShippingMethods(transformedMethods)
          console.log('Transformed shipping methods:', transformedMethods)
        } else {
          // Fallback to default methods
          setShippingMethods([
            { method_name: 'standard', display_name: 'Standaard Verzending', cost: 5.95 },
            { method_name: 'express', display_name: 'Express Verzending', cost: 9.95 },
            { method_name: 'free', display_name: 'Gratis Verzending', cost: 0 },
            { method_name: 'pickup', display_name: 'Afhalen bij Dealer', cost: 0 }
          ])
        }
      } else {
        // Fallback to default methods
        setShippingMethods([
          { method_name: 'standard', display_name: 'Standaard Verzending', cost: 5.95 },
          { method_name: 'express', display_name: 'Express Verzending', cost: 9.95 },
          { method_name: 'free', display_name: 'Gratis Verzending', cost: 0 },
          { method_name: 'pickup', display_name: 'Afhalen bij Dealer', cost: 0 }
        ])
      }
    } catch (error) {
      console.error('Error loading shipping methods:', error)
      // Fallback to default methods
      setShippingMethods([
        { method_name: 'standard', display_name: 'Standaard Verzending', cost: 5.95 },
        { method_name: 'express', display_name: 'Express Verzending', cost: 9.95 },
        { method_name: 'free', display_name: 'Gratis Verzending', cost: 0 },
        { method_name: 'pickup', display_name: 'Afhalen bij Dealer', cost: 0 }
      ])
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      console.log('Loading payment methods from localStorage...');
      const savedPaymentSettings = localStorage.getItem('paymentSettings')
      if (savedPaymentSettings) {
        const settings = JSON.parse(savedPaymentSettings)
        console.log('Raw payment settings from localStorage:', settings)
        if (settings.supported_methods) {
          try {
            // Handle both JSON string and array formats
            let methods
            if (typeof settings.supported_methods === 'string') {
              methods = JSON.parse(settings.supported_methods)
            } else if (Array.isArray(settings.supported_methods)) {
              methods = settings.supported_methods
            } else {
              // Split comma-separated string
              methods = settings.supported_methods.split(',').map((m: string) => m.trim())
            }
            setPaymentMethods(methods)
            console.log('Payment methods loaded:', methods)
          } catch (parseError) {
            console.error('Error parsing payment methods:', parseError)
            // Fallback to default methods
            setPaymentMethods(['ideal', 'creditcard', 'banktransfer'])
          }
        } else {
          // Fallback to default methods
          setPaymentMethods(['ideal', 'creditcard', 'banktransfer'])
        }
      } else {
        // Fallback to default methods
        setPaymentMethods(['ideal', 'creditcard', 'banktransfer'])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Fallback to default methods
      setPaymentMethods(['ideal', 'creditcard', 'banktransfer'])
    }
  };

  useEffect(() => {
    if (cart.length > 0) {
      calculateVat();
    }
  }, [cart, customer.land, customer.btwNummer, customer.btwReverseCharge]);

  const subtotal = cart.reduce((sum, item) => {
    const discount = dealerGroup ? GROUP_DISCOUNTS[dealerGroup] : 0;
    const price = dealerGroup ? (item.price || 0) * (1 - discount / 100) : (item.price || 0);
    return sum + (price * (item.quantity || 0));
  }, 0);

  const selectedShippingMethod = shippingMethods.find(method => method.method_name === shippingMethod);
  const shippingCost = selectedShippingMethod ? (selectedShippingMethod.cost || 0) : 0;
  const total = subtotal + shippingCost + (vatCalculation.vat_amount || 0);

  const calculateVat = async () => {
    try {
      // Simple VAT calculation for now
      const vatRate = 21; // Default Dutch VAT rate
      const vatAmount = subtotal * (vatRate / 100);
      
      setVatCalculation({
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: subtotal + vatAmount,
        vat_exempt: false,
        vat_reason: 'Nederlandse BTW (21%)'
      });
    } catch (error) {
      console.error("VAT calculation error:", error);
    }
  };

  const handleCustomerChange = (field: keyof CustomerDetails, value: string | boolean) => {
    const updatedCustomer = { ...customer, [field]: value };
    setCustomer(updatedCustomer);
    localStorage.setItem("customerDetails", JSON.stringify(updatedCustomer));
  };

  const handleVatVerification = async () => {
    if (!customer.btwNummer) return;
    
    try {
      // Simulate VAT verification for static export
      setCustomer(prev => ({
        ...prev,
        btwVerified: true,
        btwReverseCharge: true
      }));
      alert('BTW nummer geverifieerd! (Demo)');
    } catch (error) {
      console.error('VAT verification error:', error);
      alert('Fout bij BTW verificatie');
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      const updatedCart = cart.filter(item => item.id !== id);
      setCart(updatedCart);
      localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
    } else {
      const updatedCart = cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customer,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: dealerGroup ? item.price * (1 - GROUP_DISCOUNTS[dealerGroup] / 100) : item.price,
          quantity: item.quantity,
          originalPrice: item.price,
          vat_category: item.vat_category
        })),
        subtotal,
        shippingCost,
        vat_amount: vatCalculation.vat_amount,
        vat_rate: vatCalculation.vat_rate,
        vat_exempt: vatCalculation.vat_exempt,
        vat_reason: vatCalculation.vat_reason,
        total,
        paymentMethod,
        shippingMethod,
        dealerGroup,
        status: "nieuw",
        order_number: `ORD-${Date.now()}`,
        created_at: new Date().toISOString()
      };

      // Create order for static export (simulated)
      const orderNumber = `ORD-${Date.now()}`;
      console.log('Order created:', orderNumber);

      // Save order data to localStorage
      const orderDataToSave = {
        ...orderData,
        id: orderNumber,
        order_number: orderNumber,
        created_at: new Date().toISOString()
      };
      
      // Save to localStorage
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      savedOrders.push(orderDataToSave);
      localStorage.setItem('orders', JSON.stringify(savedOrders));
      
      console.log('Order saved to localStorage:', orderDataToSave);

      // Clear cart
      localStorage.removeItem("alloygator-cart");
      setCart([]);
      
      // Redirect to order confirmation
      router.push(`/order-confirmation/${orderNumber}`);
    } catch (error) {
      console.error("Order error:", error);
      alert("Er is een fout opgetreden bij het plaatsen van je bestelling.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Winkelwagen is leeg</h1>
            <p className="text-lg text-gray-600 mb-8">Je hebt nog geen producten in je winkelwagen.</p>
            <button 
              onClick={() => router.push('/winkel')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Ga naar de winkel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Afrekenen</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Klantgegevens</h2>
            
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam *</label>
                  <input
                    type="text"
                    value={customer.voornaam}
                    onChange={(e) => handleCustomerChange('voornaam', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Achternaam *</label>
                  <input
                    type="text"
                    value={customer.achternaam}
                    onChange={(e) => handleCustomerChange('achternaam', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => handleCustomerChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon *</label>
                <input
                  type="tel"
                  value={customer.telefoon}
                  onChange={(e) => handleCustomerChange('telefoon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                <input
                  type="text"
                  value={customer.adres}
                  onChange={(e) => handleCustomerChange('adres', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                  <input
                    type="text"
                    value={customer.postcode}
                    onChange={(e) => handleCustomerChange('postcode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plaats *</label>
                  <input
                    type="text"
                    value={customer.plaats}
                    onChange={(e) => handleCustomerChange('plaats', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BTW Nummer</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customer.btwNummer || ''}
                    onChange={(e) => handleCustomerChange('btwNummer', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="NL123456789B01"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVatVerification();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVatVerification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Verifiëren
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bestelling</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {(cart || []).map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Method */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Verzendmethode</h3>
              <div className="space-y-2">
                {(shippingMethods || []).map((method) => (
                  <label key={method.method_name} className="flex items-center">
                    <input
                      type="radio"
                      name="shipping"
                      value={method.method_name}
                      checked={shippingMethod === method.method_name}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {method.display_name} - €{method.cost.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Betaalmethode</h3>
              <div className="space-y-2">
                {(paymentMethods || []).map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Subtotaal:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Verzending:</span>
                <span>€{shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>BTW:</span>
                <span>€{vatCalculation.vat_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg text-gray-900">
                <span>Totaal:</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Bestelling plaatsen...' : 'Bestelling plaatsen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 