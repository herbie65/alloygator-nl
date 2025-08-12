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

async function fixPaymentSettingsComplete() {
  console.log('🔧 Volledig herstellen van betalingsinstellingen...');

  try {
    // 1. Verwijder alle bestaande betalingsinstellingen
    console.log('\n🗑️  Verwijderen van oude betalingsinstellingen...');
    const oldPaymentSettingsSnapshot = await getDocs(collection(db, 'payment_settings'));
    console.log(`   ${oldPaymentSettingsSnapshot.docs.length} oude betalingsinstellingen gevonden`);

    // 2. Maak nieuwe betalingsinstellingen
    console.log('\n➕ Toevoegen van nieuwe betalingsinstellingen...');
    const newPaymentSettings = {
      provider_name: 'Mollie',
      is_active: true,
      api_key: 'test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      api_secret: 'live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      webhook_url: 'https://alloygator-nl.web.app/api/mollie/webhook',
      test_mode: true,
      supported_methods: 'ideal,creditcard,paypal,banktransfer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await addDoc(collection(db, 'payment_settings'), newPaymentSettings);
    console.log(`   ✅ ${newPaymentSettings.provider_name} toegevoegd`);

    // 3. Verificatie
    console.log('\n🔍 Verificatie van betalingsinstellingen...');
    const newPaymentSettingsSnapshot = await getDocs(collection(db, 'payment_settings'));
    const paymentSettingsFromDb = newPaymentSettingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Betalingsinstellingen:');
    paymentSettingsFromDb.forEach(setting => {
      console.log(`  - Provider: ${setting.provider_name}`);
      console.log(`  - Actief: ${setting.is_active ? 'JA' : 'NEE'}`);
      console.log(`  - Test Mode: ${setting.test_mode ? 'JA' : 'NEE'}`);
      console.log(`  - API Key: ${setting.api_key ? 'INGESTELD' : 'NIET INGESTELD'}`);
      console.log(`  - Ondersteunde Methoden: ${setting.supported_methods}`);
      console.log(`  - Webhook URL: ${setting.webhook_url}`);
      console.log('');
    });

    console.log('\n🎉 Betalingsinstellingen volledig hersteld!');

  } catch (error) {
    console.error('❌ Fout bij herstellen van betalingsinstellingen:', error);
  }
}

fixPaymentSettingsComplete().catch(console.error); 