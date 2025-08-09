'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'

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

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  carrier: string;
  delivery_type: string;
}

interface PickupLocation {
  location_name: string;
  location_code: string;
  address: {
    street: string;
    number: string;
    postal_code: string;
    city: string;
    country: string;
  };
  opening_hours: any[];
  distance?: number;
}

interface Settings {
  shippingMethods: ShippingMethod[];
  shippingCost: string;
  freeShippingThreshold: string;
  enabledCarriers: string[];
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
    land: "NL",
    bedrijfsnaam: "",
    factuurEmail: "",
    btwVerified: false,
    btwReverseCharge: false,
    separateShippingAddress: false,
    shippingAdres: "",
    shippingPostcode: "",
    shippingPlaats: "",
    shippingLand: "NL",
  });

  const [paymentMethod, setPaymentMethod] = useState("ideal");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<{ id:string; name:string; mollie_id:string; is_active:boolean; fee_percent:number }[]>([])
  const [allowInvoicePayment, setAllowInvoicePayment] = useState(false)
  const [shippingMethod, setShippingMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [dealerGroup, setDealerGroup] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Settings>({
    shippingMethods: [],
    shippingCost: '8.95',
    freeShippingThreshold: '50.00',
    enabledCarriers: ['dhl']
  });

  const [vatCalculation, setVatCalculation] = useState<VatCalculation>({
    vat_rate: 21,
    vat_amount: 0,
    total_amount: 0,
    vat_exempt: false,
    vat_reason: 'Nederlandse BTW (21%)'
  });

  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<PickupLocation | null>(null)
  const [showPickupLocations, setShowPickupLocations] = useState(false)

  const GROUP_DISCOUNTS = {
    'bronze': 5,
    'silver': 10,
    'gold': 15,
    'platinum': 20
  }

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

    // Load settings
    loadSettings();

    // Load payment methods
    loadPaymentMethods();

    // Calculate initial totals
    calculateTotals();
  }, []);

  // Check invoice permission when email changes
  useEffect(() => {
    const checkInvoicePermission = async () => {
      try {
        const email = (customer.email || '').trim().toLowerCase()
        if (!email) {
          setAllowInvoicePayment(false)
          return
        }
        const customers = await FirebaseClientService.getCustomersByEmail(email)
        const match = Array.isArray(customers) && customers.length > 0 ? customers[0] as any : null
        const allowed = !!match?.allow_invoice_payment
        setAllowInvoicePayment(allowed)
        if (allowed && match?.invoice_payment_terms_days) {
          // Store per-order terms for invoice selection
          // We'll send this when creating the order
          setCustomer(prev => ({ ...prev, factuurEmail: prev.factuurEmail || email }))
        }
        // If not allowed but currently selected is invoice, switch to first available non-invoice
        if (!allowed && paymentMethod === 'invoice') {
          const first = availablePaymentMethods.find(pm => pm.is_active && pm.mollie_id !== 'invoice')
          if (first) setPaymentMethod(first.mollie_id)
        }
      } catch (e) {
        setAllowInvoicePayment(false)
      }
    }
    checkInvoicePermission()
  }, [customer.email])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data && data.length > 0) {
        const savedSettings = data[0];
        
        setSettings(prev => ({
          ...prev,
          ...savedSettings
        }));
        
        // Select the first available shipping method
        const availableMethods = savedSettings.shippingMethods?.filter(
          method => method.enabled && savedSettings.enabledCarriers?.includes(method.carrier)
        ) || [];
        
        if (availableMethods.length > 0 && !shippingMethod) {
          setShippingMethod(availableMethods[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      if (!res.ok) return
      const list = await res.json()
      const active = (Array.isArray(list) ? list : []).filter((m:any)=>m.is_active)
      setAvailablePaymentMethods(active)
      if (active.length > 0) setPaymentMethod(active[0].mollie_id || 'ideal')
    } catch {}
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = dealerGroup ? (subtotal * GROUP_DISCOUNTS[dealerGroup]) / 100 : 0;
    const discountedSubtotal = subtotal - discount;
    
    // Calculate VAT
    const vatAmount = discountedSubtotal * 0.21; // 21% BTW
    
    // Get selected shipping method and its price
    const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
    let shippingCost = 0;
    
    if (selectedMethod) {
      shippingCost = selectedMethod.price;
    } else {
      // Fallback to default shipping cost if no method selected
      shippingCost = parseFloat(settings.shippingCost) || 0;
    }
    
    // Check if free shipping applies
    const finalShippingCost = discountedSubtotal >= parseFloat(settings.freeShippingThreshold) ? 0 : shippingCost;
    
    // Payment fee/discount by selected method (% on discountedSubtotal)
    const currentPm = availablePaymentMethods.find(m => m.mollie_id === paymentMethod)
    const feePercent = currentPm ? Number(currentPm.fee_percent || 0) : 0
    const paymentFee = paymentMethod === 'invoice' ? 0 : (discountedSubtotal * feePercent) / 100

    const total = discountedSubtotal + vatAmount + finalShippingCost + paymentFee;

    setVatCalculation({
      vat_rate: 21,
      vat_amount: vatAmount,
      total_amount: total,
      vat_exempt: false,
      vat_reason: 'Nederlandse BTW (21%)'
    });
  };

  // Recalculate totals when shipping method changes
  useEffect(() => {
    calculateTotals();
  }, [shippingMethod, cart, dealerGroup, settings]);

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

    // Validate pickup location if pickup method is selected
    if (step === 'shipping') {
      const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
      if (selectedMethod?.delivery_type === 'pickup' && !selectedPickupLocation) {
        newErrors.pickupLocation = 'Selecteer een afhaalpunt';
      }
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

  const handleShippingMethodChange = (methodId: string) => {
    setShippingMethod(methodId);
    setSelectedPickupLocation(null);
    setShowPickupLocations(false);
    
    // Clear pickup location error
    if (errors.pickupLocation) {
      setErrors(prev => ({ ...prev, pickupLocation: '' }));
    }
  };

  const loadPickupLocations = async () => {
    try {
      const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
      if (!selectedMethod || selectedMethod.delivery_type !== 'pickup') return;

      const postalCode = customer.separateShippingAddress ? customer.shippingPostcode : customer.postcode;
      if (!postalCode) {
        alert('Vul eerst een postcode in om afhaalpunten te laden.');
        return;
      }

      // Show loading state
      setPickupLocations([]);
      setShowPickupLocations(true);

      console.log(`Loading pickup locations for ${selectedMethod.carrier} in ${postalCode}`);

      const response = await fetch(
        `/api/dhl/pickup-locations?postal_code=${postalCode}&country=NL`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          console.log(`Found ${data.data.length} pickup locations`);
          setPickupLocations(data.data);
        } else {
          alert(`Geen afhaalpunten gevonden voor ${selectedMethod.carrier} in postcode ${postalCode}. Probeer een andere postcode of kies een andere verzendmethode.`);
          setShowPickupLocations(false);
        }
      } else {
        const errorData = await response.json();
        console.error('Error loading pickup locations:', errorData);
        
        let errorMessage = 'Onbekende fout bij het laden van afhaalpunten.';
        
        if (errorData.error === 'DHL settings not configured') {
          errorMessage = 'DHL API is niet geconfigureerd. Neem contact op met de beheerder.';
        } else if (errorData.error === 'DHL carrier not enabled') {
          errorMessage = 'DHL is niet ingeschakeld. Kies een andere verzendmethode.';
        } else if (errorData.details) {
          if (errorData.details.includes('DHL API key is invalid or expired')) {
            errorMessage = 'DHL API key is ongeldig of verlopen. Controleer de instellingen.';
          } else if (errorData.details.includes('DHL API access denied')) {
            errorMessage = 'Toegang tot DHL API geweigerd. Controleer of je API key voldoende rechten heeft.';
          } else if (errorData.details.includes('No pickup locations found')) {
            errorMessage = `Geen afhaalpunten gevonden voor ${selectedMethod.carrier} in postcode ${postalCode}. Probeer een andere postcode.`;
          } else {
            errorMessage = `Fout bij het laden van afhaalpunten: ${errorData.details}`;
          }
        } else {
          errorMessage = `Fout bij het laden van afhaalpunten: ${errorData.error || 'Onbekende fout'}`;
        }
        
        alert(errorMessage);
        setShowPickupLocations(false);
      }
    } catch (error) {
      console.error('Error loading pickup locations:', error);
      alert('Er is een fout opgetreden bij het laden van afhaalpunten. Controleer je internetverbinding en probeer het opnieuw.');
      setShowPickupLocations(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    try {
      const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
      setLoading(true)

      const order = {
        customer: customer,
        items: cart,
        shipping_method: selectedMethod?.name || 'Standaard verzending',
        shipping_cost: selectedMethod?.price || parseFloat(settings.shippingCost),
        shipping_carrier: selectedMethod?.carrier || 'postnl',
        shipping_delivery_type: selectedMethod?.delivery_type || 'standard',
        pickup_location: selectedPickupLocation,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        vat_amount: vatCalculation.vat_amount,
        total: vatCalculation.total_amount,
        dealer_group: dealerGroup,
        dealer_discount: dealerGroup ? GROUP_DISCOUNTS[dealerGroup] : 0,
        created_at: new Date().toISOString(),
        status: 'pending',
        payment_status: 'open',
        payment_method: paymentMethod,
        payment_terms_days: paymentMethod === 'invoice' ? 14 : undefined
      };

      // 1) Create order in backend
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
      if (!orderRes.ok) throw new Error('Failed to create order')
      const { orderId, orderNumber } = await orderRes.json()

      // 2) If paymentMethod is invoice (op rekening), skip Mollie and mark as pending
      if (paymentMethod === 'invoice') {
        // Update order with payment method and pending status
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: orderId, payment_method: 'invoice', payment_status: 'pending', status: 'pending' })
        }).catch(()=>{})

        localStorage.removeItem("alloygator-cart");
        setCart([]);
        window.location.href = `/order-confirmation/${orderId}`;
        return
      }

      // 2) Create Mollie payment for the order
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      const returnUrl = `${window.location.origin}/payment/return?orderId=${orderId}${isLocalhost ? '&simulate=1' : ''}`
      const webhookUrl = `${window.location.origin}/api/payment/mollie/webhook`

      const paymentRes = await fetch('/api/payment/mollie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total,
          currency: 'EUR',
          description: `Order ${orderNumber}`,
          redirectUrl: returnUrl, // bevat simulate=1 op localhost
          webhookUrl,
          metadata: { orderId },
          methods: availablePaymentMethods.filter(pm => pm.is_active).map(pm => pm.mollie_id)
        })
      })
      if (!paymentRes.ok) {
        const err = await paymentRes.json().catch(()=>({}))
        console.error('Create payment failed:', err)
        throw new Error('Failed to create payment')
      }
      const payment = await paymentRes.json()

      // 3) Redirect to Mollie checkout
      window.location.href = payment.checkoutUrl
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Er is een fout opgetreden bij het plaatsen van je bestelling. Probeer het opnieuw.');
    } finally {
      setLoading(false)
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
  const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
  const shippingCost = selectedMethod ? selectedMethod.price : parseFloat(settings.shippingCost);
  const finalShippingCost = discountedSubtotal >= parseFloat(settings.freeShippingThreshold) ? 0 : shippingCost;

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
                      {settings.shippingMethods
                        .filter(method => method.enabled && settings.enabledCarriers.includes(method.carrier))
                        .map((method) => {
                          // Calculate if this method would be free
                          const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                          const discount = dealerGroup ? (subtotal * GROUP_DISCOUNTS[dealerGroup]) / 100 : 0;
                          const discountedSubtotal = subtotal - discount;
                          const isFree = discountedSubtotal >= parseFloat(settings.freeShippingThreshold);
                          
                          return (
                            <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    id={method.id}
                                    name="shippingMethod"
                                    value={method.id}
                                    checked={shippingMethod === method.id}
                                    onChange={(e) => handleShippingMethodChange(e.target.value)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                  />
                                  <div>
                                    <label htmlFor={method.id} className="font-medium text-gray-900 cursor-pointer">
                                      {method.name}
                                    </label>
                                    <p className="text-sm text-gray-600">{method.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">
                                    {isFree ? 'Gratis' : `€${method.price.toFixed(2)}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Pickup Location Selection */}
                    {(() => {
                      const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
                      return selectedMethod?.delivery_type === 'pickup' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Afhaalpunt Selecteren</h3>
                            <button
                              type="button"
                              onClick={loadPickupLocations}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Afhaalpunten Laden
                            </button>
                          </div>

                          {showPickupLocations && (
                            <div className="space-y-3">
                              {pickupLocations.length > 0 ? (
                                pickupLocations.map((location, index) => (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="radio"
                                        id={`pickup-${index}`}
                                        name="pickupLocation"
                                        checked={selectedPickupLocation?.location_code === location.location_code}
                                        onChange={() => setSelectedPickupLocation(location)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                      />
                                      <div className="flex-1">
                                        <label htmlFor={`pickup-${index}`} className="font-medium text-gray-900 cursor-pointer">
                                          {location.location_name}
                                        </label>
                                        <p className="text-sm text-gray-600">
                                          {location.address.street} {location.address.number}, {location.address.postal_code} {location.address.city}
                                        </p>
                                        {location.distance && (
                                          <p className="text-xs text-gray-500">
                                            Afstand: {location.distance}km
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">Geen afhaalpunten gevonden voor deze postcode.</p>
                              )}
                            </div>
                          )}

                          {errors.pickupLocation && (
                            <p className="text-red-500 text-sm">{errors.pickupLocation}</p>
                          )}
                        </div>
                      );
                    })()}

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
                      {availablePaymentMethods.length === 0 && (
                        <div className="text-sm text-gray-600">Geen betaalmethodes geconfigureerd. Standaard: iDEAL.</div>
                      )}
                      {availablePaymentMethods
                        .filter(pm => pm.mollie_id !== 'invoice' || allowInvoicePayment)
                        .map((pm) => (
                        <div key={pm.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id={`pm-${pm.id}`}
                                name="paymentMethod"
                                value={pm.mollie_id}
                                checked={paymentMethod === pm.mollie_id}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                              />
                              <div>
                                <label htmlFor={`pm-${pm.id}`} className="font-medium text-gray-900 cursor-pointer">
                                  {pm.name}
                                </label>
                                <p className="text-sm text-gray-600">{pm.fee_percent ? `${pm.fee_percent > 0 ? '+' : ''}${pm.fee_percent}%` : 'Geen toeslag/korting'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!allowInvoicePayment && availablePaymentMethods.some(pm => pm.mollie_id === 'invoice') && (
                        <div className="text-xs text-gray-500">Op rekening is niet beschikbaar voor dit e-mailadres.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review Step */}
                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Bestelling Overzicht</h2>
                    
                    <div className="space-y-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Producten</h3>
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Klantgegevens</h3>
                        <p className="text-sm text-gray-600">
                          {customer.voornaam} {customer.achternaam}<br />
                          {customer.email}<br />
                          {customer.telefoon}<br />
                          {customer.adres}<br />
                          {customer.postcode} {customer.plaats}
                        </p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Verzending</h3>
                        <p className="text-sm text-gray-600">
                          {selectedMethod ? selectedMethod.name : 'Standaard verzending'}
                        </p>
                        {selectedPickupLocation && (
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-900">Afhaalpunt:</p>
                            <p className="text-sm text-gray-600">
                              {selectedPickupLocation.location_name}<br />
                              {selectedPickupLocation.address.street} {selectedPickupLocation.address.number}<br />
                              {selectedPickupLocation.address.postal_code} {selectedPickupLocation.address.city}
                            </p>
                          </div>
                        )}
                        {customer.separateShippingAddress && (
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-900">Verzendadres:</p>
                            <p className="text-sm text-gray-600">
                              {customer.shippingAdres}<br />
                              {customer.shippingPostcode} {customer.shippingPlaats}
                            </p>
                          </div>
                        )}
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
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Bestelling plaatsen...' : 'Bestelling plaatsen'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Besteloverzicht</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        🛞
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Aantal: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Korting ({dealerGroup}):</span>
                    <span>-€{discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>BTW (21%):</span>
                  <span>€{vatCalculation.vat_amount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Verzendkosten:</span>
                  <span>{finalShippingCost === 0 ? 'Gratis' : `€${finalShippingCost.toFixed(2)}`}</span>
                </div>
                
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Totaal:</span>
                  <span>€{vatCalculation.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/cart"
                className="block text-center mt-4 text-green-600 hover:text-green-700 text-sm"
              >
                Winkelwagen bewerken
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 