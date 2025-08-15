const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addMissingData() {
  console.log('🔥 Toevoegen van ontbrekende data...');

  try {
    // 1. CMS Pages
    console.log('📄 Toevoegen van CMS Pages...');
    const cmsPages = [
      {
        slug: "about",
        title: "Over Ons",
        content: "<h1>Over AlloyGator</h1><p>AlloyGator is uw partner voor professionele montagehulpmiddelen voor auto's.</p>",
        meta_description: "Over AlloyGator - Professionele montagehulpmiddelen voor auto's",
        meta_keywords: "alloygator, montagehulpmiddelen, auto, professioneel",
        image: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        slug: "contact",
        title: "Contact",
        content: "<h1>Contact</h1><p>Neem contact met ons op voor meer informatie.</p>",
        meta_description: "Contact AlloyGator - Neem contact met ons op",
        meta_keywords: "contact, alloygator, informatie",
        image: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        slug: "privacy",
        title: "Privacy Policy",
        content: "<h1>Privacy Policy</h1><p>Onze privacy policy en cookie gebruik.</p>",
        meta_description: "Privacy Policy AlloyGator",
        meta_keywords: "privacy, policy, cookies",
        image: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        slug: "terms",
        title: "Algemene Voorwaarden",
        content: "<h1>Algemene Voorwaarden</h1><p>Onze algemene voorwaarden voor aankopen.</p>",
        meta_description: "Algemene Voorwaarden AlloyGator",
        meta_keywords: "voorwaarden, algemeen, aankoop",
        image: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const page of cmsPages) {
      await addDoc(collection(db, 'cms_pages'), page);
    }
    console.log('✅ CMS Pages toegevoegd');

    // 2. Homepage
    console.log('🏠 Toevoegen van Homepage...');
    const homepage = {
      hero_title: "Professionele Montagehulpmiddelen",
      hero_subtitle: "Voor auto's en vrachtwagens",
      hero_image: "",
      featured_products: [],
      about_section: {
        title: "Over AlloyGator",
        content: "Wij zijn gespecialiseerd in hoogwaardige montagehulpmiddelen voor de automotive industrie."
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'homepage'), homepage);
    console.log('✅ Homepage toegevoegd');

    // 3. Footer
    console.log('🦶 Toevoegen van Footer...');
    const footer = {
      company_info: {
        name: "AlloyGator",
        address: "Hoofdstraat 123",
        city: "Amsterdam",
        postal_code: "1000 AA",
        phone: "+31 20 123 4567",
        email: "info@alloygator.nl"
      },
      links: [
        { title: "Over Ons", url: "/about" },
        { title: "Contact", url: "/contact" },
        { title: "Privacy", url: "/privacy" },
        { title: "Voorwaarden", url: "/terms" }
      ],
      social_links: [
        { platform: "facebook", url: "https://facebook.com/alloygator" },
        { platform: "instagram", url: "https://instagram.com/alloygator" },
        { platform: "linkedin", url: "https://linkedin.com/company/alloygator" }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'footer'), footer);
    console.log('✅ Footer toegevoegd');

    // 4. Sample Orders
    console.log('📦 Toevoegen van Sample Orders...');
    const orders = [
      {
        order_number: "ORD-2024-001",
        customer_name: "AutoDealer Amsterdam",
        customer_id: "sample-customer-1",
        status: "completed",
        total_amount: 1250.00,
        items: [
          {
            product_id: "sample-product-1",
            name: "AlloyGator Set",
            quantity: 2,
            price: 625.00
          }
        ],
        shipping_address: "Hoofdstraat 123, Amsterdam",
        billing_address: "Hoofdstraat 123, Amsterdam",
        payment_method: "ideal",
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        order_number: "ORD-2024-002",
        customer_name: "Garage Rotterdam",
        customer_id: "sample-customer-2",
        status: "processing",
        total_amount: 850.00,
        items: [
          {
            product_id: "sample-product-2",
            name: "Montagehulpmiddelen",
            quantity: 1,
            price: 850.00
          }
        ],
        shipping_address: "Rotterdamstraat 456, Rotterdam",
        billing_address: "Rotterdamstraat 456, Rotterdam",
        payment_method: "creditcard",
        payment_status: "paid",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const order of orders) {
      await addDoc(collection(db, 'orders'), order);
    }
    console.log('✅ Sample Orders toegevoegd');

    // 5. Sample Products
    console.log('📦 Toevoegen van Sample Products...');
    const products = [
      {
        sku: "AG-SET-001",
        name: "AlloyGator Complete Set",
        short_description: "Complete set voor professioneel gebruik",
        description: "Een complete set met alle benodigde hulpmiddelen voor het monteren van velgen.",
        price: 625.00,
        cost: 450.00,
        category: "sets",
        stock: 50,
        weight: 2.5,
        colour: "Zwart",
        ean: "8712345678901",
        image: null,
        meta_title: "AlloyGator Complete Set - Professioneel",
        meta_keywords: "alloygator, set, professioneel, velgen",
        meta_description: "Complete AlloyGator set voor professioneel gebruik",
        is_active: true,
        is_featured: true,
        vat_category: "standard",
        dimensions: "30x20x10",
        material: "Hoogwaardig staal",
        warranty: "2 jaar",
        shipping_class: "standard",
        min_order_quantity: 1,
        max_order_quantity: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        sku: "AG-TOOL-001",
        name: "Professionele Montagehulpmiddelen",
        short_description: "Hoogwaardige hulpmiddelen voor garages",
        description: "Professionele hulpmiddelen voor het monteren van velgen in garages.",
        price: 850.00,
        cost: 600.00,
        category: "tools",
        stock: 25,
        weight: 3.0,
        colour: "Rood",
        ean: "8712345678902",
        image: null,
        meta_title: "Professionele Montagehulpmiddelen",
        meta_keywords: "montagehulpmiddelen, professioneel, garage",
        meta_description: "Hoogwaardige montagehulpmiddelen voor professioneel gebruik",
        is_active: true,
        is_featured: false,
        vat_category: "standard",
        dimensions: "40x25x15",
        material: "Gevormd staal",
        warranty: "3 jaar",
        shipping_class: "heavy",
        min_order_quantity: 1,
        max_order_quantity: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const product of products) {
      await addDoc(collection(db, 'products'), product);
    }
    console.log('✅ Sample Products toegevoegd');

    // 6. Sample Customers
    console.log('👥 Toevoegen van Sample Customers...');
    const customers = [
      {
        name: "AutoDealer Amsterdam",
        email: "info@autodealer-amsterdam.nl",
        phone: "+31 20 123 4567",
        address: "Hoofdstraat 123",
        city: "Amsterdam",
        postal_code: "1000 AA",
        country: "Nederland",
        customer_group_id: "dealers-group-id",
        group_name: "Dealers",
        is_dealer: true,
        show_on_map: true,
        vat_number: "NL123456789B01",
        vat_verified: true,
        vat_reverse_charge: true,
        lat: 52.3676,
        lng: 4.9041,
        total_orders: 15,
        total_spent: 12500.00,
        first_name: "Jan",
        last_name: "Jansen",
        company_name: "AutoDealer Amsterdam",
        invoice_email: "facturen@autodealer-amsterdam.nl",
        website: "https://autodealer-amsterdam.nl",
        separate_shipping_address: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Garage Rotterdam",
        email: "info@garage-rotterdam.nl",
        phone: "+31 10 987 6543",
        address: "Rotterdamstraat 456",
        city: "Rotterdam",
        postal_code: "3000 BB",
        country: "Nederland",
        customer_group_id: "dealers-group-id",
        group_name: "Dealers",
        is_dealer: true,
        show_on_map: true,
        vat_number: "NL987654321B02",
        vat_verified: true,
        vat_reverse_charge: true,
        lat: 51.9225,
        lng: 4.4792,
        total_orders: 8,
        total_spent: 6800.00,
        first_name: "Piet",
        last_name: "Pietersen",
        company_name: "Garage Rotterdam",
        invoice_email: "facturen@garage-rotterdam.nl",
        website: "https://garage-rotterdam.nl",
        separate_shipping_address: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    let nextCustomerNumber = 2000;
    for (const customer of customers) {
      const customerId = `#${nextCustomerNumber}`;
      const customerWithId = { ...customer, id: customerId };
      
      // Use setDoc with custom ID instead of addDoc
      const customerRef = doc(db, 'customers', customerId);
      await setDoc(customerRef, customerWithId);
      
      nextCustomerNumber++;
    }
    console.log('✅ Sample Customers toegevoegd');

    console.log('\n🎉 Alle ontbrekende data succesvol toegevoegd!');
    console.log('\n📋 Toegevoegde data:');
    console.log('  - CMS Pages (4 pagina\'s)');
    console.log('  - Homepage');
    console.log('  - Footer');
    console.log('  - Sample Orders (2 bestellingen)');
    console.log('  - Sample Products (2 producten)');
    console.log('  - Sample Customers (2 klanten)');

  } catch (error) {
    console.error('❌ Fout bij toevoegen van data:', error);
  }
}

addMissingData().catch(console.error); 