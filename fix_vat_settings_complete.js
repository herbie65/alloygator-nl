const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc } = require('firebase/firestore');

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

async function fixVatSettingsComplete() {
  console.log('🔧 Volledig herstellen van BTW instellingen...');

  try {
    // 1. Verwijder alle bestaande BTW instellingen
    console.log('\n🗑️  Verwijderen van oude BTW instellingen...');
    const oldVatSettingsSnapshot = await getDocs(collection(db, 'vat_settings'));
    console.log(`   ${oldVatSettingsSnapshot.docs.length} oude BTW instellingen gevonden`);

    // 2. Maak nieuwe BTW instellingen
    console.log('\n➕ Toevoegen van nieuwe BTW instellingen...');
    const newVatSettings = [
      {
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

    for (const setting of newVatSettings) {
      await addDoc(collection(db, 'vat_settings'), setting);
      console.log(`   ✅ ${setting.country_name} toegevoegd`);
    }

    // 3. Maak BTW weergave instellingen
    console.log('\n➕ Toevoegen van BTW weergave instellingen...');
    const vatDisplaySettings = [
      {
        setting_key: 'frontend_prices_include_vat',
        setting_value: true,
        description: 'Toon prijzen inclusief BTW in frontend',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        setting_key: 'dealer_prices_exclude_vat',
        setting_value: true,
        description: 'Toon prijzen exclusief BTW voor dealers',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        setting_key: 'backend_prices_exclude_vat',
        setting_value: true,
        description: 'Prijzen in backend zijn exclusief BTW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        setting_key: 'auto_calculate_vat',
        setting_value: true,
        description: 'Automatische BTW berekening',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        setting_key: 'reverse_charge_enabled',
        setting_value: true,
        description: 'BTW verlegging inschakelen',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const setting of vatDisplaySettings) {
      await addDoc(collection(db, 'vat_display_settings'), setting);
      console.log(`   ✅ ${setting.description} toegevoegd`);
    }

    // 4. Verificatie
    console.log('\n🔍 Verificatie van BTW instellingen...');
    const newVatSettingsSnapshot = await getDocs(collection(db, 'vat_settings'));
    const vatSettingsFromDb = newVatSettingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 BTW Landen:');
    vatSettingsFromDb.forEach(setting => {
      console.log(`  - ${setting.country_name} (${setting.country_code}): ${setting.standard_rate}% standaard, ${setting.reduced_rate}% verlaagd`);
    });

    const vatDisplaySnapshot = await getDocs(collection(db, 'vat_display_settings'));
    const vatDisplaySettingsFromDb = vatDisplaySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 BTW Weergave Instellingen:');
    vatDisplaySettingsFromDb.forEach(setting => {
      console.log(`  - ${setting.description}: ${setting.setting_value ? 'AAN' : 'UIT'}`);
    });

    console.log('\n🎉 BTW instellingen volledig hersteld!');

  } catch (error) {
    console.error('❌ Fout bij herstellen van BTW instellingen:', error);
  }
}

fixVatSettingsComplete().catch(console.error); 