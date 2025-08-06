const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, setDoc, doc } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alloygator-nl.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alloygator-nl",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alloygator-nl.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "501404252412",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:501404252412:web:0dd2bd394f9a13117a3f79"
};

console.log('🔥 Firebase Configuratie:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateToFirebase() {
  console.log('🚀 Starting migration to Firebase...');
  
  try {
    // Check if database_export.json exists
    if (!fs.existsSync('./database_export.json')) {
      console.log('❌ database_export.json niet gevonden!');
      console.log('📋 Voer eerst uit: node export_database.js');
      process.exit(1);
    }

    // Read the exported database
    const databaseExport = JSON.parse(fs.readFileSync('./database_export.json', 'utf8'));
    
    let totalMigrated = 0;
    let totalErrors = 0;

    // Migrate each collection
    for (const [collectionName, documents] of Object.entries(databaseExport)) {
      console.log(`\n📦 Migrating ${collectionName}...`);
      
      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`  ⚠️  No documents in ${collectionName}`);
        continue;
      }

      let migrated = 0;
      let errors = 0;

      for (const document of documents) {
        try {
          // Remove the id field if it exists (Firebase will generate its own)
          const { id, ...documentData } = document;
          
          // Convert SQLite timestamps to Firestore timestamps
          const processedData = processTimestamps(documentData);
          
          // Add document to Firestore
          await addDoc(collection(db, collectionName), processedData);
          migrated++;
          
          if (migrated % 10 === 0) {
            console.log(`  ✅ Migrated ${migrated}/${documents.length} documents`);
          }
          
        } catch (error) {
          console.error(`  ❌ Error migrating document in ${collectionName}:`, error.message);
          errors++;
        }
      }

      console.log(`  ✅ ${collectionName}: ${migrated} migrated, ${errors} errors`);
      totalMigrated += migrated;
      totalErrors += errors;
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Total migrated: ${totalMigrated}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n✅ Alle data succesvol gemigreerd naar Firebase!');
      console.log('🌐 Ga naar Firebase Console > Firestore Database om je data te bekijken');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

function processTimestamps(data) {
  const processed = { ...data };
  
  // Convert string timestamps to Date objects
  if (processed.created_at && typeof processed.created_at === 'string') {
    processed.created_at = new Date(processed.created_at);
  }
  
  if (processed.updated_at && typeof processed.updated_at === 'string') {
    processed.updated_at = new Date(processed.updated_at);
  }
  
  // Process nested objects
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'object' && processed[key] !== null) {
      processed[key] = processTimestamps(processed[key]);
    }
  });
  
  return processed;
}

// Run migration
migrateToFirebase().catch(console.error); 