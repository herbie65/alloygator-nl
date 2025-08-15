const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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

async function restoreFirebaseData() {
  console.log('🔥 Herstellen van Firebase data...');

  try {
    // 1. Herstel Settings
    console.log('📋 Herstellen van Settings...');
    const settingsData = {
      google_maps_api_key: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
      map_center_lat: 52.3676,
      map_center_lng: 4.9041,
      map_zoom: 7,
      search_radius: 25,
      site_name: "AlloyGator",
      site_description: "Professionele montagehulpmiddelen voor auto's",
      contact_email: "info@alloygator.nl",
      contact_phone: "+31 20 123 4567",
      social_facebook: "https://facebook.com/alloygator",
      social_instagram: "https://instagram.com/alloygator",
      social_linkedin: "https://linkedin.com/company/alloygator",
      analytics_google: "G-QY0QVXYJ5H",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'settings'), settingsData);
    console.log('✅ Settings hersteld');

    // 2. Herstel Customer Groups
    console.log('👥 Herstellen van Customer Groups...');
    const customerGroups = [
      {
        name: "Particulieren",
        description: "Reguliere klanten",
        discount_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Dealers",
        description: "Autodealers en garages",
        discount_percentage: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Groothandel",
        description: "Groothandel en importeurs",
        discount_percentage: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Onbekend",
        description: "Nog niet ingedeeld",
        discount_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const group of customerGroups) {
      await addDoc(collection(db, 'customer_groups'), group);
    }
    console.log('✅ Customer Groups hersteld');

    // 3. Herstel VAT Settings
    console.log('💰 Herstellen van VAT Settings...');
    const vatSettings = [
      {
        country_code: "NL",
        vat_rate: 21,
        category: "standard",
        description: "Standaard BTW Nederland",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        country_code: "BE",
        vat_rate: 21,
        category: "standard",
        description: "Standaard BTW België",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        country_code: "DE",
        vat_rate: 19,
        category: "standard",
        description: "Standaard BTW Duitsland",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const vatSetting of vatSettings) {
      await addDoc(collection(db, 'vat_settings'), vatSetting);
    }
    console.log('✅ VAT Settings hersteld');

    // 4. Herstel Shipping Settings
    console.log('🚚 Herstellen van Shipping Settings...');
    const shippingSettings = [
      {
        name: "Standaard Verzending",
        description: "2-3 werkdagen",
        price: 5.95,
        free_from: 50,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Express Verzending",
        description: "1 werkdag",
        price: 12.95,
        free_from: 100,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Gratis Verzending",
        description: "Gratis vanaf €50",
        price: 0,
        free_from: 50,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const shippingSetting of shippingSettings) {
      await addDoc(collection(db, 'shipping_settings'), shippingSetting);
    }
    console.log('✅ Shipping Settings hersteld');

    // 5. Herstel Payment Settings
    console.log('💳 Herstellen van Payment Settings...');
    const paymentSettings = {
      mollie_api_key: "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      mollie_test_mode: true,
      supported_methods: ["ideal", "creditcard", "paypal", "banktransfer"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'payment_settings'), paymentSettings);
    console.log('✅ Payment Settings hersteld');

    // 6. Herstel DHL Settings
    console.log('📦 Herstellen van DHL Settings...');
    const dhlSettings = {
      api_key: "test_dhl_api_key",
      test_mode: true,
      service_point_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'dhl_settings'), dhlSettings);
    console.log('✅ DHL Settings hersteld');

    // 7. Herstel Header Settings
    console.log('🎨 Herstellen van Header Settings...');
    const headerSettings = {
      logo_url: "",
      logo_text: "AlloyGator",
      show_cart: true,
      show_login: true,
      show_dealer_login: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'header_settings'), headerSettings);
    console.log('✅ Header Settings hersteld');

    // 8. Herstel Company Info
    console.log('🏢 Herstellen van Company Info...');
    const companyInfo = {
      name: "AlloyGator",
      address: "Hoofdstraat 123",
      city: "Amsterdam",
      postal_code: "1000 AA",
      country: "Nederland",
      phone: "+31 20 123 4567",
      email: "info@alloygator.nl",
      website: "https://alloygator.nl",
      kvk_number: "12345678",
      btw_number: "NL123456789B01",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await addDoc(collection(db, 'company_info'), companyInfo);
    console.log('✅ Company Info hersteld');

    console.log('\n🎉 Alle Firebase data succesvol hersteld!');
    console.log('\n📋 Herstelde collecties:');
    console.log('  - settings');
    console.log('  - customer_groups');
    console.log('  - vat_settings');
    console.log('  - shipping_settings');
    console.log('  - payment_settings');
    console.log('  - dhl_settings');
    console.log('  - header_settings');
    console.log('  - company_info');

  } catch (error) {
    console.error('❌ Fout bij herstellen van data:', error);
  }
}

restoreFirebaseData().catch(console.error); 