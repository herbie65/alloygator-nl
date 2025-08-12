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

async function checkProducts() {
  try {
    console.log('Checking products in Firebase...');
    
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    
    console.log(`Found ${productsSnapshot.size} products in database`);
    
    if (productsSnapshot.size === 0) {
      console.log('No products found in database');
      return;
    }
    
    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      console.log(`Product: ${product.name || 'No name'} (ID: ${doc.id})`);
      console.log(`  Price: €${product.price || 0}`);
      console.log(`  Category: ${product.category || 'No category'}`);
      console.log(`  Stock: ${product.stock_quantity || 0}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking products:', error);
  }
}

checkProducts();
