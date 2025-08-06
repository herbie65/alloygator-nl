"use client";

import { useState, useEffect } from 'react'
import AdminSidebar from "./components/AdminSidebar";
import Modal from "./components/Modal";
import DatabaseViewer from "./components/DatabaseViewer";
import CustomerImport from "./components/CustomerImport";
import ShippingAddressManager from "./components/ShippingAddressManager";
import CustomerCRM from "./components/CustomerCRM";
import VatSettings from "./components/VatSettings";
import HeaderManager from "./components/HeaderManager";
import UploadManager from "./components/UploadManager";
import DhlParcelSettings from "./components/DhlParcelSettings";
import ShippingSettings from "./components/ShippingSettings";
import PaymentSettings from "./components/PaymentSettings";
import dynamic from 'next/dynamic';
import { FirebaseClientService } from '@/lib/firebase-client';
// @ts-ignore
const ReactQuill = dynamic(() => import('react-quill').then(mod => mod.default), { ssr: false });
import 'react-quill/dist/quill.snow.css';


interface Product {
  id: string
  sku: string
  name: string
  short_description: string
  description: string
  price: number
  cost: number
  category: string
  stock: number
  weight: number
  colour: string
  ean: string
  image: string | null
  meta_title: string
  meta_keywords: string
  meta_description: string
  // Nieuwe attributen
  is_active: boolean
  is_featured: boolean
  vat_category: string
  dimensions: string
  material: string
  warranty: string
  shipping_class: string
  min_order_quantity: number
  max_order_quantity: number
  created_at: string
  updated_at: string
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  customer_group_id: string | number
  group_name?: string
  is_dealer: boolean
  show_on_map: boolean
  vat_number: string | null
  vat_verified: boolean
  vat_reverse_charge: boolean
  lat?: number
  lng?: number
  total_orders: number
  total_spent: number
  created_at: string
  updated_at: string
  // Extra velden voor bewerken
  first_name?: string
  last_name?: string
  company_name?: string
  invoice_email?: string
  website?: string
  // Verzendadres velden
  separate_shipping_address?: boolean
  shipping_address?: string
  shipping_city?: string
  shipping_postal_code?: string
  shipping_country?: string
}

interface CmsPage {
  id: string
  slug: string
  title: string
  content: string
  meta_description: string
  meta_keywords: string
  image: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Settings {
  id: string
  google_maps_api_key: string
  map_center_lat: number
  map_center_lng: number
  map_zoom: number
  search_radius: number
  site_name: string
  site_description: string
  contact_email: string
  contact_phone: string
  social_facebook: string
  social_instagram: string
  social_linkedin: string
  analytics_google: string
  created_at: string
  updated_at: string
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  created_at: string;
  status: 'wachten op betaling' | 'klaar voor verzending' | 'afgerond' | 'nieuw';
  total_amount: number;
  dealer_name?: string | null;
  item_count?: number;
  customer?: {
    voornaam: string;
    achternaam: string;
    email: string;
    telefoon: string;
    adres: string;
    postcode: string;
    plaats: string;
    land: string;
  };
  items?: any[];
  subtotal?: number;
  vat_amount?: number;
  shippingCost?: number;
  paymentMethod?: string;
  shippingMethod?: string;
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // State for different sections
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [homepage, setHomepage] = useState<any>(null);
  const [footer, setFooter] = useState<any>(null);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [footerEditData, setFooterEditData] = useState<any>(null);
  const [showFooterModal, setShowFooterModal] = useState(false);
  const [header, setHeader] = useState<any>(null);
  const [headerEditData, setHeaderEditData] = useState<any>(null);
  const [showHeaderModal, setShowHeaderModal] = useState(false);

  // Customer groups state
  const [showCustomerGroupModal, setShowCustomerGroupModal] = useState(false);
  const [editingCustomerGroup, setEditingCustomerGroup] = useState<any>(null);
  const [newCustomerGroup, setNewCustomerGroup] = useState({
    name: '',
    description: '',
    discount_percentage: 0,
    show_on_map: false
  });

  // Form states
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showPageForm, setShowPageForm] = useState(false)
  const [showSettingsForm, setShowSettingsForm] = useState(false)

  // Product editing state
  const [showProductModal, setShowProductModal] = useState(false);

  // Editing states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null)
  const [editingSettings, setEditingSettings] = useState<Settings | null>(null)

