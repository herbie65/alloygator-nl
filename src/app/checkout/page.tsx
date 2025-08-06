'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculatePriceWithVat, getVatDisplayText } from '@/lib/vat-utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  vat_category?: string;
  sku?: string;
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

type CheckoutStep = 'customer' | 'shipping' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('customer');
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
  const [loading, setLoading] = useState(false);
  const [dealerGroup, setDealerGroup] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vatCalculation, setVatCalculation] = useState<VatCalculation>({
    vat_rate: 21,
    vat_amount: 0,
    total_amount: 0,
    vat_exempt: false,
    vat_reason: 'Nederlandse BTW (21%)'
  });

  const GROUP_DISCOUNTS: Record<string, number> = { brons: 20, zilver: 30, goud: 40 };

  useEffect(() => {
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

    // Check if user is dealer
    const dealerSession = localStorage.getItem("dealerSession");
    if (dealerSession) {
      const dealerData = JSON.parse(dealerSession);
      setDealerGroup(dealerData.group || null);
    }

    // Calculate initial totals
    calculateTotals();
  }, []);

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = dealerGroup ? (subtotal * GROUP_DISCOUNTS[dealerGroup]) / 100 : 0;
    const discountedSubtotal = subtotal - discount;
    const vatAmount = cart.reduce((sum, item) => {
      const priceWithVat = calculatePriceWithVat(item.price, 21);
      const vatOnItem = priceWithVat - item.price;
      return sum + (vatOnItem * item.quantity);
    }, 0);
    const shippingCost = discountedSubtotal > 50 ? 0 : 4.95;
    const total = discountedSubtotal + vatAmount + shippingCost;

    setVatCalculation({
      vat_rate: 21,
      vat_amount: vatAmount,
      total_amount: total,
      vat_exempt: false,
      vat_reason: 'Nederlandse BTW (21%)'
    });
  };

  const validateStep = (step: CheckoutStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'customer') {
      if (!customer.voornaam) newErrors.voornaam = 'Voornaam is verplicht';
      if (!customer.achternaam) newErrors.achternaam = 'Achternaam is verplicht';
      if (!customer.email) newErrors.email = 'E-mail is verplicht';
      if (!customer.telefoon) newErrors.telefoon = 'Telefoon is verplicht';
      if (!customer.adres) newErrors.adres = 'Adres is verplicht';
      if (!customer.postcode) newErrors.postcode = 'Postcode is verplicht';
      if (!customer.plaats) newErrors.plaats = 'Plaats is verplicht';
    }

    if (step === 'shipping' && customer.separateShippingAddress) {
      if (!customer.shippingAdres) newErrors.shippingAdres = 'Verzendadres is verplicht';
      if (!customer.shippingPostcode) newErrors.shippingPostcode = 'Verzendpostcode is verplicht';
      if (!customer.shippingPlaats) newErrors.shippingPlaats = 'Verzendplaats is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const steps: CheckoutStep[] = ['customer', 'shipping', 'payment', 'review'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const prevStep = () => {
    const steps: CheckoutStep[] = ['customer', 'shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCustomerChange = (field: keyof CustomerDetails, value: string | boolean) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
    calculateTotals();
  };

  const removeItem = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
    calculateTotals();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep('review')) {
      return;
    }

    setLoading(true);

    try {
      // Create order object
      const order = {
        id: Date.now().toString(),
        order_number: `AG${Date.now()}`,
        customer: customer,
        items: cart,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        vat_amount: vatCalculation.vat_amount,
        shipping_cost: vatCalculation.total_amount > 50 ? 0 : 4.95,
        total: vatCalculation.total_amount,
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        dealer_group: dealerGroup
      };

      // Save order to localStorage (for demo purposes)
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));

      // Clear cart
      localStorage.removeItem('alloygator-cart');
      setCart([]);

      // Redirect to order confirmation
      router.push(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setErrors({ submit: 'Er is een fout opgetreden bij het plaatsen van de bestelling.' });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Winkelwagen is leeg</h1>
            <p className="text-lg text-gray-600 mb-8">Je hebt geen producten in je winkelwagen om af te rekenen.</p>
            <Link
              href="/winkel"
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
            >
              Ga naar de winkel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = dealerGroup ? (subtotal * GROUP_DISCOUNTS[dealerGroup]) / 100 : 0;
  const discountedSubtotal = subtotal - discount;
  const shippingCost = discountedSubtotal > 50 ? 0 : 4.95;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {['customer', 'shipping', 'payment', 'review'].map((step, index) => {
              const stepIndex = ['customer', 'shipping', 'payment', 'review'].indexOf(currentStep);
              const isCompleted = index < stepIndex;
              const isCurrent = step === currentStep;
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-600 text-white' :
                    isCurrent ? 'bg-green-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isCurrent ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step === 'customer' && 'Klantgegevens'}
                    {step === 'shipping' && 'Verzending'}
                    {step === 'payment' && 'Betaling'}
                    {step === 'review' && 'Overzicht'}
                  </span>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 ml-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Afrekenen</h1>
              
              <form onSubmit={handleSubmit}>
                {/* Customer Details Step */}
                {currentStep === 'customer' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Klantgegevens</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Voornaam *
                        </label>
                        <input
                          type="text"
                          value={customer.voornaam}
                          onChange={(e) => handleCustomerChange('voornaam', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.voornaam ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.voornaam && (
                          <p className="text-red-500 text-sm mt-1">{errors.voornaam}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Achternaam *
                        </label>
                        <input
                          type="text"
                          value={customer.achternaam}
                          onChange={(e) => handleCustomerChange('achternaam', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.achternaam ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.achternaam && (
                          <p className="text-red-500 text-sm mt-1">{errors.achternaam}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={customer.email}
                          onChange={(e) => handleCustomerChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefoon *
                        </label>
                        <input
                          type="tel"
                          value={customer.telefoon}
                          onChange={(e) => handleCustomerChange('telefoon', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.telefoon ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.telefoon && (
                          <p className="text-red-500 text-sm mt-1">{errors.telefoon}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres *
                      </label>
                      <input
                        type="text"
                        value={customer.adres}
                        onChange={(e) => handleCustomerChange('adres', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.adres ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.adres && (
                        <p className="text-red-500 text-sm mt-1">{errors.adres}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          value={customer.postcode}
                          onChange={(e) => handleCustomerChange('postcode', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.postcode ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.postcode && (
                          <p className="text-red-500 text-sm mt-1">{errors.postcode}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Plaats *
                        </label>
                        <input
                          type="text"
                          value={customer.plaats}
                          onChange={(e) => handleCustomerChange('plaats', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.plaats ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.plaats && (
                          <p className="text-red-500 text-sm mt-1">{errors.plaats}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="separateShipping"
                        checked={customer.separateShippingAddress}
                        onChange={(e) => handleCustomerChange('separateShippingAddress', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="separateShipping" className="text-sm text-gray-700">
                        Ander verzendadres gebruiken
                      </label>
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {currentStep === 'shipping' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Verzendmethode</h2>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">Standaard verzending</h3>
                            <p className="text-sm text-gray-600">2-3 werkdagen</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {customer.separateShippingAddress && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Verzendadres</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Verzendadres
                          </label>
                          <input
                            type="text"
                            value={customer.shippingAdres}
                            onChange={(e) => handleCustomerChange('shippingAdres', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${
                              errors.shippingAdres ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.shippingAdres && (
                            <p className="text-red-500 text-sm mt-1">{errors.shippingAdres}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postcode
                            </label>
                            <input
                              type="text"
                              value={customer.shippingPostcode}
                              onChange={(e) => handleCustomerChange('shippingPostcode', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md ${
                                errors.shippingPostcode ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.shippingPostcode && (
                              <p className="text-red-500 text-sm mt-1">{errors.shippingPostcode}</p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Plaats
                            </label>
                            <input
                              type="text"
                              value={customer.shippingPlaats}
                              onChange={(e) => handleCustomerChange('shippingPlaats', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md ${
                                errors.shippingPlaats ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.shippingPlaats && (
                              <p className="text-red-500 text-sm mt-1">{errors.shippingPlaats}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Betaalmethode</h2>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="ideal"
                              name="paymentMethod"
                              value="ideal"
                              checked={paymentMethod === 'ideal'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="text-green-600"
                            />
                            <label htmlFor="ideal" className="font-medium text-gray-900">
                              iDEAL
                            </label>
                          </div>
                          <div className="text-sm text-gray-600">
                            Direct betalen
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="creditcard"
                              name="paymentMethod"
                              value="creditcard"
                              checked={paymentMethod === 'creditcard'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="text-green-600"
                            />
                            <label htmlFor="creditcard" className="font-medium text-gray-900">
                              Creditcard
                            </label>
                          </div>
                          <div className="text-sm text-gray-600">
                            Visa, Mastercard, American Express
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="banktransfer"
                              name="paymentMethod"
                              value="banktransfer"
                              checked={paymentMethod === 'banktransfer'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="text-green-600"
                            />
                            <label htmlFor="banktransfer" className="font-medium text-gray-900">
                              Bankoverschrijving
                            </label>
                          </div>
                          <div className="text-sm text-gray-600">
                            Binnen 14 dagen betalen
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Review Step */}
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Bestelling controleren</h2>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Klantgegevens</h3>
                        <p className="text-sm text-gray-600">
                          {customer.voornaam} {customer.achternaam}<br />
                          {customer.email}<br />
                          {customer.telefoon}<br />
                          {customer.adres}<br />
                          {customer.postcode} {customer.plaats}
                        </p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Verzendmethode</h3>
                        <p className="text-sm text-gray-600">
                          Standaard verzending (2-3 werkdagen)
                        </p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Betaalmethode</h3>
                        <p className="text-sm text-gray-600">
                          {paymentMethod === 'ideal' && 'iDEAL'}
                          {paymentMethod === 'creditcard' && 'Creditcard'}
                          {paymentMethod === 'banktransfer' && 'Bankoverschrijving'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {currentStep !== 'customer' && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Vorige
                    </button>
                  )}
                  
                  {currentStep !== 'review' ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Volgende
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Bestelling plaatsen...' : 'Bestelling plaatsen'}
                    </button>
                  )}
                </div>

                {errors.submit && (
                  <p className="text-red-500 text-sm mt-4">{errors.submit}</p>
                )}
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Besteloverzicht</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-gray-400 text-lg">🛞</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500">Aantal: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Dealer korting ({GROUP_DISCOUNTS[dealerGroup!]}%)</span>
                    <span>-€{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>BTW (21%)</span>
                  <span>€{vatCalculation.vat_amount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Verzendkosten</span>
                  <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                    {shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Totaal</span>
                    <span>€{vatCalculation.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/cart"
                  className="text-green-600 hover:text-green-700 transition-colors text-sm"
                >
                  Winkelwagen bewerken
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 