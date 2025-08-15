const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkGoogleMapsKey() {
  console.log('🔍 Controleren van Google Maps API key...');

  try {
    // Get settings
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    const settings = settingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Settings in Firebase:');
    settings.forEach(setting => {
      console.log(`  - ID: ${setting.id}`);
      console.log(`    Google Maps API Key: ${setting.google_maps_api_key || 'NIET INGESTELD'}`);
      console.log(`    Search Radius: ${setting.search_radius || 'NIET INGESTELD'}`);
      console.log(`    Site Name: ${setting.site_name || 'NIET INGESTELD'}`);
      console.log('');
    });

    if (settings.length === 0) {
      console.log('❌ Geen settings gevonden in Firebase!');
    } else if (!settings[0].google_maps_api_key) {
      console.log('❌ Google Maps API key is niet ingesteld!');
    } else {
      console.log('✅ Google Maps API key is ingesteld');
      console.log(`   Key: ${settings[0].google_maps_api_key.substring(0, 20)}...`);
    }

  } catch (error) {
    console.error('❌ Fout bij controleren van settings:', error);
  }
}

checkGoogleMapsKey().catch(console.error); 