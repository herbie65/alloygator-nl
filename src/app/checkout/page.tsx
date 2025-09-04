'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FirebaseClientService } from '@/lib/firebase-client'
import { useDealerPricing, applyDealerDiscount, getDealerGroupLabel } from '@/hooks/useDealerPricing'
import MollieCreditCard from '@/app/components/MollieCreditCard'
import MollieIDEAL from '@/app/components/MollieIDEAL'

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
  contact_first_name: string;
  contact_last_name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  vat_number?: string;
  company_name?: string;
  invoice_email?: string;
  vat_verified?: boolean;
  vat_reverse_charge?: boolean;
  separate_shipping_address?: boolean;
  shipping_address?: string;
  shipping_postal_code?: string;
  shipping_city?: string;
  shipping_country?: string;
  customer_since?: string;
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
  // VAT rates (from settings)
  defaultVatRate?: number;
  vatHighRate?: number;
  vatLowRate?: number;
  vatZeroRate?: number;
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
    contact_first_name: "",
    contact_last_name: "",
    email: "",
    phone: "",
    address: "",
    postal_code: "",
    city: "",
    country: "NL",
    company_name: "",
    invoice_email: "",
    vat_verified: false,
    vat_reverse_charge: false,
    separate_shipping_address: false,
    shipping_address: "",
    shipping_postal_code: "",
    shipping_city: "",
    shipping_country: "NL",
  });
  const [createAccount, setCreateAccount] = useState(false)
  const [accountPassword, setAccountPassword] = useState('')
  const [accountPassword2, setAccountPassword2] = useState('')
  const [paymentMethod, setPaymentMethod] = useState("ideal");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<{ id:string; name:string; mollie_id:string; is_active:boolean; fee_percent:number }[]>([])
  const [allowInvoicePayment, setAllowInvoicePayment] = useState(false)
  const [creditCardToken, setCreditCardToken] = useState<string | null>(null);
  const [selectedIDEALBank, setSelectedIDEALBank] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const dealer = useDealerPricing()
  const [dealerGroup, setDealerGroup] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Settings>({
    shippingMethods: [],
    shippingCost: '8.95',
    freeShippingThreshold: '300.00',
    enabledCarriers: ['dhl']
  });

  const [vatSettings, setVatSettings] = useState<any[]>([])

  const [vatCalculation, setVatCalculation] = useState<VatCalculation>({
    vat_rate: 0,
    vat_amount: 0,
    total_amount: 0,
    vat_exempt: false,
    vat_reason: ''
  });
  
  // BTW functies voor database-gebaseerde BTW berekening
  const getVatRate = (vatCategory: string = 'standard'): number => {
    if (!vatSettings || vatSettings.length === 0) {
      console.warn('BTW instellingen niet geladen in checkout, gebruik standaard 21%')
      return 21 // Standaard BTW rate als database niet geladen is
    }
    
    const vatSetting = vatSettings.find(v => v.country_code === 'NL')
    if (!vatSetting) {
      console.warn('BTW instellingen voor Nederland niet gevonden in checkout, gebruik standaard 21%')
      return 21 // Standaard BTW rate als Nederland niet gevonden is
    }
    
    // Gebruik de juiste BTW rate op basis van categorie
    if (vatCategory === 'reduced') {
      if (!vatSetting.reduced_rate) {
        console.warn('Verlaagde BTW rate niet gevonden in database, gebruik standaard 21%')
        return 21 // Fallback naar standaard rate
      }
      return vatSetting.reduced_rate
    } else if (vatCategory === 'zero') {
      if (!vatSetting.zero_rate) {
        console.warn('Nul BTW rate niet gevonden in database, gebruik 0%')
        return 0 // Logische fallback voor zero BTW
      }
      return vatSetting.zero_rate
    } else {
      if (!vatSetting.standard_rate) {
        console.warn('Standaard BTW rate niet gevonden in database, gebruik standaard 21%')
        return 21 // Standaard BTW rate als fallback
      }
      return vatSetting.standard_rate
    }
  }
  
  const getPriceIncludingVat = (basePrice: number, vatCategory: string = 'standard'): number => {
    const vatRate = getVatRate(vatCategory)
    const priceIncludingVat = basePrice * (1 + vatRate / 100)
    return Math.round(priceIncludingVat * 100) / 100
  }
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<PickupLocation | null>(null)
  const [showPickupLocations, setShowPickupLocations] = useState(false)
  const [isResolvingPostcode, setIsResolvingPostcode] = useState(false)
  
  // State voor order totalen
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    shippingCost: 0,
    total: 0,
    vatAmount: 0
  })

  // Country list (Dutch names), NL & BE will be shown on top
  const OTHER_COUNTRIES: { code: string; name: string }[] = [
    { code: 'AT', name: 'Oostenrijk' },
    { code: 'BG', name: 'Bulgarije' },
    { code: 'HR', name: 'Kroatië' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'CZ', name: 'Tsjechië' },
    { code: 'DK', name: 'Denemarken' },
    { code: 'EE', name: 'Estland' },
    { code: 'FI', name: 'Finland' },
    { code: 'FR', name: 'Frankrijk' },
    { code: 'DE', name: 'Duitsland' },
    { code: 'GR', name: 'Griekenland' },
    { code: 'HU', name: 'Hongarije' },
    { code: 'IE', name: 'Ierland' },
    { code: 'IT', name: 'Italië' },
    { code: 'LV', name: 'Letland' },
    { code: 'LT', name: 'Litouwen' },
    { code: 'LU', name: 'Luxemburg' },
    { code: 'MT', name: 'Malta' },
    { code: 'PL', name: 'Polen' },
    { code: 'PT', name: 'Portugal' },
    { code: 'RO', name: 'Roemenië' },
    { code: 'SK', name: 'Slowakije' },
    { code: 'SI', name: 'Slovenië' },
    { code: 'ES', name: 'Spanje' },
    { code: 'SE', name: 'Zweden' },
    { code: 'GB', name: 'Verenigd Koninkrijk' },
    { code: 'NO', name: 'Noorwegen' },
    { code: 'CH', name: 'Zwitserland' },
    { code: 'IS', name: 'IJsland' },
    { code: 'LI', name: 'Liechtenstein' },
    { code: 'US', name: 'Verenigde Staten' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australië' },
    { code: 'NZ', name: 'Nieuw-Zeeland' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'nl'))

  const getDiscountedPrice = (price: number, vatCategory: string = 'standard') => {
    if (dealer.isDealer && dealer.discountPercent > 0) {
      // Voor dealers: GEEN korting toepassen - item.price bevat al de dealer korting
      // Dit voorkomt dubbele korting
      return price;
    } else {
      // Voor particuliere klanten: geen korting
      return price;
    }
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

    // Prefill from logged-in user session if available
    try {
      const sessionStr = localStorage.getItem('currentUser')
      if (sessionStr) {
        const u = JSON.parse(sessionStr)
        setCustomer(prev => ({
          ...prev,
          contact_first_name: prev.contact_first_name || u.contact_first_name || u.name || '',
          contact_last_name: prev.contact_last_name || u.contact_last_name || '',
          email: prev.email || u.email || '',
          phone: prev.phone || u.phone || u.telefoon || '',
          address: prev.address || u.address || u.adres || '',
          postal_code: prev.postal_code || u.postal_code || u.postcode || '',
          city: prev.city || u.city || u.plaats || '',
          country: prev.country || u.country || u.land || 'NL',
          company_name: prev.company_name || u.company_name || '',
          invoice_email: prev.invoice_email || u.invoice_email || u.email || '',
          vat_number: prev.vat_number || u.vat_number || '',
          separate_shipping_address: prev.separate_shipping_address ?? !!u.separate_shipping_address,
          shipping_address: prev.shipping_address || u.shipping_address || '',
          shipping_postal_code: prev.shipping_postal_code || u.shipping_postal_code || '',
          shipping_city: prev.shipping_city || u.shipping_city || '',
          shipping_country: prev.shipping_country || u.shipping_country || 'NL',
        }))
        
        // Als we een email hebben, direct de database raadplegen voor de meest recente gegevens
        if (u.email) {
          // Direct de database raadplegen voor de meest recente klantgegevens
          setTimeout(async () => {
            try {
              const customers = await FirebaseClientService.getCustomersByEmail(u.email)
              const record = Array.isArray(customers) && customers.length ? customers[0] as any : null
              if (record) {
                setCustomer(prev => ({
                  ...prev,
                  contact_first_name: record.contact_first_name || record.first_name || record.voornaam || prev.contact_first_name || '',
                  contact_last_name: record.contact_last_name || record.last_name || record.achternaam || prev.contact_last_name || '',
                  phone: record.phone || record.telefoon || prev.phone || '',
                  address: record.address || record.adres || prev.address || '',
                  postal_code: record.postal_code || record.postcode || prev.postal_code || '',
                  city: record.city || record.plaats || prev.city || '',
                  country: record.country || record.land || prev.country || 'NL',
                  company_name: record.company_name || prev.company_name || '',
                }))
              }
            } catch (error) {
              console.error('Fout bij laden klantgegevens uit database:', error)
            }
          }, 100)
        }
      }
    } catch {}

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

    // Calculate initial totals - direct berekenen zonder afhankelijkheden
    setTimeout(() => {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen initiële totalen:', error);
      }
    }, 100);

    // Listen for logout events to clear customer data
    const handleLogout = () => {
      console.log('🚪 Checkout: Logout event ontvangen - customer data wissen...')
      
      // Reset customer state naar lege waarden
      setCustomer({
        contact_first_name: "",
        contact_last_name: "",
        email: "",
        phone: "",
        address: "",
        postal_code: "",
        city: "",
        country: "NL",
        vat_number: "",
        company_name: "",
        invoice_email: "",
        vat_verified: false,
        vat_reverse_charge: false,
        separate_shipping_address: false,
        shipping_address: "",
        shipping_postal_code: "",
        shipping_city: "",
        shipping_country: "NL"
      })
      
      // Reset dealer group
      setDealerGroup(null)
      
      // Verwijder ALLE gerelateerde localStorage items
      const itemsToRemove = [
        'customerDetails',
        'dealerEmail',
        'dealerName',
        'dealerGroup',
        'dealerSession',
        'dealerDiscount'
      ]
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item)
        console.log(`🗑️ Checkout logout - verwijderd: ${item}`)
      })
      
      console.log('✅ Checkout: Alle customer data gewist')
    }

    window.addEventListener('user-logout', handleLogout)

    // Prevent accidental form submit by Enter on non-review steps
    const handler = (e: KeyboardEvent) => {
      const isEnter = e.key === 'Enter'
      if (!isEnter) return
      const steps: CheckoutStep[] = ['customer', 'shipping', 'payment', 'review']
      const idx = steps.indexOf(currentStep)
      if (idx >= 0 && steps[idx] !== 'review') {
        e.preventDefault()
      }
    }
    try { window.addEventListener('keydown', handler) } catch {}
    return () => { 
      try { window.removeEventListener('keydown', handler) } catch {}
      try { window.removeEventListener('user-logout', handleLogout) } catch {}
    }
  }, []);

  // Recalculate totals when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      console.log('Cart veranderd, totalen herberekenen:', cart);
      calculateTotals();
    } else {
      console.log('Cart is leeg, geen totalen te berekenen');
    }
  }, [cart]);

  // When we have an email, fetch the latest customer record from DB and merge missing fields
  useEffect(() => {
    const mergeFromDb = async () => {
      const email = (customer.email || '').trim().toLowerCase()
      if (!email) return
      try {
        const res = await fetch(`/api/customers?email=${encodeURIComponent(email)}`)
        if (!res.ok) return
        const dbCustomer = await res.json()
        if (!dbCustomer) return
        setCustomer(prev => ({
          ...prev,
          contact_first_name: prev.contact_first_name || dbCustomer.contact_first_name || dbCustomer.first_name || '',
          contact_last_name: prev.contact_last_name || dbCustomer.contact_last_name || dbCustomer.last_name || '',
          phone: prev.phone || dbCustomer.phone || dbCustomer.telefoon || '',
          address: prev.address || dbCustomer.address || dbCustomer.adres || '',
          postal_code: prev.postal_code || dbCustomer.postal_code || dbCustomer.postcode || '',
          city: prev.city || dbCustomer.city || dbCustomer.plaats || '',
          country: prev.country || dbCustomer.country || dbCustomer.land || 'NL',
        }))
      } catch {}
    }
    mergeFromDb()
  }, [customer.email])

  // Persist customer form as user types
  useEffect(() => {
    try { localStorage.setItem('customerDetails', JSON.stringify(customer)) } catch {}
  }, [customer])

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
          setCustomer(prev => ({ ...prev, invoice_email: prev.invoice_email || email }))
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
      
      // Laad BTW instellingen uit database
      try {
        const vatData = await FirebaseClientService.getVatSettings()
        if (vatData && Array.isArray(vatData)) {
          setVatSettings(vatData)
        }
      } catch (error) {
        console.error('Fout bij laden BTW instellingen in checkout:', error)
        // Fallback naar standaard BTW instellingen
        setVatSettings([{
          country_code: 'NL',
          standard_rate: 21,
          reduced_rate: 9,
          zero_rate: 0
        }])
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      if (!res.ok) {
        console.warn('Payment methods API niet beschikbaar')
        return
      }
      const list = await res.json()
      const all = (Array.isArray(list) ? list : [])
      
      if (all.length > 0) {
        // Dedup by mollie_id to avoid duplicates like double iDEAL
        const dedupMap: Record<string, any> = {}
        all.forEach((m:any) => {
          if (!dedupMap[m.mollie_id]) dedupMap[m.mollie_id] = m
        })
        const deduped = Object.values(dedupMap)
        // Stable sort: invoice (if allowed) last, then iDEAL, bancontact, paypal, creditcard
        const order: string[] = ['ideal', 'bancontact', 'paypal', 'creditcard', 'invoice']
        deduped.sort((a:any,b:any)=> order.indexOf(a.mollie_id) - order.indexOf(b.mollie_id))
        setAvailablePaymentMethods(deduped as any)
        const firstActive = (deduped as any[]).find((m:any)=>m.is_active && m.mollie_id !== 'invoice') || (deduped as any[]).find((m:any)=>m.is_active)
        if (firstActive) setPaymentMethod(firstActive.mollie_id || 'ideal')
      }
    } catch (error) {
      console.error('Fout bij laden payment methods:', error)
    }
  }

  const calculateTotals = () => {
    // Bescherm tegen lege cart
    if (!cart || cart.length === 0) {
      console.log('Cart is leeg, geen totalen te berekenen');
      return;
    }
    
    // 1. Bruto prijs van het product (incl. BTW)
    // 2. Netto prijs berekenen (dealer korting eraf)
    const subtotalInclVat = cart.reduce((sum, item) => {
      const discountedPrice = getDiscountedPrice(item.price, item.vat_category);
      return sum + (discountedPrice * item.quantity);
    }, 0);
    
    // 3. Verzendkosten bepalen - alleen als verzendmethode is gekozen
    let shippingCost = 0;
    
    if (shippingMethod) {
      // Controleer of afhalen is geselecteerd
      const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
      const isPickup = selectedMethod?.delivery_type === 'pickup' || shippingMethod === 'pickup';
      
      if (isPickup) {
        // Afhalen is altijd gratis
        shippingCost = 0;
      } else {
        // Voor verzending: gratis boven drempel uit instellingen
        const threshold = parseFloat(settings.freeShippingThreshold) || 300;
        if (subtotalInclVat >= threshold) {
          shippingCost = 0;
        } else {
          // Anders: standaard verzendkosten (inclusief BTW)
          const baseCost = parseFloat(settings.shippingCost) || 8.95;
          shippingCost = dealer.isDealer ? baseCost : getPriceIncludingVat(baseCost, 'standard');
        }
      }
    }
    
    // 4. Subtotaal incl. verzendkosten (incl. BTW)
    const subtotalWithShipping = subtotalInclVat + shippingCost;
    
    // 5. BTW is al inbegrepen in de prijzen - geen extra BTW berekening nodig
    let vatAmount = 0;
    let total = subtotalInclVat;
    
    if (shippingMethod) {
      // BTW is al inbegrepen in de productprijzen
      // Verzendkosten zijn ook inclusief BTW
      total = subtotalWithShipping;
      
      setVatCalculation({
        vat_rate: 21, // BTW percentage voor referentie
        vat_amount: 0, // Geen extra BTW
        total_amount: total,
        vat_exempt: false,
        vat_reason: 'BTW al inbegrepen in prijzen'
      });
    }
    
    // Sla de totalen op in state voor gebruik bij betaling
    setOrderTotals({
      subtotal: subtotalInclVat,
      shippingCost,
      total,
      vatAmount
    });
    
    console.log('Totals berekend:', { 
      subtotalInclVat, 
      shippingCost, 
      subtotalWithShipping,
      vatAmount, 
      total,
      cartLength: cart.length,
      shippingMethod: shippingMethod || 'Geen gekozen',
      calculation: shippingMethod ? `BTW: €${subtotalWithShipping} × 21% = €${vatAmount.toFixed(2)}` : 'Geen verzendmethode gekozen'
    });
  };

  // Recalculate totals when shipping method changes
  useEffect(() => {
    // Alleen berekenen als BTW instellingen geladen zijn
    if (vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen totalen bij wijziging verzendmethode:', error);
      }
    }
  }, [shippingMethod, cart, dealer.discountPercent, dealer.isDealer, settings, vatSettings]);

  // Recalculate totals when VAT settings change
  useEffect(() => {
    // Alleen berekenen als BTW instellingen geladen zijn
    if (vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen totalen:', error);
      }
    }
  }, [vatSettings]);

  // Initial calculation when component mounts and cart is available
  useEffect(() => {
    if (cart.length > 0 && vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij initiële berekening totalen:', error);
      }
    }
  }, [cart, vatSettings]);



  // Recalculate totals when cart changes
  useEffect(() => {
    if (cart.length > 0 && vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen totalen bij wijziging winkelwagen:', error);
      }
    }
  }, [cart, vatSettings]);

  const validateStep = (step: CheckoutStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'customer') {
      if (!customer.contact_first_name) newErrors.contact_first_name = 'Voornaam is verplicht';
      if (!customer.contact_last_name) newErrors.contact_last_name = 'Achternaam is verplicht';
      if (!customer.email) newErrors.email = 'E-mail is verplicht';
      if (!customer.phone) newErrors.phone = 'Telefoon is verplicht';
      if (!customer.address) newErrors.address = 'Adres is verplicht';
      if (!customer.postal_code) newErrors.postal_code = 'Postcode is verplicht';
      if (!customer.city) newErrors.city = 'Plaats is verplicht';
    }

    if (step === 'shipping' && customer.separate_shipping_address) {
      if (!customer.shipping_address) newErrors.shipping_address = 'Verzendadres is verplicht';
      if (!customer.shipping_postal_code) newErrors.shipping_postal_code = 'Verzendpostcode is verplicht';
      if (!customer.shipping_city) newErrors.shipping_city = 'Verzendplaats is verplicht';
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
    if (!validateStep(currentStep)) return
    const steps: CheckoutStep[] = ['customer', 'shipping', 'payment', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
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
    if (field === 'separate_shipping_address' && value === false) {
      setCustomer(prev => ({
        ...prev,
        shipping_address: '',
        shipping_postal_code: '',
        shipping_city: '',
        shipping_country: 'NL'
      }))
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity <= 0) {
      const updatedCart = cart.filter(item => item.id !== id);
      setCart(updatedCart);
      localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    } else {
      const updatedCart = cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    }
    if (vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen totalen bij wijziging hoeveelheid:', error);
      }
    }
  };

  const removeItem = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("alloygator-cart", JSON.stringify(updatedCart));
    try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: updatedCart } })) } catch {}
    if (vatSettings && vatSettings.length > 0) {
      try {
        calculateTotals();
      } catch (error) {
        console.error('Fout bij berekenen totalen bij verwijderen item:', error);
      }
    }
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
      // Check if pickup is selected (either hardcoded or from database)
      const isPickupSelected = shippingMethod === 'pickup' || 
        (settings.shippingMethods.find(method => method.id === shippingMethod)?.delivery_type === 'pickup');
      
      if (!isPickupSelected) return;

      const postalCode = customer.separate_shipping_address ? customer.shipping_postal_code : customer.postal_code;
      if (!postalCode) {
        alert('Vul eerst een postcode in om afhaalpunten te laden.');
        return;
      }

      // Show loading state
      setPickupLocations([]);
      setShowPickupLocations(true);

      // For hardcoded pickup, use DHL as default carrier
      const carrier = shippingMethod === 'pickup' ? 'dhl' : 
        settings.shippingMethods.find(method => method.id === shippingMethod)?.carrier || 'dhl';

      console.log(`Loading pickup locations for ${carrier} in ${postalCode}`);

      let response;
      if (carrier === 'dhl') {
        response = await fetch(
          `/api/dhl/pickup-locations?postal_code=${postalCode}&country=NL`
        );
      } else {
        // Voor andere carriers (PostNL, etc.) kunnen we hier later andere endpoints toevoegen
        alert(`${carrier.toUpperCase()} afhaalpunten worden nog niet ondersteund. Kies een andere verzendmethode.`);
        setShowPickupLocations(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          console.log(`Found ${data.data.length} pickup locations`);
          setPickupLocations(data.data);
        } else {
          alert(`Geen afhaalpunten gevonden voor ${carrier} in postcode ${postalCode}. Probeer een andere postcode of kies een andere verzendmethode.`);
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
            errorMessage = `Geen afhaalpunten gevonden voor ${carrier} in postcode ${postalCode}. Probeer een andere postcode.`;
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

    console.log('=== CHECKOUT DEBUG START ===');
    console.log('1. Initial State:', {
      cart: cart,
      cartLength: cart.length,
      shippingMethod: shippingMethod,
      selectedMethod: selectedMethod,
      paymentMethod: paymentMethod,
      orderTotals: orderTotals,
      vatCalculation: vatCalculation,
      dealer: {
        isDealer: dealer.isDealer,
        discountPercent: dealer.discountPercent
      },
      settings: {
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingCost: settings.shippingCost
      }
    });

    // 0) Upsert customer address by email (if provided)
    try {
      const email = (customer.email || '').trim().toLowerCase()
      if (email) {
        const shippingDefaults = customer.separate_shipping_address ? {} : {
          shipping_address: customer.shipping_address || customer.address,
          shipping_postal_code: customer.shipping_postal_code || customer.postal_code,
          shipping_city: customer.shipping_city || customer.city,
          shipping_country: customer.shipping_country || customer.country,
        }
        await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          email,
          contact_first_name: customer.contact_first_name,
          contact_last_name: customer.contact_last_name,
          phone: customer.phone,
          address: customer.address,
          postal_code: customer.postal_code,
          city: customer.city,
          country: customer.country,
          ...shippingDefaults,
        }) })
        if (createAccount) {
          if (!accountPassword || accountPassword !== accountPassword2) throw new Error('Wachtwoorden komen niet overeen')
          await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            email,
            password: accountPassword,
            name: `${customer.contact_first_name || ''} ${customer.contact_last_name || ''}`.trim()
          }) })
        }
      }
    } catch (e) {
      console.warn('Adres/account opslaan mislukt (gaat verder met checkout):', e)
    }

    // Prepare items with dealer discount applied for dealers
    const itemsForOrder = cart.map((item) => ({
      ...item,
      price: getDiscountedPrice(item.price, item.vat_category)
    }))

    console.log('2. Items voor order:', itemsForOrder);

    const netSubtotal = itemsForOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    console.log('3. Netsubtotal berekend:', netSubtotal);

    // Haal customer ID op uit localStorage of gebruik email als fallback
    const currentUser = localStorage.getItem('currentUser')
    const customerId = currentUser ? JSON.parse(currentUser).id : customer.email

    // Shipping cost calculation met debug
    const shippingCostCalculation = (() => {
      console.log('4. Shipping cost berekening START');
      
      if (!selectedMethod) {
        console.log('4a. Geen selected method, return 0');
        return 0;
      }
      
      // Check voor hardcoded pickup of database pickup method
      const isPickup = shippingMethod === 'pickup' || selectedMethod?.delivery_type === 'pickup';
      console.log('4b. IsPickup check:', { shippingMethod, deliveryType: selectedMethod?.delivery_type, isPickup });
      
      if (isPickup) {
        console.log('4c. Pickup selected, return 0');
        return 0; // Afhalen is altijd gratis
      }
      
      // Voor verzending: gratis boven drempel
      const threshold = parseFloat(settings.freeShippingThreshold) || 300;
      console.log('4d. Threshold check:', { netSubtotal, threshold, isFree: netSubtotal >= threshold });
      
      if (netSubtotal >= threshold) {
        console.log('4e. Gratis verzending, return 0');
        return 0; // Gratis verzending
      } else {
        // Standaard verzendkosten (inclusief BTW)
        const baseCost = parseFloat(settings.shippingCost) || 8.95;
        const finalCost = dealer.isDealer ? baseCost : getPriceIncludingVat(baseCost, 'standard');
        console.log('4f. Verzendkosten berekend:', { baseCost, isDealer: dealer.isDealer, finalCost });
        return finalCost;
      }
    })();

    const order = {
      customer: customer,
      customer_id: customerId,
      user_email: customer.email,
      items: itemsForOrder,
      shipping_method: (() => {
        if (shippingMethod === 'pickup') return 'Afhalen bij dealer';
        return selectedMethod?.name || 'Standaard verzending';
      })(),
      shipping_cost: shippingCostCalculation,
      shipping_carrier: selectedMethod?.carrier || 'postnl',
      shipping_delivery_type: (() => {
        if (shippingMethod === 'pickup') return 'pickup';
        return selectedMethod?.delivery_type || 'standard';
      })(),
      pickup_location: selectedPickupLocation,
      subtotal: netSubtotal,
      vat_amount: vatCalculation.vat_amount,
      total: netSubtotal + shippingCostCalculation, // FIX: Direct berekenen
      dealer_group: dealerGroup,
      dealer_discount: dealer.discountPercent || 0,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'open',
      payment_method: paymentMethod,
      payment_terms_days: paymentMethod === 'invoice' ? 14 : undefined
    };

    console.log('5. Order object compleet:', {
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      total: order.total,
      vat_amount: order.vat_amount,
      orderTotals_vergelijking: orderTotals,
      vatCalculation_vergelijking: vatCalculation
    });

    // Valideer dat total > 0
    if (order.total <= 0) {
      console.error('FOUT: Order total is 0 of negatief!', order.total);
      alert('Fout: Het totaalbedrag is ongeldig. Herlaad de pagina en probeer opnieuw.');
      return;
    }

    console.log('6. Order total validatie OK:', order.total);

    // 1) Create order in backend
    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    if (!orderRes.ok) throw new Error('Failed to create order')
    const created = await orderRes.json()
    const orderId: string = created?.order_id || created?.id || created?.orderId
    const orderNumber: string = created?.order_number || created?.orderNumber || created?.id
    
    console.log('7. Order aangemaakt:', { orderId, orderNumber, created });
    
    if (!orderId) {
      console.error('Order creation response:', created)
      throw new Error('Order ID ontbreekt na aanmaken')
    }

    // 2) If paymentMethod is invoice (op rekening), skip Mollie and mark as pending
    if (paymentMethod === 'invoice') {
      console.log('8. Invoice payment - skip Mollie');
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, payment_method: 'invoice', payment_status: 'pending', status: 'pending' })
      }).catch(()=>{})

      const orderForConfirmation = { ...order, id: orderId, order_number: orderNumber };
      localStorage.setItem('lastOrder', JSON.stringify(orderForConfirmation));
      localStorage.removeItem("alloygator-cart");
      setCart([]);
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } })) } catch {}
      window.location.href = `/order-confirmation/${orderId}`;
      return
    }

    // 2b) If paymentMethod is cash or pin, skip Mollie and mark as open for manual payment
    if (paymentMethod === 'cash' || paymentMethod === 'pin') {
      console.log('8b. Cash/Pin payment - skip Mollie');
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          payment_method: paymentMethod, 
          payment_status: 'open',
          status: 'nieuw'
        })
      }).catch(()=>{})

      const orderForConfirmation = { ...order, id: orderId, order_number: orderNumber };
      localStorage.setItem('lastOrder', JSON.stringify(orderForConfirmation));
      localStorage.removeItem("alloygator-cart");
      setCart([]);
      try { window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items: [] } })) } catch {}
      window.location.href = `/order-confirmation/${orderId}`;
      return
    }

    // 2) Create Mollie payment for the order
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const returnUrl = `${baseUrl}/payment/return?orderId=${encodeURIComponent(orderId)}${isLocalhost ? '&simulate=1' : ''}`
    const webhookUrl = `${baseUrl}/api/payment/mollie/webhook`
    
    console.log('9. Mollie URLs:', { baseUrl, returnUrl, webhookUrl });

    const molliePayload = {
      amount: Math.round(order.total * 100) / 100,
      currency: 'EUR',
      description: `Order ${orderNumber}`,
      orderId: orderId,
      redirectUrl: returnUrl,
      webhookUrl: webhookUrl,
      cardToken: creditCardToken,
      idealIssuer: selectedIDEALBank
    };

    console.log('10. Mollie payload:', molliePayload);

    const paymentRes = await fetch('/api/payment/mollie/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(molliePayload)
    })

    console.log('11. Mollie response status:', paymentRes.status);

    if (!paymentRes.ok) {
      const err = await paymentRes.json().catch(()=>({}))
      console.error('12. Create payment failed:', err)
      throw new Error('Failed to create payment')
    }
    const payment = await paymentRes.json()

    console.log('13. Payment response:', payment);

    // 3) Redirect to Mollie checkout
    if (!payment.checkoutUrl) {
      console.error('14. FOUT: Geen checkout URL ontvangen!', payment);
      alert('Fout: Geen checkout URL ontvangen. Check console voor details.')
      return
    }

    console.log('15. Redirect naar Mollie:', payment.checkoutUrl);
    console.log('=== CHECKOUT DEBUG END ===');
    
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

  // Gebruik de calculateTotals functie voor alle berekeningen
  // Deze variabelen worden alleen gebruikt voor weergave en worden overschreven door calculateTotals
  const subtotalPre = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // GEEN korting opnieuw toepassen - item.price bevat al de dealer korting
  const discount = 0; // Dealer korting is al toegepast in item.price
  const netItems = subtotalPre; // Geen korting aftrekken - al toegepast
  const selectedMethod = settings.shippingMethods.find(method => method.id === shippingMethod);
  
  // Voor dealers: verzendkosten ex BTW, voor particuliere klanten inclusief BTW
  let finalShippingCost = netItems >= parseFloat(settings.freeShippingThreshold) ? 0 : selectedMethod?.price || parseFloat(settings.shippingCost) || 0;
  
  if (!dealer.isDealer && finalShippingCost > 0) {
    // Voor particuliere klanten: converteer verzendkosten naar inclusief BTW
    finalShippingCost = getPriceIncludingVat(finalShippingCost, 'standard');
  }

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
                          value={customer.contact_first_name}
                          onChange={(e) => handleCustomerChange('contact_first_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.contact_first_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.contact_first_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.contact_first_name}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Achternaam *
                        </label>
                        <input
                          type="text"
                          value={customer.contact_last_name}
                          onChange={(e) => handleCustomerChange('contact_last_name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.contact_last_name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.contact_last_name && (
                          <p className="text-red-500 text-sm mt-1">{errors.contact_last_name}</p>
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
                          value={customer.phone}
                          onChange={(e) => handleCustomerChange('phone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adres *
                      </label>
                      <input
                        type="text"
                        value={customer.address}
                        onChange={(e) => handleCustomerChange('address', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          value={customer.postal_code}
                          onChange={(e) => handleCustomerChange('postal_code', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.postal_code ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.postal_code && (
                          <p className="text-red-500 text-sm mt-1">{errors.postal_code}</p>
                        )}
                        {customer.country === 'NL' && (
                          <button
                            type="button"
                            onClick={async () => {
                              const pc = (customer.postal_code || '').trim()
                              if (!pc) return
                              try {
                                setIsResolvingPostcode(true)
                                // Ask for house number via simple prompt
                                let huisnummer = ''
                                try {
                                  huisnummer = (window.prompt('Voer je huisnummer in (evt. met toevoeging)') || '').trim()
                                } catch {}
                                if (!huisnummer) {
                                  setIsResolvingPostcode(false)
                                  return
                                }

                                // Prefer NL postcode service by passing explicit params
                                const res = await fetch(`/api/geocode?postalCode=${encodeURIComponent(pc)}&houseNumber=${encodeURIComponent(huisnummer)}`)
                                const data = await res.json()
                                if (res.ok && data?.address) {
                                  handleCustomerChange('city', data.address.city)
                                  if (data.address.street || data.address.house_number) {
                                    const street = data.address.street || ''
                                    const hn = data.address.house_number || huisnummer
                                    const addr = `${street} ${hn}`.trim()
                                    if (addr) handleCustomerChange('address', addr)
                                  }
                                } else {
                                  alert('Geen adres gevonden voor deze postcode')
                                }
                              } catch (e) {
                                alert('Zoeken op postcode is mislukt')
                              } finally {
                                setIsResolvingPostcode(false)
                              }
                            }}
                            className="mt-2 text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            disabled={isResolvingPostcode}
                          >
                            {isResolvingPostcode ? 'Zoeken…' : 'Zoek adres'}
                          </button>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Plaats *
                        </label>
                        <input
                          type="text"
                          value={customer.city}
                          onChange={(e) => handleCustomerChange('city', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Land
                        </label>
                        <select
                          value={customer.country}
                          onChange={(e) => handleCustomerChange('country', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md border-gray-300 bg-white"
                        >
                          {/* Priority countries */}
                          <optgroup label="Meest gebruikt">
                            <option value="NL">Nederland</option>
                            <option value="BE">België</option>
                          </optgroup>
                          <optgroup label="Alle landen">
                            {OTHER_COUNTRIES.map(c => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Postcode-lookup alleen voor NL</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="separateShipping"
                        checked={customer.separate_shipping_address}
                        onChange={(e) => handleCustomerChange('separate_shipping_address', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="separateShipping" className="text-sm text-gray-700">
                        Ander verzendadres gebruiken
                      </label>
                    </div>

                    <div className="mt-2">
                      {/* Only show account creation checkbox if user is not logged in */}
                      {!localStorage.getItem('currentUser') && (
                        <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
                          <input type="checkbox" checked={createAccount} onChange={(e)=>setCreateAccount(e.target.checked)} />
                          <span>Maak ook een account aan</span>
                        </label>
                      )}
                      {createAccount && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
                            <input type="password" value={accountPassword} onChange={(e)=>setAccountPassword(e.target.value)} className="w-full px-3 py-2 border rounded-md" minLength={6} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Herhaal wachtwoord</label>
                            <input type="password" value={accountPassword2} onChange={(e)=>setAccountPassword2(e.target.value)} className="w-full px-3 py-2 border rounded-md" minLength={6} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping Step */}
                {currentStep === 'shipping' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900">Verzendmethode</h2>
                    
                    <div className="space-y-4">
                      {/* Hardcoded pickup option - always available */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="pickup"
                              name="shippingMethod"
                              value="pickup"
                              checked={shippingMethod === 'pickup'}
                              onChange={(e) => handleShippingMethodChange(e.target.value)}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                            />
                            <div>
                              <label htmlFor="pickup" className="font-medium text-gray-900 cursor-pointer">
                                Afhalen bij dealer
                              </label>
                              <p className="text-sm text-gray-600">Haal je bestelling op bij een dealer in de buurt</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">Gratis</p>
                          </div>
                        </div>
                      </div>

                      {/* Database shipping methods */}
                      {settings.shippingMethods && settings.shippingMethods.length > 0 ? (
                        settings.shippingMethods
                          .filter(method => method.enabled && settings.enabledCarriers.includes(method.carrier))
                          .map((method) => {
                            // Calculate if this method would be free (based on net items subtotal)
                            // item.price bevat al de dealer korting, dus gebruik dit direct
                            const netSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const isFree = netSubtotal >= parseFloat(settings.freeShippingThreshold);
                            
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
                          })
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">Geen extra verzendmethodes beschikbaar</p>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md text-left">
                            <p className="text-xs text-gray-600 mb-1">Debug info:</p>
                            <p className="text-xs text-gray-500">Settings loaded: {settings.shippingMethods ? 'Yes' : 'No'}</p>
                            <p className="text-xs text-gray-500">Shipping methods count: {settings.shippingMethods?.length || 0}</p>
                            <p className="text-xs text-gray-500">Enabled carriers: {settings.enabledCarriers?.join(', ') || 'None'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pickup Location Selection */}
                    {(() => {
                      // Check if pickup is selected (either hardcoded or from database)
                      const isPickupSelected = shippingMethod === 'pickup' || 
                        (settings.shippingMethods.find(method => method.id === shippingMethod)?.delivery_type === 'pickup');
                      
                      return isPickupSelected && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Afhaalpunt Selecteren</h3>
                              <button
                              type="button"
                              onClick={loadPickupLocations}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
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

                    {customer.separate_shipping_address && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Verzendadres</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Verzendadres
                          </label>
                          <input
                            type="text"
                            value={customer.shipping_address}
                            onChange={(e) => handleCustomerChange('shipping_address', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md ${
                              errors.shipping_address ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors.shipping_address && (
                            <p className="text-red-500 text-sm mt-1">{errors.shipping_address}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postcode
                            </label>
                            <input
                              type="text"
                              value={customer.shipping_postal_code}
                              onChange={(e) => handleCustomerChange('shipping_postal_code', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md ${
                                errors.shipping_postal_code ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.shipping_postal_code && (
                              <p className="text-red-500 text-sm mt-1">{errors.shipping_postal_code}</p>
                            )}
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Plaats
                            </label>
                            <input
                              type="text"
                              value={customer.shipping_city}
                              onChange={(e) => handleCustomerChange('shipping_city', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md ${
                                errors.shipping_city ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors.shipping_city && (
                              <p className="text-red-500 text-sm mt-1">{errors.shipping_city}</p>
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
                      {(() => {
                        // Check if this is a pickup method
                        const isPickup = selectedMethod?.delivery_type === 'pickup' || 
                                        selectedMethod?.delivery_type === 'pickup_local' ||
                                        selectedMethod?.id === 'local-pickup' ||
                                        selectedMethod?.carrier === 'local';
                        
                        // Filter payment methods based on pickup/delivery and invoice allowance
                        let filteredMethods = availablePaymentMethods.filter(pm => pm.is_active === true);
                        
                        if (!allowInvoicePayment) {
                          filteredMethods = filteredMethods.filter(pm => pm.mollie_id !== 'invoice');
                        }
                        
                        if (isPickup) {
                          // For pickup: allow cash/pin; drop methods explicitly unavailable for pickup
                          filteredMethods = filteredMethods.filter(pm => (pm as any).available_for_pickup !== false)
                        } else {
                          // For delivery: hide cash/pin and any method marked unavailable for delivery
                          filteredMethods = filteredMethods
                            .filter(pm => pm.mollie_id !== 'cash' && pm.mollie_id !== 'pin')
                            .filter(pm => (pm as any).available_for_delivery !== false)
                        }
                        
                        return filteredMethods;
                      })()
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
                                onChange={(e) => {
                                  setPaymentMethod(e.target.value);
                                  // Reset tokens when changing payment method
                                  if (e.target.value !== 'creditcard') {
                                    setCreditCardToken(null);
                                  }
                                  if (e.target.value !== 'ideal') {
                                    setSelectedIDEALBank(null);
                                  }
                                }}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                              />
                              <div>
                                <label htmlFor={`pm-${pm.id}`} className="font-medium text-gray-900 cursor-pointer">
                                  {pm.name}
                                </label>
                                <p className="text-sm text-gray-600">
                                  {pm.fee_percent ? `${pm.fee_percent > 0 ? '+' : ''}${pm.fee_percent}%` : 'Geen toeslag/korting'}
                                  {pm.mollie_id === 'cash' || pm.mollie_id === 'pin' ? ' • Alleen beschikbaar bij afhalen' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Toon Mollie Components voor creditcard betalingen */}
                          {pm.mollie_id === 'creditcard' && paymentMethod === 'creditcard' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <MollieCreditCard
                                onTokenCreated={(token) => setCreditCardToken(token)}
                                onError={(error) => setErrors(prev => ({ ...prev, creditCard: error }))}
                                loading={loading}
                              />
                            </div>
                          )}
                          
                          {/* Toon iDEAL bank selectie */}
                          {pm.mollie_id === 'ideal' && paymentMethod === 'ideal' && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <MollieIDEAL
                                onBankSelected={(bankId, bankName) => setSelectedIDEALBank(bankId)}
                                selectedBank={selectedIDEALBank}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {!allowInvoicePayment && availablePaymentMethods.some(pm => pm.mollie_id === 'invoice') && (
                        <div className="text-xs text-gray-500">Op rekening is niet beschikbaar voor dit e-mailadres.</div>
                      )}
                      {(() => {
                        const isPickup = selectedMethod?.delivery_type === 'pickup' || 
                                        selectedMethod?.delivery_type === 'pickup_local' ||
                                        selectedMethod?.id === 'local-pickup' ||
                                        selectedMethod?.carrier === 'local';
                        
                        if (isPickup) {
                          return (
                            <div className="text-xs text-gray-500">
                              Afhalen: Contant, Pinnen of Op rekening beschikbaar. Contant/Pinnen: betaling bij afhalen. Op rekening: betaaltermijn wordt overgenomen van klant (standaard 14 dagen).
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-xs text-gray-500">
                              Verzending: Alleen op rekening beschikbaar. Betaaltermijn wordt overgenomen van klant (standaard 14 dagen).
                            </div>
                          );
                        }
                      })()}
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
                             <p className="font-medium text-gray-900">€{(getDiscountedPrice(item.price, item.vat_category) * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Klantgegevens</h3>
                        <p className="text-sm text-gray-600">
                          {customer.contact_first_name} {customer.contact_last_name}<br />
                          {customer.email}<br />
                          {customer.phone}<br />
                          {customer.address}<br />
                          {customer.postal_code} {customer.city}
                        </p>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Verzending</h3>
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
                        {customer.separate_shipping_address && (
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-900">Verzendadres:</p>
                            <p className="text-sm text-gray-600">
                              {customer.shipping_address}<br />
                              {customer.shipping_postal_code} {customer.shipping_city}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Betaling</h3>
                        <div className="text-sm text-gray-600">
                          <p><strong>Betaalmethode:</strong> {availablePaymentMethods.find(pm => pm.mollie_id === paymentMethod)?.name || paymentMethod}</p>
                          {(() => {
                            const isPickup = selectedMethod?.delivery_type === 'pickup' || 
                                            selectedMethod?.delivery_type === 'pickup_local' ||
                                            selectedMethod?.id === 'local-pickup' ||
                                            selectedMethod?.carrier === 'local';
                            
                            if (paymentMethod === 'cash' || paymentMethod === 'pin') {
                              return (
                                <p className="text-green-600 font-medium">
                                  Betaling bij afhalen (order blijft open)
                                </p>
                              );
                            } else if (paymentMethod === 'invoice') {
                              return (
                                <p className="text-blue-600 font-medium">
                                  Betaaltermijn: klantinstelling (standaard 14 dagen)
                                </p>
                              );
                            } else {
                              return (
                                <p className="text-gray-600">
                                  Direct betalen via {availablePaymentMethods.find(pm => pm.mollie_id === paymentMethod)?.name || paymentMethod}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-4">
                        <label className="flex items-start space-x-3 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e)=>setTermsAccepted(e.target.checked)}
                            className="mt-1"
                          />
                          <span>
                            Ik accepteer de <a className="text-green-700 underline" href="/algemene-voorwaarden" target="_blank" rel="noreferrer">algemene voorwaarden</a> en ga akkoord met de bestelling.
                          </span>
                        </label>
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
                      disabled={loading || !termsAccepted}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Bestelling plaatsen...' : (termsAccepted ? 'Bestelling plaatsen' : 'Accepteer voorwaarden om te bestellen')}
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
                    <p className="font-medium text-gray-900">€{(getDiscountedPrice(item.price, item.vat_category) * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

               <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotaal:</span>
                  <span>€{orderTotals.subtotal.toFixed(2)} (incl. BTW)</span>
                </div>
                
                {/* Verzendkosten - alleen tonen als verzendmethode is gekozen */}
                {shippingMethod && (
                  <div className="flex justify-between text-sm">
                    <span>Verzendkosten (incl. BTW):</span>
                    <span>{(orderTotals.shippingCost === 0 ? 'Gratis' : `€${orderTotals.shippingCost.toFixed(2)}`)}</span>
                  </div>
                )}

                {/* BTW - alleen tonen als verzendmethode is gekozen */}
                {shippingMethod && (
                  <div className="flex justify-between text-sm">
                    <span>BTW (21%):</span>
                    <span>€{orderTotals.vatAmount.toFixed(2)}</span>
                  </div>
                )}
                
                 <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>{shippingMethod ? 'Totaal:' : 'Subtotaal:'}</span>
                   <span>€{orderTotals.total.toFixed(2)} (incl. BTW)</span>
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