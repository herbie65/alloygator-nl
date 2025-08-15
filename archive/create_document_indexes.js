const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore')

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQvQ",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createDocumentIndexes() {
  console.log('🔧 Creating document indexes...')
  
  try {
    // Test query for documents collection
    const documentsRef = collection(db, 'documents')
    const documentsQuery = query(
      documentsRef,
      where('customer_id', '==', '2003'),
      orderBy('created_at', 'desc')
    )
    
    console.log('✅ Testing documents query...')
    const docs = await getDocs(documentsQuery)
    console.log(`✅ Documents query successful: ${docs.size} documents found`)
    
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.log('❌ Index required. Please create this index in Firebase Console:')
      console.log('Collection: documents')
      console.log('Fields: customer_id (Ascending), created_at (Descending)')
      console.log('Query scope: Collection')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
  
  try {
    // Test query for customer_uploads collection
    const uploadsRef = collection(db, 'customer_uploads')
    const uploadsQuery = query(
      uploadsRef,
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc')
    )
    
    console.log('✅ Testing customer uploads query...')
    const uploads = await getDocs(uploadsQuery)
    console.log(`✅ Customer uploads query successful: ${uploads.size} uploads found`)
    
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.log('❌ Index required. Please create this index in Firebase Console:')
      console.log('Collection: customer_uploads')
      console.log('Fields: status (Ascending), created_at (Descending)')
      console.log('Query scope: Collection')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
  
  console.log('\n📋 Manual Index Creation Required:')
  console.log('1. Go to Firebase Console > Firestore Database > Indexes')
  console.log('2. Create composite index for "documents" collection:')
  console.log('   - Fields: customer_id (Ascending), created_at (Descending)')
  console.log('3. Create composite index for "customer_uploads" collection:')
  console.log('   - Fields: status (Ascending), created_at (Descending)')
}

createDocumentIndexes()
  .then(() => {
    console.log('✅ Index check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
