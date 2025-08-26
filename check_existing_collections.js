const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkCollections() {
  try {
    console.log('🔍 Checking existing collections in Firebase...\n');
    
    // Lijst van collecties om te controleren
    const collectionsToCheck = [
      'vat_settings',
      'vat_display_settings', 
      'payment_methods',
      'cms_pages',
      'customer_groups',
      'display_settings',
      'categories',
      'products',
      'customers'
    ];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`📁 ${collectionName}: ${snapshot.size} records`);
        
        if (snapshot.size > 0) {
          // Toon eerste paar records als voorbeeld
          const firstDoc = snapshot.docs[0].data();
          const keys = Object.keys(firstDoc).slice(0, 5); // Eerste 5 velden
          console.log(`   Sample fields: ${keys.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ ${collectionName}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

checkCollections();
