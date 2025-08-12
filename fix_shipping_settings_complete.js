const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc } = require('firebase/firestore');

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

async function fixShippingSettingsComplete() {
  console.log('🔧 Volledig herstellen van verzendinstellingen...');

  try {
    // 1. Verwijder alle bestaande verzendinstellingen
    console.log('\n🗑️  Verwijderen van oude verzendinstellingen...');
    const oldShippingSettingsSnapshot = await getDocs(collection(db, 'shipping_settings'));
    console.log(`   ${oldShippingSettingsSnapshot.docs.length} oude verzendinstellingen gevonden`);

    // 2. Maak nieuwe verzendinstellingen
    console.log('\n➕ Toevoegen van nieuwe verzendinstellingen...');
    const newShippingSettings = [
      {
        method_name: 'standard',
        display_name: 'Standaard Verzending',
        cost: 5.95,
        description: 'Standaard verzending binnen 2-3 werkdagen',
        delivery_time: '2-3 werkdagen',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        method_name: 'express',
        display_name: 'Express Verzending',
        cost: 9.95,
        description: 'Snelle verzending binnen 1 werkdag',
        delivery_time: '1 werkdag',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        method_name: 'free',
        display_name: 'Gratis Verzending',
        cost: 0,
        description: 'Gratis verzending bij bestellingen boven €50',
        delivery_time: '2-3 werkdagen',
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        method_name: 'pickup',
        display_name: 'Afhalen bij Dealer',
        cost: 0,
        description: 'Gratis afhalen bij een dealer in je buurt',
        delivery_time: 'Direct beschikbaar',
        is_active: true,
        sort_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const setting of newShippingSettings) {
      await addDoc(collection(db, 'shipping_settings'), setting);
      console.log(`   ✅ ${setting.display_name} toegevoegd`);
    }

    // 3. Verificatie
    console.log('\n🔍 Verificatie van verzendinstellingen...');
    const newShippingSettingsSnapshot = await getDocs(collection(db, 'shipping_settings'));
    const shippingSettingsFromDb = newShippingSettingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Verzendmethoden:');
    shippingSettingsFromDb.forEach(setting => {
      console.log(`  - ${setting.display_name}: €${setting.cost} (${setting.delivery_time})`);
    });

    console.log('\n🎉 Verzendinstellingen volledig hersteld!');

  } catch (error) {
    console.error('❌ Fout bij herstellen van verzendinstellingen:', error);
  }
}

fixShippingSettingsComplete().catch(console.error); 