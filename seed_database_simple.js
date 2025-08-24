const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. VAT Settings Collection
const seedVatSettings = async () => {
  console.log('💰 Seeding VAT Settings...');
  
  const vatSettings = [
    {
      id: 'vat_nl',
      country_code: 'NL',
      country_name: 'Nederland',
      standard_rate: 21,
      reduced_rate: 9,
      zero_rate: 0,
      is_eu_member: true,
      reverse_charge_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'vat_be',
      country_code: 'BE',
      country_name: 'België',
      standard_rate: 21,
      reduced_rate: 12,
      zero_rate: 0,
      is_eu_member: true,
      reverse_charge_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'vat_de',
      country_code: 'DE',
      country_name: 'Duitsland',
      standard_rate: 19,
      reduced_rate: 7,
      zero_rate: 0,
      is_eu_member: true,
      reverse_charge_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'vat_fr',
      country_code: 'FR',
      country_name: 'Frankrijk',
      standard_rate: 20,
      reduced_rate: 10,
      zero_rate: 0,
      is_eu_member: true,
      reverse_charge_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'vat_gb',
      country_code: 'GB',
      country_name: 'Verenigd Koninkrijk',
      standard_rate: 20,
      reduced_rate: 5,
      zero_rate: 0,
      is_eu_member: false,
      reverse_charge_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const setting of vatSettings) {
    try {
      await setDoc(doc(db, 'vat_settings', setting.id), setting);
      console.log(`✅ VAT setting seeded: ${setting.country_name}`);
    } catch (error) {
      console.error(`❌ Error seeding VAT setting for ${setting.country_name}:`, error.message);
    }
  }
  
  console.log('✅ VAT Settings seeded successfully!');
};

// 2. Payment Methods Collection
const seedPaymentMethods = async () => {
  console.log('💳 Seeding Payment Methods...');
  
  const paymentMethods = [
    {
      id: 'ideal',
      name: 'iDEAL',
      description: 'Online betaling via iDEAL',
      mollie_id: 'ideal',
      is_active: true,
      fee_percent: 0,
      available_for_pickup: true,
      available_for_delivery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'bancontact',
      name: 'Bancontact',
      description: 'Online betaling via Bancontact',
      mollie_id: 'bancontact',
      is_active: true,
      fee_percent: 0,
      available_for_pickup: true,
      available_for_delivery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Online betaling via PayPal',
      mollie_id: 'paypal',
      is_active: true,
      fee_percent: 2.9,
      available_for_pickup: true,
      available_for_delivery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'creditcard',
      name: 'Credit Card',
      description: 'Online betaling via creditcard',
      mollie_id: 'creditcard',
      is_active: true,
      fee_percent: 2.9,
      available_for_pickup: true,
      available_for_delivery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'invoice',
      name: 'Factuur',
      description: 'Betaling op factuur (alleen voor B2B)',
      mollie_id: 'invoice',
      is_active: true,
      fee_percent: 0,
      available_for_pickup: true,
      available_for_delivery: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cash-pickup',
      name: 'Contant',
      description: 'Betaling bij afhalen',
      mollie_id: 'cash',
      is_active: true,
      fee_percent: 0,
      available_for_pickup: true,
      available_for_delivery: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'pin-pickup',
      name: 'Pinnen',
      description: 'Betaling bij afhalen',
      mollie_id: 'pin',
      is_active: true,
      fee_percent: 0,
      available_for_pickup: true,
      available_for_delivery: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const method of paymentMethods) {
    try {
      await setDoc(doc(db, 'payment_methods', method.id), method);
      console.log(`✅ Payment method seeded: ${method.name}`);
    } catch (error) {
      console.error(`❌ Error seeding payment method ${method.name}:`, error.message);
    }
  }
  
  console.log('✅ Payment Methods seeded successfully!');
};

// 3. Display Settings Collection
const seedDisplaySettings = async () => {
  console.log('⚙️ Seeding Display Settings...');
  
  const displaySettings = [
    {
      id: 'frontend_prices_include_vat',
      setting_key: 'frontend_prices_include_vat',
      setting_value: true,
      description: 'Toon prijzen inclusief BTW in frontend',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dealer_prices_exclude_vat',
      setting_key: 'dealer_prices_exclude_vat',
      setting_value: true,
      description: 'Toon prijzen exclusief BTW voor dealers',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'backend_prices_exclude_vat',
      setting_key: 'backend_prices_exclude_vat',
      setting_value: true,
      description: 'Prijzen in backend zijn exclusief BTW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'auto_calculate_vat',
      setting_key: 'auto_calculate_vat',
      setting_value: true,
      description: 'Automatische BTW berekening',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'reverse_charge_enabled',
      setting_key: 'reverse_charge_enabled',
      setting_value: true,
      description: 'BTW verlegging inschakelen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  for (const setting of displaySettings) {
    try {
      await setDoc(doc(db, 'display_settings', setting.id), setting);
      console.log(`✅ Display setting seeded: ${setting.description}`);
    } catch (error) {
      console.error(`❌ Error seeding display setting ${setting.description}:`, error.message);
    }
  }
  
  console.log('✅ Display Settings seeded successfully!');
};

// Main functie
const main = async () => {
  try {
    console.log('🚀 Starting essential database seeding...\n');
    
    await seedVatSettings();
    console.log('');
    
    await seedPaymentMethods();
    console.log('');
    
    await seedDisplaySettings();
    console.log('');
    
    console.log('🎉 Essential database collections seeded successfully!');
    console.log('\n📊 Seeded collections:');
    console.log('  - vat_settings (5 records)');
    console.log('  - payment_methods (7 records)');
    console.log('  - display_settings (5 records)');
    console.log('\n✅ STAP 2 & 3 VOLTOOID: Essentiële database collecties gevuld!');
    console.log('🎯 VOLGENDE: Offline wrapper implementeren');
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
  }
};

// Run het script
main();
