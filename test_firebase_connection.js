require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('🔧 Firebase Config Check:');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🚀 Firebase initialized');
console.log('Database instance:', db ? '✅ Created' : '❌ Failed');
console.log('');

// Test 1: Probeer te lezen van een bestaande collectie
const testRead = async () => {
  console.log('📖 Test 1: Reading from existing collection...');
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    console.log(`✅ Read successful: ${snapshot.size} documents found`);
    return true;
  } catch (error) {
    console.error(`❌ Read failed:`, error.message);
    return false;
  }
};

// Test 2: Probeer te schrijven naar een test collectie
const testWrite = async () => {
  console.log('✍️ Test 2: Writing to test collection...');
  try {
    const testData = {
      id: 'test_connection',
      name: 'Test Connection',
      timestamp: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'test_connection', 'test_1'), testData);
    console.log('✅ Write successful!');
    return true;
  } catch (error) {
    console.error(`❌ Write failed:`, error.message);
    return false;
  }
};

// Test 3: Probeer te schrijven naar een bestaande collectie
const testWriteExisting = async () => {
  console.log('✍️ Test 3: Writing to existing collection...');
  try {
    const testData = {
      id: 'test_existing',
      name: 'Test Existing Collection',
      timestamp: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'categories', 'test_existing'), testData);
    console.log('✅ Write to existing collection successful!');
    return true;
  } catch (error) {
    console.error(`❌ Write to existing collection failed:`, error.message);
    return false;
  }
};

// Main functie
const main = async () => {
  try {
    console.log('🧪 Starting Firebase connection tests...\n');
    
    const readSuccess = await testRead();
    console.log('');
    
    if (readSuccess) {
      const writeSuccess = await testWrite();
      console.log('');
      
      if (writeSuccess) {
        await testWriteExisting();
        console.log('');
      }
    }
    
    console.log('🎯 Test results:');
    console.log('  - Read permissions:', readSuccess ? '✅' : '❌');
    console.log('  - Write permissions:', readSuccess ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
  }
};

// Run het script
main();
