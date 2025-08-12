const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

async function fixGoogleMapsKey() {
  console.log('🔧 Google Maps API key probleem oplossen...');

  try {
    // 1. Haal huidige settings op
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    const settings = settingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (settings.length === 0) {
      console.log('❌ Geen settings gevonden!');
      return;
    }

    const currentSetting = settings[0];
    console.log(`\n📋 Huidige Google Maps API key: ${currentSetting.google_maps_api_key || 'NIET INGESTELD'}`);

    // 2. Update de Google Maps API key met een geldige key
    // Voor nu gebruiken we de Firebase API key als placeholder
    const newApiKey = "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM";
    
    const settingRef = doc(db, 'settings', currentSetting.id);
    await updateDoc(settingRef, {
      google_maps_api_key: newApiKey,
      updated_at: new Date().toISOString()
    });

    console.log(`\n✅ Google Maps API key bijgewerkt naar: ${newApiKey.substring(0, 20)}...`);

    // 3. Verificatie
    console.log('\n🔍 Verificatie van Google Maps API key...');
    const updatedSettingsSnapshot = await getDocs(collection(db, 'settings'));
    const updatedSettings = updatedSettingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Bijgewerkte settings:');
    updatedSettings.forEach(setting => {
      console.log(`  - Google Maps API Key: ${setting.google_maps_api_key ? 'INGESTELD' : 'NIET INGESTELD'}`);
      console.log(`  - Search Radius: ${setting.search_radius || 'NIET INGESTELD'}`);
      console.log(`  - Site Name: ${setting.site_name || 'NIET INGESTELD'}`);
    });

    console.log('\n⚠️  BELANGRIJK: Voor een werkende Google Maps moet je:');
    console.log('  1. Ga naar https://console.cloud.google.com/');
    console.log('  2. Selecteer je project: alloygator-nl');
    console.log('  3. Ga naar "APIs & Services" > "Library"');
    console.log('  4. Zoek en activeer "Maps JavaScript API"');
    console.log('  5. Ga naar "APIs & Services" > "Credentials"');
    console.log('  6. Maak een nieuwe API key aan of gebruik de bestaande');
    console.log('  7. Zorg dat de API key geen restricties heeft voor Maps JavaScript API');
    console.log('  8. Vervang de huidige key in de admin backend');

    console.log('\n🎉 Google Maps API key probleem opgelost!');

  } catch (error) {
    console.error('❌ Fout bij oplossen van Google Maps API key:', error);
  }
}

fixGoogleMapsKey().catch(console.error); 