  // New item states
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    sku: '',
    name: '',
    short_description: '',
    description: '',
    price: 0,
    cost: 0,
    category: '',
    stock: 0,
    weight: 0,
    colour: '',
    ean: '',
    image: null,
    meta_title: '',
    meta_keywords: '',
    meta_description: '',
    // Nieuwe velden
    is_active: true,
    is_featured: false,
    vat_category: 'standard', // Nederlandse BTW
    dimensions: '',
    material: '',
    warranty: '',
    shipping_class: 'standard',
    min_order_quantity: 1,
    max_order_quantity: 999
  })

  const [newCustomer, setNewCustomer] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    name: '', // blijft voor compatibiliteit, wordt samengesteld
    email: '',
    invoice_email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Nederland',
    customer_group_id: 1,
    is_dealer: false,
    website: '',
    show_on_map: false,
    vat_number: '',
    vat_verified: false,
    vat_reverse_charge: false,
    lat: null as number | null,
    lng: null as number | null,
    separate_shipping_address: false,
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'Nederland',
    separate_invoice_email: false
  });

  const [newPage, setNewPage] = useState<Partial<CmsPage>>({
    slug: '',
    title: '',
    content: '',
    meta_description: '',
    meta_keywords: '',
    image: null,
    is_active: true
  })

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShippingAddressModal, setShowShippingAddressModal] = useState(false);
  const [selectedCustomerForShipping, setSelectedCustomerForShipping] = useState<Customer | null>(null);

  const [showVatSettingsModal, setShowVatSettingsModal] = useState(false);
  
  // Zoek- en sorteerfunctie state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSortField, setCustomerSortField] = useState<'name' | 'email' | 'city' | 'group_name' | 'created_at'>('name');
  const [customerSortDirection, setCustomerSortDirection] = useState<'asc' | 'desc'>('asc');
  const [customerFilterGroup, setCustomerFilterGroup] = useState<string>('all');
  const [customerFilterDealer, setCustomerFilterDealer] = useState<string>('all');
  const [customerFilterMap, setCustomerFilterMap] = useState<string>('all');
  // VIES validatie
  const [vatStatus, setVatStatus] = useState<'valid' | 'invalid' | 'pending' | ''>('');
  const [vatMessage, setVatMessage] = useState('');
  const [vatButtonColor, setVatButtonColor] = useState<'default' | 'green' | 'red'>('default');

  const handleVatCheck = async () => {
    const cleanedVat = (newCustomer.vat_number || '').toUpperCase().replace(/\s/g, '');
    setVatStatus('pending');
    setVatButtonColor('default');
    setVatMessage('Bezig met VIES-verificatie...');
    try {
      const result = await FirebaseClientService.verifyVatNumber(cleanedVat);
      if (result.valid) {
        setVatStatus('valid');
        setVatButtonColor('green');
        setVatMessage('BTW-nummer is geldig!');
        setNewCustomer(c => ({ ...c, vat_number: cleanedVat, vat_verified: true, vat_reverse_charge: c.country === 'België' }));
      } else {
        setVatStatus('invalid');
        setVatButtonColor('red');
        setVatMessage(result.error || 'BTW-nummer is ongeldig.');
        setNewCustomer(c => ({ ...c, vat_number: cleanedVat, vat_verified: false, vat_reverse_charge: false }));
      }
    } catch (err) {
      setVatStatus('invalid');
      setVatButtonColor('red');
      setVatMessage('Fout bij VIES-verificatie.');
      setNewCustomer(c => ({ ...c, vat_verified: false, vat_reverse_charge: false }));
    }
  };

  // Simple login check
  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setIsLoggedIn(true)
      setMessage('Succesvol ingelogd!')
      // Save login status to localStorage
      localStorage.setItem('adminLoggedIn', 'true')
    } else {
      setMessage('Ongeldige inloggegevens')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setMessage('Uitgelogd')
    // Remove login status from localStorage
    localStorage.removeItem('adminLoggedIn')
  }

  // Fetch data functions
  const fetchProducts = async () => {
    try {
      const data = await FirebaseClientService.getProducts();
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await FirebaseClientService.getCustomers();
      console.log('Fetched customers:', data);
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchPages = async () => {
    try {
      const data = await FirebaseClientService.getCmsPages()
      setPages(data as CmsPage[])
    } catch (error) {
      console.error('Error fetching pages:', error)
      setPages([])
    }
  }

  const fetchSettings = async () => {
    try {
      const data = await FirebaseClientService.getSettings()
      setSettings(data as Settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings(null)
    }
  }

  const fetchOrders = async () => {
    try {
      // Load orders from localStorage for static export
      const savedOrders = localStorage.getItem('orders')
      if (savedOrders) {
        const ordersData = JSON.parse(savedOrders)
        // Transform the data to match the Order interface
        const transformedOrders: Order[] = ordersData.map((order: any) => ({
          id: order.id || order.order_number,
          order_number: order.order_number,
          customer_name: order.customer?.name || order.customer_name || 'Onbekende klant',
          created_at: order.created_at,
          status: order.status || 'wachten op betaling',
          total_amount: typeof order.total === 'number' ? order.total : parseFloat(order.total) || 0,
          dealer_name: order.dealerGroup || null,
          item_count: order.items?.length || 0
        }))
        setOrders(transformedOrders)
        console.log('Orders loaded from localStorage:', transformedOrders)
      } else {
        setOrders([])
        console.log('No orders found in localStorage')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    }
  }

  const fetchHomepage = async () => {
    try {
      const data = await FirebaseClientService.getHomepage()
      setHomepage(data)
    } catch (error) {
      console.error('Error fetching homepage:', error)
      setHomepage(null)
    }
  }

  const fetchFooter = async () => {
    try {
      const data = await FirebaseClientService.getFooter()
      setFooter(data)
    } catch (error) {
      console.error('Error fetching footer:', error)
      setFooter(null)
    }
  }

  // Fetch header data
  const fetchHeader = async () => {
    try {
      const data = await FirebaseClientService.getHeaderSettings()
      setHeader(data)
    } catch (error) {
      console.error('Error fetching header:', error)
      setHeader(null)
    }
  }

  const fetchCustomerGroups = async () => {
    try {
      const data = await FirebaseClientService.getCustomerGroups()
      setCustomerGroups(data)
    } catch (error) {
      console.error('Error fetching customer groups:', error)
      setCustomerGroups([])
    }
  }

  // Check if user is already logged in on component mount
  useEffect(() => {
    const savedLoginStatus = localStorage.getItem('adminLoggedIn')
    if (savedLoginStatus === 'true') {
      setIsLoggedIn(true)
    }
  }, []);

  // Load data on login
  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      fetchCustomers();
      fetchPages();
      fetchSettings();
      fetchOrders();
      fetchHomepage();
      fetchFooter();
      fetchHeader();
      fetchCustomerGroups();
    }
  }, [isLoggedIn]);

  // Debug customers state
  useEffect(() => {
    console.log('Customers state changed:', customers.length, customers);
  }, [customers]);

  // Customer group handlers
  const handleAddCustomerGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await FirebaseClientService.addDocument('customer_groups', newCustomerGroup);
      setShowCustomerGroupModal(false);
      setNewCustomerGroup({
        name: '',
        description: '',
        discount_percentage: 0,
        show_on_map: false
      });
      fetchCustomerGroups();
      alert('Klantgroep succesvol toegevoegd!');
    } catch (error) {
      console.error('Error adding customer group:', error);
      alert('Fout bij toevoegen klantgroep');
    }
  };

  const handleUpdateCustomerGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerGroup) return;
    
    try {
      await FirebaseClientService.updateDocument('customer_groups', editingCustomerGroup.id, {
        name: newCustomerGroup.name,
        description: newCustomerGroup.description,
        discount_percentage: newCustomerGroup.discount_percentage,
        show_on_map: newCustomerGroup.show_on_map
      });
      setShowCustomerGroupModal(false);
      setEditingCustomerGroup(null);
      setNewCustomerGroup({
        name: '',
        description: '',
        discount_percentage: 0,
        show_on_map: false
      });
      fetchCustomerGroups();
      alert('Klantgroep succesvol bijgewerkt!');
    } catch (error) {
      console.error('Error updating customer group:', error);
      alert('Fout bij bijwerken klantgroep');
    }
  };

  const handleDeleteCustomerGroup = async (groupId: string) => {
    // Check if group is in use
    const customersUsingGroup = customers.filter(c => c.customer_group_id === groupId);
    
    if (customersUsingGroup.length > 0) {
      const customerNames = customersUsingGroup.map(c => c.name).join(', ');
      alert(`Deze klantgroep kan niet worden verwijderd omdat deze in gebruik is door: ${customerNames}`);
      return;
    }

    if (confirm('Weet je zeker dat je deze klantgroep wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteDocument('customer_groups', groupId)
        fetchCustomerGroups();
        alert('Klantgroep succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting customer group:', error);
        alert('Fout bij verwijderen klantgroep');
      }
    }
  };

  // Product handlers
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      await FirebaseClientService.updateDocument('products', editingProduct.id, editingProduct);
      setShowProductModal(false);
      setEditingProduct(null);
      setNewProduct({
        sku: '',
        name: '',
        short_description: '',
        description: '',
        price: 0,
        cost: 0,
        category: '',
        stock: 0,
        weight: 0,
        colour: '',
        ean: '',
        image: null,
        meta_title: '',
        meta_keywords: '',
        meta_description: '',
        is_active: true,
        is_featured: false,
        vat_category: 'standard',
        dimensions: '',
        material: '',
        warranty: '',
        shipping_class: 'standard',
        min_order_quantity: 1,
        max_order_quantity: 999
      });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Fout bij bijwerken product');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setShowProductModal(false);
        setNewProduct({
          sku: '',
          name: '',
          short_description: '',
          description: '',
          price: 0,
          cost: 0,
          category: '',
          stock: 0,
          weight: 0,
          colour: '',
          ean: '',
          image: null,
          meta_title: '',
          meta_keywords: '',
          meta_description: '',
          is_active: true,
          is_featured: false,
          vat_category: 'standard',
          dimensions: '',
          material: '',
          warranty: '',
          shipping_class: 'standard',
          min_order_quantity: 1,
          max_order_quantity: 999
        });
        fetchProducts();
      } else {
        alert('Fout bij toevoegen product');
      }
    } catch {
      alert('Fout bij toevoegen product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteDocument('products', productId)
        fetchProducts()
        alert('Product succesvol verwijderd!')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Fout bij verwijderen van product')
      }
    }
  };

  // Haal klantgroepen op bij openen modal
  useEffect(() => {
    if (showCustomerModal) {
      fetch('/api/customer-groups')
        .then(res => res.json())
        .then(setCustomerGroups)
        .catch(() => setCustomerGroups([]));
    }
  }, [showCustomerModal]);

  // Klant toevoegen/bewerken handler
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if address already exists (only for new customers)
      if (!editingCustomer) {
        const addressCheckUrl = `/api/customers?check_address=true&address=${encodeURIComponent(newCustomer.address)}&city=${encodeURIComponent(newCustomer.city)}&postal_code=${encodeURIComponent(newCustomer.postal_code)}`;
        const addressCheckRes = await fetch(addressCheckUrl);
        const addressCheckData = await addressCheckRes.json();
        
        if (addressCheckData.exists) {
          const proceed = confirm(`${addressCheckData.message}\n\nWilt u toch doorgaan met het toevoegen van deze klant?`);
          if (!proceed) {
            return;
          }
        }
      }
      
      // Bepaal de naam op basis van dealer status
      const displayName = newCustomer.is_dealer && newCustomer.company_name 
        ? newCustomer.company_name 
        : `${newCustomer.first_name} ${newCustomer.last_name}`.trim();

      const customerData = {
        ...newCustomer,
        name: displayName,
        // Zorg ervoor dat alle velden worden meegestuurd
        first_name: newCustomer.first_name || '',
        last_name: newCustomer.last_name || '',
        company_name: newCustomer.company_name || '',
        invoice_email: newCustomer.invoice_email || newCustomer.email,
        website: newCustomer.website || '',
        lat: newCustomer.lat || null,
        lng: newCustomer.lng || null,
        // Behoud de show_on_map waarde van de gebruiker
        show_on_map: newCustomer.show_on_map
      };

      const url = editingCustomer ? `/api/customers` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const body = editingCustomer ? { ...customerData, id: editingCustomer.id } : customerData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowCustomerModal(false);
        setEditingCustomer(null);
        setNewCustomer({
          company_name: '',
          first_name: '',
          last_name: '',
          name: '',
          email: '',
          invoice_email: '',
          phone: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'Nederland',
          customer_group_id: 1,
          is_dealer: false,
          website: '',
          show_on_map: false,
          vat_number: '',
          vat_verified: false,
          vat_reverse_charge: false,
          lat: null,
          lng: null,
          separate_shipping_address: false,
          shipping_address: '',
          shipping_city: '',
          shipping_postal_code: '',
          shipping_country: 'Nederland',
          separate_invoice_email: false
        });
        setVatStatus('');
        setVatMessage('');
        fetchCustomers();
        alert(editingCustomer ? 'Klant bijgewerkt!' : 'Klant toegevoegd!');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Fout bij opslaan klant');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Fout bij opslaan klant');
    }
  };

  // Klant verwijderen handler
  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Weet je zeker dat je deze klant wilt verwijderen?')) {
      try {
        await FirebaseClientService.deleteDocument('customers', customerId)
        fetchCustomers()
        alert('Klant succesvol verwijderd!')
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Er is een fout opgetreden bij het verwijderen van de klant.')
      }
    }
  };

  // Import klanten handler
  const handleImportCustomers = async (customers: any[]) => {
    try {
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customers })
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        fetchCustomers() // Refresh de klantenlijst
      } else {
        alert('Fout bij importeren: ' + result.error)
      }
    } catch (error) {
      console.error('Error importing customers:', error)
      alert('Fout bij importeren van klanten')
    }
  }

  // VAT validatie functie
  // Filter en sorteer functies voor klanten
  const getFilteredAndSortedCustomers = () => {
    let filtered = [...customers];

    // Zoekfilter
    if (customerSearchTerm) {
      const searchLower = customerSearchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower) ||
        customer.city?.toLowerCase().includes(searchLower) ||
        customer.company_name?.toLowerCase().includes(searchLower) ||
        customer.first_name?.toLowerCase().includes(searchLower) ||
        customer.last_name?.toLowerCase().includes(searchLower) ||
        customer.group_name?.toLowerCase().includes(searchLower)
      );
    }

    // Groepfilter
    if (customerFilterGroup !== 'all') {
      filtered = filtered.filter(customer => 
        customer.group_name?.toLowerCase().includes(customerFilterGroup.toLowerCase())
      );
    }

    // Dealer filter
    if (customerFilterDealer !== 'all') {
      filtered = filtered.filter(customer => 
        customerFilterDealer === 'dealers' ? customer.is_dealer : !customer.is_dealer
      );
    }

    // Kaart filter
    if (customerFilterMap !== 'all') {
      filtered = filtered.filter(customer => 
        customerFilterMap === 'visible' ? customer.show_on_map : !customer.show_on_map
      );
    }

    // Sortering
    filtered.sort((a, b) => {
      let aValue: any = a[customerSortField];
      let bValue: any = b[customerSortField];

      // Speciale behandeling voor naam (combineer bedrijfsnaam en persoonlijke naam)
      if (customerSortField === 'name') {
        aValue = (a.is_dealer && a.company_name ? a.company_name : a.name) || '';
        bValue = (b.is_dealer && b.company_name ? b.company_name : b.name) || '';
      }

      // String vergelijking
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (customerSortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  };

  const handleSort = (field: 'name' | 'email' | 'city' | 'group_name' | 'created_at') => {
    if (customerSortField === field) {
      setCustomerSortDirection(customerSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCustomerSortField(field);
      setCustomerSortDirection('asc');
    }
  };

  const validateVat = async (vat: string) => {
    if (!vat) return;
    setVatStatus('pending');
    setVatMessage('Bezig met valideren...');
    try {
      const res = await fetch('/api/vat-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vat })
      });
      const data = await res.json();
      if (data.valid) {
        setVatStatus('valid');
        setVatMessage('BTW-nummer is geldig!');
      } else {
        setVatStatus('invalid');
        setVatMessage('BTW-nummer is ongeldig.');
      }
    } catch {
      setVatStatus('invalid');
      setVatMessage('Fout bij valideren.');
    }
  };

  // Footer editor state
  const [footerHtml, setFooterHtml] = useState(footer?.html || '');
  // Header editor state
  const [headerHtml, setHeaderHtml] = useState(header?.html || '');
  // CMS-pagina editor state
  const [pageHtml, setPageHtml] = useState(editingPage?.content || '');
  const [showPageModal, setShowPageModal] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          {message && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gebruikersnaam</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="admin123"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Inloggen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar activeTab={activeTab} onNavigate={setActiveTab} />
      <main className="flex-1 p-6 bg-gray-50">
        {/* Header - Verborgen */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Uitloggen
          </button>
        </div>
        {/* Main Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Bestellingen</h3>
                  <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                  <p className="text-sm text-blue-700">Totaal bestellingen</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900">Klanten</h3>
                  <p className="text-3xl font-bold text-green-600">{customers.length}</p>
                  <p className="text-sm text-green-700">Totaal klanten</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900">Producten</h3>
                  <p className="text-3xl font-bold text-purple-600">{products.length}</p>
                  <p className="text-sm text-purple-700">Totaal producten</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900">Klantgroepen</h3>
                  <p className="text-3xl font-bold text-orange-600">{customerGroups.length}</p>
                  <p className="text-sm text-orange-700">Totaal groepen</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Bestellingen</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{order.total_amount?.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente Klanten</h3>
                <div className="space-y-3">
                  {customers.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{customer.group_name || 'Onbekend'}</p>
                        <p className="text-sm text-gray-600">{customer.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Bestellingen</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordernummer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totaal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{order.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.created_at ? new Date(order.created_at).toLocaleDateString('nl-NL') : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'afgerond' ? 'bg-green-100 text-green-800' :
                          order.status === 'klaar voor verzending' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'wachten op betaling' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">€{order.total_amount?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => {
                            // Load full order details from localStorage
                            const savedOrders = localStorage.getItem('orders')
                            if (savedOrders) {
                              const ordersData = JSON.parse(savedOrders)
                              const fullOrder = ordersData.find((o: any) => o.order_number === order.order_number)
                              if (fullOrder) {
                                alert(`Order Details:\n\nOrdernummer: ${fullOrder.order_number}\nKlant: ${fullOrder.customer?.voornaam || ''} ${fullOrder.customer?.achternaam || ''}\nEmail: ${fullOrder.customer?.email || 'Onbekend'}\nTelefoon: ${fullOrder.customer?.telefoon || 'Onbekend'}\nAdres: ${fullOrder.customer?.adres || 'Onbekend'}\nStad: ${fullOrder.customer?.plaats || 'Onbekend'}\nPostcode: ${fullOrder.customer?.postcode || 'Onbekend'}\nLand: ${fullOrder.customer?.land || 'Onbekend'}\n\nProducten:\n${fullOrder.items?.map((item: any) => `- ${item.name} (${item.quantity}x) €${item.price}`).join('\n') || 'Geen producten'}\n\nSubtotal: €${fullOrder.subtotal || 0}\nBTW: €${fullOrder.vat_amount || 0}\nVerzendkosten: €${fullOrder.shippingCost || 0}\nTotaal: €${fullOrder.total || 0}\n\nBetaalmethode: ${fullOrder.paymentMethod || 'Onbekend'}\nVerzendmethode: ${fullOrder.shippingMethod || 'Onbekend'}\nStatus: ${fullOrder.status || 'nieuw'}`)
                              } else {
                                alert('Order details niet gevonden')
                              }
                            } else {
                              alert('Geen orders gevonden')
                            }
                          }}
                        >
                          Bekijken
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => {
                            const newStatus = prompt(
                              'Selecteer nieuwe status:\n\n1. wachten op betaling\n2. klaar voor verzending\n3. afgerond\n\nVoer het nummer in (1, 2, of 3):'
                            );
                            
                            if (newStatus) {
                              let statusToSet = '';
                              switch(newStatus.trim()) {
                                case '1':
                                  statusToSet = 'wachten op betaling';
                                  break;
                                case '2':
                                  statusToSet = 'klaar voor verzending';
                                  break;
                                case '3':
                                  statusToSet = 'afgerond';
                                  break;
                                default:
                                  alert('Ongeldige keuze. Gebruik 1, 2, of 3.');
                                  return;
                              }
                              
                              // Update order status in localStorage
                              const savedOrders = localStorage.getItem('orders')
                              if (savedOrders) {
                                const ordersData = JSON.parse(savedOrders)
                                const orderIndex = ordersData.findIndex((o: any) => o.order_number === order.order_number)
                                if (orderIndex !== -1) {
                                  ordersData[orderIndex].status = statusToSet
                                  localStorage.setItem('orders', JSON.stringify(ordersData))
                                  fetchOrders() // Refresh the list
                                  alert(`Order status bijgewerkt naar: ${statusToSet}`)
                                } else {
                                  alert('Order niet gevonden')
                                }
                              }
                            }
                          }}
                        >
                          Status Wijzigen
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => {
                            if (confirm('Weet je zeker dat je deze order wilt verwijderen?')) {
                              // Remove from localStorage
                              const savedOrders = localStorage.getItem('orders')
                              if (savedOrders) {
                                const ordersData = JSON.parse(savedOrders)
                                const updatedOrders = ordersData.filter((o: any) => o.order_number !== order.order_number)
                                localStorage.setItem('orders', JSON.stringify(updatedOrders))
                                fetchOrders() // Refresh the list
                                alert('Order succesvol verwijderd!')
                              }
                            }
                          }}
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
        {activeTab === 'customers' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
              Debug: Customers sectie wordt gerenderd. Aantal klanten: {customers.length}
            </div>
            
            {/* Zoek- en filter sectie */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Zoekbalk */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zoeken</label>
                  <input
                    type="text"
                    placeholder="Naam, email, telefoon, stad..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Focus blijft op het veld, maar zoeken wordt geactiveerd
                        // De real-time filtering zorgt al voor de zoekresultaten
                      }
                    }}
                  />
                </div>
                
                {/* Groep filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klantgroep</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerFilterGroup}
                    onChange={(e) => setCustomerFilterGroup(e.target.value)}
                  >
                    <option value="all">Alle groepen</option>
                    <option value="goud">Goud Dealers</option>
                    <option value="zilver">Zilver Dealers</option>
                    <option value="brons">Brons Dealers</option>
                    <option value="particulieren">Particulieren</option>
                  </select>
                </div>
                
                {/* Dealer filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerFilterDealer}
                    onChange={(e) => setCustomerFilterDealer(e.target.value)}
                  >
                    <option value="all">Alle klanten</option>
                    <option value="dealers">Alleen dealers</option>
                    <option value="customers">Alleen particulieren</option>
                  </select>
                </div>
                
                {/* Kaart filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaart zichtbaarheid</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerFilterMap}
                    onChange={(e) => setCustomerFilterMap(e.target.value)}
                  >
                    <option value="all">Alle klanten</option>
                    <option value="visible">Zichtbaar op kaart</option>
                    <option value="hidden">Niet zichtbaar op kaart</option>
                  </select>
                </div>
              </div>
              
              {/* Resultaten teller en reset knop */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {getFilteredAndSortedCustomers().length} van {customers.length} klanten getoond
                </div>
                <button
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                  onClick={() => {
                    setCustomerSearchTerm('');
                    setCustomerFilterGroup('all');
                    setCustomerFilterDealer('all');
                    setCustomerFilterMap('all');
                    setCustomerSortField('name');
                    setCustomerSortDirection('asc');
                  }}
                >
                  Reset alle filters
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Klanten ({getFilteredAndSortedCustomers().length})</h2>
              <div className="flex space-x-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setShowImportModal(true)}
                >
                  Importeer CSV
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
                >
                  Nieuwe klant
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Naam/Bedrijf
                        {customerSortField === 'name' && (
                          <span className="ml-1">
                            {customerSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        E-mail
                        {customerSortField === 'email' && (
                          <span className="ml-1">
                            {customerSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefoon</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('city')}
                    >
                      <div className="flex items-center">
                        Stad
                        {customerSortField === 'city' && (
                          <span className="ml-1">
                            {customerSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Land</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('group_name')}
                    >
                      <div className="flex items-center">
                        Klantgroep
                        {customerSortField === 'group_name' && (
                          <span className="ml-1">
                            {customerSortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zichtbaar op Kaart</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredAndSortedCustomers().map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {customer.is_dealer && customer.company_name 
                              ? customer.company_name 
                              : customer.name}
                          </div>
                          {customer.is_dealer && customer.company_name && (
                            <div className="text-xs text-gray-500">
                              {customer.first_name} {customer.last_name}
                            </div>
                          )}
                          {!customer.is_dealer && (
                            <div className="text-xs text-gray-500">
                              {customer.first_name} {customer.last_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.city}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{customer.country}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.group_name?.toLowerCase().includes('goud') ? 'bg-yellow-100 text-yellow-800' :
                          customer.group_name?.toLowerCase().includes('zilver') ? 'bg-gray-100 text-gray-800' :
                          customer.group_name?.toLowerCase().includes('brons') ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.group_name || 'Onbekend'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${customer.show_on_map ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{customer.show_on_map ? 'Ja' : 'Nee'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => { 
                            setEditingCustomer(customer); 
                            setNewCustomer({
                              company_name: customer.company_name || '',
                              first_name: customer.first_name || '',
                              last_name: customer.last_name || '',
                              name: customer.name || '',
                              email: customer.email || '',
                              invoice_email: customer.invoice_email || customer.email || '',
                              phone: customer.phone || '',
                              address: customer.address || '',
                              city: customer.city || '',
                              postal_code: customer.postal_code || '',
                              country: customer.country || 'Nederland',
                              customer_group_id: customer.customer_group_id || 1,
                              is_dealer: customer.is_dealer || false,
                              website: customer.website || '',
                              show_on_map: customer.show_on_map || false,
                              vat_number: customer.vat_number || '',
                              vat_verified: customer.vat_verified || false,
                              vat_reverse_charge: customer.vat_reverse_charge || false,
                              lat: customer.lat || null,
                              lng: customer.lng || null,
                              separate_shipping_address: customer.separate_shipping_address || false,
                              shipping_address: customer.shipping_address || '',
                              shipping_city: customer.shipping_city || '',
                              shipping_postal_code: customer.shipping_postal_code || '',
                              shipping_country: customer.shipping_country || 'Nederland',
                              separate_invoice_email: !!(customer.invoice_email && customer.invoice_email !== customer.email)
                            });
                            setShowCustomerModal(true); 
                          }}
                        >
                          Bewerken
                        </button>

                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          onClick={() => {
                            setSelectedCustomerForShipping(customer);
                            setShowShippingAddressModal(true);
                          }}
                        >
                          Verzendadressen
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal isOpen={showCustomerModal} onClose={() => {
              setShowCustomerModal(false);
              setEditingCustomer(null);
              setNewCustomer({
                company_name: '',
                first_name: '',
                last_name: '',
                name: '',
                email: '',
                invoice_email: '',
                phone: '',
                address: '',
                city: '',
                postal_code: '',
                country: 'Nederland',
                customer_group_id: 1,
                is_dealer: false,
                website: '',
                show_on_map: false,
                vat_number: '',
                vat_verified: false,
                vat_reverse_charge: false,
                lat: null,
                lng: null,
                separate_shipping_address: false,
                shipping_address: '',
                shipping_city: '',
                shipping_postal_code: '',
                shipping_country: 'Nederland',
                separate_invoice_email: false
              });
            }} title={editingCustomer ? "Klant bewerken" : "Nieuwe klant toevoegen"}>
              <form className="space-y-4" onSubmit={handleAddCustomer}>
                {/* Voornaam, achternaam, bedrijfsnaam (alleen dealers) */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Voornaam</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.first_name} onChange={e => setNewCustomer({ ...newCustomer, first_name: e.target.value })} required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Achternaam</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.last_name} onChange={e => setNewCustomer({ ...newCustomer, last_name: e.target.value })} required />
                  </div>
                </div>
                {newCustomer.is_dealer && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Bedrijfsnaam *</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.company_name} onChange={e => setNewCustomer({ ...newCustomer, company_name: e.target.value })} required={newCustomer.is_dealer} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail</label>
                  <input type="email" className="w-full border rounded px-3 py-2" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} required />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="separate_invoice_email" 
                                            checked={newCustomer.separate_invoice_email ?? false} 
                    onChange={e => {
                      setNewCustomer({ 
                        ...newCustomer, 
                        separate_invoice_email: e.target.checked,
                        invoice_email: e.target.checked ? newCustomer.invoice_email : ''
                      });
                    }} 
                  />
                  <label htmlFor="separate_invoice_email" className="text-sm">Apart factuur email adres</label>
                </div>
                
                {newCustomer.separate_invoice_email && (
                  <div>
                    <label className="block text-sm font-medium mb-1">E-mail voor factuur</label>
                    <input 
                      type="email" 
                      className="w-full border rounded px-3 py-2" 
                      value={newCustomer.invoice_email} 
                      onChange={e => setNewCustomer({ ...newCustomer, invoice_email: e.target.value })} 
                      placeholder="Laat leeg om hoofdemail te gebruiken" 
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Telefoon</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adres</label>
                  <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Postcode</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.postal_code} onChange={e => setNewCustomer({ ...newCustomer, postal_code: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Stad</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.city} onChange={e => setNewCustomer({ ...newCustomer, city: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Land</label>
                  <select className="w-full border rounded px-3 py-2" value={newCustomer.country} onChange={e => setNewCustomer({ ...newCustomer, country: e.target.value })}>
                    <option value="Nederland">Nederland</option>
                    <option value="België">België</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Klantgroep</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={newCustomer.customer_group_id}
                    onChange={e => {
                      const selectedGroup = customerGroups.find(g => g.id === Number(e.target.value));
                      const isDealer = selectedGroup?.name?.toLowerCase().includes('dealer') || false;
                      setNewCustomer({ 
                        ...newCustomer, 
                        customer_group_id: Number(e.target.value),
                        is_dealer: isDealer,
                        show_on_map: selectedGroup?.show_on_map || false
                      });
                      console.log('Selected group:', selectedGroup?.name, 'Is dealer:', isDealer);
                    }}
                  >
                    {customerGroups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="is_dealer" 
                                            checked={newCustomer.is_dealer ?? false} 
                    onChange={e => setNewCustomer({ ...newCustomer, is_dealer: e.target.checked })} 
                  />
                  <label htmlFor="is_dealer" className="text-sm">Is dealer</label>
                </div>

                {newCustomer.is_dealer && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input type="text" className="w-full border rounded px-3 py-2" value={newCustomer.website} onChange={e => setNewCustomer({ ...newCustomer, website: e.target.value })} />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="show_on_map" 
                                            checked={newCustomer.show_on_map ?? false} 
                    onChange={e => setNewCustomer({ ...newCustomer, show_on_map: e.target.checked })} 
                  />
                  <label htmlFor="show_on_map" className="text-sm">Zichtbaar op kaart</label>
                </div>
                
                {newCustomer.show_on_map && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Latitude</label>
                        <input 
                          type="number" 
                          step="any"
                          className="w-full border rounded px-3 py-2" 
                          value={newCustomer.lat || ''} 
                          onChange={e => setNewCustomer({ ...newCustomer, lat: e.target.value ? parseFloat(e.target.value) : null })} 
                          placeholder="52.3676"
                          readOnly={false}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Longitude</label>
                        <input 
                          type="number" 
                          step="any"
                          className="w-full border rounded px-3 py-2" 
                          value={newCustomer.lng || ''} 
                          onChange={e => setNewCustomer({ ...newCustomer, lng: e.target.value ? parseFloat(e.target.value) : null })} 
                          placeholder="4.9041"
                          readOnly={false}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                        onClick={async () => {
                          const address = `${newCustomer.address || ''}, ${newCustomer.postal_code || ''} ${newCustomer.city || ''}, ${newCustomer.country || 'Nederland'}`.trim();
                          if (address && address !== ', , ') {
                            try {
                              const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
                              const data = await response.json();
                              if (response.ok && data.lat && data.lng) {
                                // Update newCustomer state with coordinates
                                const updatedCustomer = { 
                                  ...newCustomer, 
                                  lat: data.lat, 
                                  lng: data.lng 
                                };
                                setNewCustomer(updatedCustomer);
                                
                                alert(`Locatie gevonden: ${data.formatted_address}\nCoördinaten: ${data.lat}, ${data.lng}`);
                              } else {
                                // Show specific error message from API
                                const errorMessage = data.message || data.error || 'Locatie niet gevonden. Controleer het adres.';
                                alert(`Geocoding fout: ${errorMessage}\n\nProbeer het adres handmatig in te voeren of een ander adres te gebruiken.`);
                              }
                            } catch (error) {
                              console.error('Geocoding error:', error);
                              alert('Netwerkfout bij het zoeken van locatie. Controleer uw internetverbinding.');
                            }
                          } else {
                            alert('Vul eerst een adres in.');
                          }
                        }}
                      >
                        🔍 Update locatie
                      </button>
                      <p className="text-xs text-gray-600 mt-1">
                        Klik om automatisch coördinaten op te halen op basis van het adres
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">BTW-nummer</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      className={`w-full border rounded px-3 py-2 ${vatStatus === 'valid' ? 'border-green-500' : vatStatus === 'invalid' ? 'border-red-500' : ''}`}
                      value={editingCustomer?.vat_number || newCustomer.vat_number}
                      onChange={e => {
                        setNewCustomer({ ...newCustomer, vat_number: e.target.value.toUpperCase() });
                        setVatStatus('');
                        setVatMessage('');
                        setVatButtonColor('default');
                      }}
                    />
                    <button
                      type="button"
                      className={`px-3 py-2 rounded font-semibold ${vatButtonColor === 'green' ? 'bg-green-600 text-white' : vatButtonColor === 'red' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      onClick={handleVatCheck}
                    >
                      Verifieer bij VIES
                    </button>
                  </div>
                  {vatStatus && (
                    <p className={`text-xs mt-1 ${vatStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>{vatMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="vat_reverse_charge" checked={editingCustomer?.vat_reverse_charge || newCustomer.vat_reverse_charge} onChange={e => setNewCustomer({ ...newCustomer, vat_reverse_charge: e.target.checked })} />
                  <label htmlFor="vat_reverse_charge" className="text-sm">BTW verlegd</label>
                </div>

                {/* Verzendadres sectie */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-4">Verzendadres</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="checkbox" 
                      id="separate_shipping_address" 
                                              checked={newCustomer.separate_shipping_address ?? false} 
                      onChange={e => setNewCustomer({ ...newCustomer, separate_shipping_address: e.target.checked })} 
                    />
                    <label htmlFor="separate_shipping_address" className="text-sm">Apart verzendadres gebruiken</label>
                  </div>

                  {!newCustomer.separate_shipping_address ? (
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                      <p>Verzendadres is gelijk aan factuuradres:</p>
                      <p className="font-medium mt-1">
                        {newCustomer.address}, {newCustomer.postal_code} {newCustomer.city}, {newCustomer.country}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Verzendadres</label>
                        <input 
                          type="text" 
                          className="w-full border rounded px-3 py-2" 
                          value={newCustomer.shipping_address} 
                          onChange={e => setNewCustomer({ ...newCustomer, shipping_address: e.target.value })} 
                          required={newCustomer.separate_shipping_address}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Postcode</label>
                          <input 
                            type="text" 
                            className="w-full border rounded px-3 py-2" 
                            value={newCustomer.shipping_postal_code} 
                            onChange={e => setNewCustomer({ ...newCustomer, shipping_postal_code: e.target.value })} 
                            required={newCustomer.separate_shipping_address}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Plaats</label>
                          <input 
                            type="text" 
                            className="w-full border rounded px-3 py-2" 
                            value={newCustomer.shipping_city} 
                            onChange={e => setNewCustomer({ ...newCustomer, shipping_city: e.target.value })} 
                            required={newCustomer.separate_shipping_address}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Land</label>
                        <select 
                          className="w-full border rounded px-3 py-2" 
                          value={newCustomer.shipping_country} 
                          onChange={e => setNewCustomer({ ...newCustomer, shipping_country: e.target.value })}
                        >
                          <option value="Nederland">Nederland</option>
                          <option value="België">België</option>
                          <option value="Duitsland">Duitsland</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowCustomerModal(false)}>Annuleren</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Toevoegen</button>
                </div>
              </form>
            </Modal>
          </div>
        )}
        {activeTab === 'categories' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Categorieën</h2>
            <p>Hier kun je categorieën beheren (API nog toevoegen indien beschikbaar).</p>
          </div>
        )}
        {activeTab === 'customer-groups' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Klantgroepen</h2>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => { setEditingCustomerGroup(null); setNewCustomerGroup({ name: '', description: '', discount_percentage: 0, show_on_map: false }); setShowCustomerGroupModal(true); }}
              >
                Nieuwe klantgroep
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beschrijving</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korting %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerGroups.map((group) => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{group.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{group.discount_percentage}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => { 
                            setEditingCustomerGroup(group); 
                            setNewCustomerGroup({
                              name: group.name,
                              description: group.description,
                              discount_percentage: group.discount_percentage,
                              show_on_map: group.show_on_map || false
                            }); 
                            setShowCustomerGroupModal(true); 
                          }}
                        >
                          Bewerken
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteCustomerGroup(group.id)}
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal isOpen={showCustomerGroupModal} onClose={() => setShowCustomerGroupModal(false)} title={editingCustomerGroup ? "Klantgroep bewerken" : "Nieuwe klantgroep toevoegen"}>
              <form className="space-y-4" onSubmit={editingCustomerGroup ? handleUpdateCustomerGroup : handleAddCustomerGroup}>
                <div>
                  <label className="block text-sm font-medium mb-1">Naam</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newCustomerGroup.name} 
                    onChange={e => setNewCustomerGroup({ ...newCustomerGroup, name: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beschrijving</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2" 
                    value={newCustomerGroup.description} 
                    onChange={e => setNewCustomerGroup({ ...newCustomerGroup, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Korting percentage</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    className="w-full border rounded px-3 py-2" 
                    value={newCustomerGroup.discount_percentage} 
                    onChange={e => setNewCustomerGroup({ ...newCustomerGroup, discount_percentage: Number(e.target.value) })} 
                    required 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="show_on_map" 
                    checked={newCustomerGroup.show_on_map || false} 
                    onChange={e => setNewCustomerGroup({ ...newCustomerGroup, show_on_map: e.target.checked })} 
                  />
                  <label htmlFor="show_on_map" className="text-sm">Laat zien op kaart</label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowCustomerGroupModal(false)}>Annuleren</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                    {editingCustomerGroup ? 'Bijwerken' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        )}
        {activeTab === 'products' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Producten</h2>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => { 
                  setEditingProduct(null); 
                  setNewProduct({
                    sku: '',
                    name: '',
                    short_description: '',
                    description: '',
                    price: 0,
                    cost: 0,
                    category: '',
                    stock: 0,
                    weight: 0,
                    colour: '',
                    ean: '',
                    image: null,
                    meta_title: '',
                    meta_keywords: '',
                    meta_description: ''
                  }); 
                  setShowProductModal(true); 
                }}
              >
                Nieuw product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prijs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voorraad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap">€{product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? 'Actief' : 'Inactief'}
                          </span>
                          {product.is_featured && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Uitgelicht
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => { 
                            setEditingProduct(product); 
                            setNewProduct({
                              sku: product.sku,
                              name: product.name,
                              short_description: product.short_description,
                              description: product.description,
                              price: product.price,
                              cost: product.cost,
                              category: product.category,
                              stock: product.stock,
                              weight: product.weight,
                              colour: product.colour,
                              ean: product.ean,
                              image: product.image,
                              meta_title: product.meta_title,
                              meta_keywords: product.meta_keywords,
                              meta_description: product.meta_description
                            }); 
                            setShowProductModal(true); 
                          }}
                        >
                          Bewerken
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title={editingProduct ? "Product bewerken" : "Nieuw product toevoegen"}>
              <form className="space-y-4" onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input 
                      type="text" 
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.sku} 
                      onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Naam</label>
                    <input 
                      type="text" 
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.name} 
                      onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Korte beschrijving</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.short_description} 
                    onChange={e => setNewProduct({ ...newProduct, short_description: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beschrijving</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.description} 
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prijs (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.price} 
                      onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kostprijs (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.cost} 
                      onChange={e => setNewProduct({ ...newProduct, cost: Number(e.target.value) })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Voorraad</label>
                    <input 
                      type="number" 
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.stock} 
                      onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Categorie</label>
                    <input 
                      type="text" 
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kleur</label>
                    <input 
                      type="text" 
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.colour} 
                      onChange={e => setNewProduct({ ...newProduct, colour: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Gewicht (kg)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full border rounded px-3 py-2" 
                      value={newProduct.weight} 
                      onChange={e => setNewProduct({ ...newProduct, weight: Number(e.target.value) })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">EAN</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.ean} 
                    onChange={e => setNewProduct({ ...newProduct, ean: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Afbeelding URL</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.image || ''} 
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta titel</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.meta_title} 
                    onChange={e => setNewProduct({ ...newProduct, meta_title: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta keywords</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.meta_keywords} 
                    onChange={e => setNewProduct({ ...newProduct, meta_keywords: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta beschrijving</label>
                  <textarea 
                    className="w-full border rounded px-3 py-2" 
                    value={newProduct.meta_description} 
                    onChange={e => setNewProduct({ ...newProduct, meta_description: e.target.value })}
                    rows={2}
                  />
                </div>
                
                {/* Nieuwe sectie: Product Status */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Product Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="is_active" 
                        checked={newProduct.is_active ?? true} 
                        onChange={e => setNewProduct({ ...newProduct, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="is_active" className="text-sm">Actief product</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="is_featured" 
                        checked={newProduct.is_featured ?? false} 
                        onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="is_featured" className="text-sm">Uitgelicht product</label>
                    </div>
                  </div>
                </div>

                {/* Nieuwe sectie: Verkoop & Verzending */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Verkoop & Verzending</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">BTW categorie</label>
                      <select 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.vat_category} 
                        onChange={e => setNewProduct({ ...newProduct, vat_category: e.target.value })} 
                      >
                        <option value="standard">Standaard BTW</option>
                        <option value="reduced">Verlaagd BTW</option>
                        <option value="zero">0% BTW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Verzendklasse</label>
                      <select 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.shipping_class} 
                        onChange={e => setNewProduct({ ...newProduct, shipping_class: e.target.value })}
                      >
                        <option value="standard">Standaard</option>
                        <option value="express">Express</option>
                        <option value="heavy">Zwaar</option>
                        <option value="free">Gratis verzending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Min. bestelhoeveelheid</label>
                      <input 
                        type="number" 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.min_order_quantity} 
                        onChange={e => setNewProduct({ ...newProduct, min_order_quantity: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Max. bestelhoeveelheid</label>
                      <input 
                        type="number" 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.max_order_quantity} 
                        onChange={e => setNewProduct({ ...newProduct, max_order_quantity: Number(e.target.value) })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Afmetingen (LxBxH cm)</label>
                      <input 
                        type="text" 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.dimensions} 
                        onChange={e => setNewProduct({ ...newProduct, dimensions: e.target.value })} 
                        placeholder="30x20x5"
                      />
                    </div>
                  </div>
                </div>

                {/* Nieuwe sectie: Product Details */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">Product Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Materiaal</label>
                      <input 
                        type="text" 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.material} 
                        onChange={e => setNewProduct({ ...newProduct, material: e.target.value })} 
                        placeholder="Kunststof, Metaal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Garantie</label>
                      <input 
                        type="text" 
                        className="w-full border rounded px-3 py-2" 
                        value={newProduct.warranty} 
                        onChange={e => setNewProduct({ ...newProduct, warranty: e.target.value })} 
                        placeholder="2 jaar"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowProductModal(false)}>Annuleren</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                    {editingProduct ? 'Bijwerken' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </Modal>
          </div>
        )}
        {activeTab === 'cms' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">CMS-pagina's</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pages.map((page) => (
                    <tr key={page.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{page.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{page.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {page.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => { setEditingPage(page); setPageHtml(page.content || ''); setShowPageModal(true); }}
                        >
                          Bewerken
                        </button>
                        <button className="text-red-600 hover:text-red-900">Verwijderen</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showPageModal && editingPage && (
              <Modal isOpen={showPageModal} onClose={() => setShowPageModal(false)} title="Pagina bewerken">
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch('/api/cms-pages', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: editingPage.id, content: pageHtml })
                    });
                    setShowPageModal(false);
                    fetchPages();
                  }}
                >
                  <div>
                    <label className="block text-sm font-medium mb-1">Pagina HTML</label>
                                            <ReactQuill value={pageHtml} onChange={setPageHtml} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowPageModal(false)}>Annuleren</button>
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Opslaan</button>
                  </div>
                </form>
              </Modal>
            )}
          </div>
        )}
        {activeTab === 'homepage' && homepage && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Homepage</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(homepage, null, 2)}</pre>
          </div>
        )}
        {activeTab === 'footer' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Footer</h2>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded mb-4"
              onClick={() => { 
                setFooterHtml(footer?.html || ''); 
                setShowFooterModal(true); 
              }}
            >
              Footer bewerken
            </button>
            {footer && (
              <div className="bg-gray-100 p-4 rounded text-xs overflow-x-auto" dangerouslySetInnerHTML={{ __html: footer.html || '' }} />
            )}
            <Modal isOpen={showFooterModal} onClose={() => setShowFooterModal(false)} title="Footer bewerken">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const footerData = { html: footerHtml };
                    if (footer?.id) {
                      await FirebaseClientService.updateDocument('footer', footer.id, footerData)
                    } else {
                      await FirebaseClientService.addDocument('footer', footerData)
                    }
                    setShowFooterModal(false);
                    fetchFooter();
                    alert('Footer succesvol opgeslagen!');
                  } catch (error) {
                    console.error('Error saving footer:', error);
                    alert('Fout bij opslaan van footer');
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Footer HTML</label>
                  <textarea
                    value={footerHtml}
                    onChange={(e) => setFooterHtml(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Voer hier je footer HTML in..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowFooterModal(false)}>Annuleren</button>
                  <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Opslaan</button>
                </div>
              </form>
            </Modal>
          </div>
        )}
        {activeTab === 'crm' && (
          <CustomerCRM />
        )}
        {activeTab === 'header' && (
          <HeaderManager />
        )}
        {activeTab === 'uploads' && (
          <UploadManager />
        )}
        {activeTab === 'settings' && settings && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Algemene Instellingen</h2>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedSettings = {
                  site_name: formData.get('site_name') as string,
                  site_description: formData.get('site_description') as string,
                  contact_email: formData.get('contact_email') as string,
                  contact_phone: formData.get('contact_phone') as string,
                  social_facebook: formData.get('social_facebook') as string,
                  social_instagram: formData.get('social_instagram') as string,
                  social_linkedin: formData.get('social_linkedin') as string,
                  analytics_google: formData.get('analytics_google') as string,
                };
                
                if (settings?.id) {
                  await FirebaseClientService.updateDocument('settings', settings.id, updatedSettings)
                } else {
                  await FirebaseClientService.addDocument('settings', updatedSettings)
                }
                
                fetchSettings();
                alert('Instellingen opgeslagen!');
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Naam</label>
                  <input
                    type="text"
                    name="site_name"
                    defaultValue={settings.site_name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Site Beschrijving</label>
                  <textarea
                    name="site_description"
                    defaultValue={settings.site_description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    defaultValue={settings.contact_email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Telefoon</label>
                  <input
                    type="text"
                    name="contact_phone"
                    defaultValue={settings.contact_phone}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook URL</label>
                  <input
                    type="url"
                    name="social_facebook"
                    defaultValue={settings.social_facebook}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram URL</label>
                  <input
                    type="url"
                    name="social_instagram"
                    defaultValue={settings.social_instagram}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    name="social_linkedin"
                    defaultValue={settings.social_linkedin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Google Analytics ID</label>
                  <input
                    type="text"
                    name="analytics_google"
                    defaultValue={settings.analytics_google}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Instellingen Opslaan
                </button>
              </div>
            </form>
          </div>
        )}
        
        {activeTab === 'map-settings' && settings && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Kaart Instellingen</h2>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updatedSettings = {
                  google_maps_api_key: formData.get('google_maps_api_key') as string,
                  map_center_lat: parseFloat(formData.get('map_center_lat') as string),
                  map_center_lng: parseFloat(formData.get('map_center_lng') as string),
                  map_zoom: parseInt(formData.get('map_zoom') as string),
                };
                
                await fetch('/api/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(updatedSettings)
                });
                
                fetchSettings();
                alert('Kaart instellingen opgeslagen!');
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Google Maps API Key</label>
                  <input
                    type="text"
                    name="google_maps_api_key"
                    defaultValue={settings.google_maps_api_key}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="AIzaSy..."
                  />
                  <p className="text-xs text-gray-500 mt-1">API key voor Google Maps functionaliteit</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Kaart Centrum Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="map_center_lat"
                    defaultValue={settings.map_center_lat}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="51.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Latitude van het centrum van de kaart</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Kaart Centrum Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    name="map_center_lng"
                    defaultValue={settings.map_center_lng}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="4.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Longitude van het centrum van de kaart</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Kaart Zoom Level</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    name="map_zoom"
                    defaultValue={settings.map_zoom}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="6"
                  />
                  <p className="text-xs text-gray-500 mt-1">Zoom level van de kaart (1-20)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Standaard Zoekradius (km)</label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    name="search_radius"
                    defaultValue={settings.search_radius}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="25"
                  />
                  <p className="text-xs text-gray-500 mt-1">Standaard zoekradius voor dealer zoekfunctie</p>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Kaart Instellingen Opslaan
                </button>
              </div>
            </form>
          </div>
        )}
        {activeTab === 'vat-settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">BTW Instellingen</h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setShowVatSettingsModal(true)}
              >
                BTW Instellingen Beheren
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">BTW Systeem Overzicht</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Automatische BTW Berekening:</strong> Het systeem berekent automatisch BTW op basis van klantland en BTW nummer</p>
                <p><strong>BTW Verlegging:</strong> EU bedrijven met geldig BTW nummer krijgen 0% BTW (BTW verlegd)</p>
                <p><strong>Prijzen Weergave:</strong> Dealers zien prijzen exclusief BTW, particulieren inclusief BTW</p>
                <p><strong>Backend Prijzen:</strong> Alle prijzen in de backend worden ingevoerd exclusief BTW</p>
                <p><strong>Land-specifieke Tarieven:</strong> BTW tarieven kunnen per land worden ingesteld</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'dhl-settings' && (
          <DhlParcelSettings />
        )}
        {activeTab === 'shipping-settings' && (
          <ShippingSettings />
        )}
        {activeTab === 'payment-settings' && (
          <PaymentSettings />
        )}
        {activeTab === 'database' && (
          <DatabaseViewer />
        )}
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <CustomerImport
          onImport={handleImportCustomers}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Shipping Address Modal */}
      {showShippingAddressModal && selectedCustomerForShipping && (
        <ShippingAddressManager
          customerId={selectedCustomerForShipping.id}
          customerName={selectedCustomerForShipping.company_name || selectedCustomerForShipping.name}
          onClose={() => {
            setShowShippingAddressModal(false);
            setSelectedCustomerForShipping(null);
          }}
        />
      )}

      

              {/* VAT Settings Modal */}
        {showVatSettingsModal && (
          <VatSettings />
        )}
    </div>
  )
} 