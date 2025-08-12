const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, onSnapshot } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugProducts() {
  try {
    console.log('=== DEBUG PRODUCTS ===');
    console.log('Firebase config:', firebaseConfig);
    
    // Test 1: Direct getDocs
    console.log('\n--- Test 1: Direct getDocs ---');
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    
    console.log(`Found ${productsSnapshot.size} products with getDocs`);
    
    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      console.log(`Product: ${product.name || 'No name'} (ID: ${doc.id})`);
      console.log(`  Price: €${product.price || 0}`);
      console.log(`  Category: ${product.category || 'No category'}`);
      console.log(`  Stock: ${product.stock_quantity || 0}`);
      console.log('---');
    });
    
    // Test 2: Real-time listener
    console.log('\n--- Test 2: Real-time listener ---');
    const unsubscribe = onSnapshot(
      productsCollection,
      (snapshot) => {
        console.log(`Real-time update: ${snapshot.size} products`);
        snapshot.forEach((doc) => {
          const product = doc.data();
          console.log(`Real-time Product: ${product.name || 'No name'} (ID: ${doc.id})`);
        });
      },
      (error) => {
        console.error('Real-time listener error:', error);
      }
    );
    
    // Stop listening after 5 seconds
    setTimeout(() => {
      console.log('\n--- Stopping real-time listener ---');
      unsubscribe();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('Error debugging products:', error);
  }
}

debugProducts();
