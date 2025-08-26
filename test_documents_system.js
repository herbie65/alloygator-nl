const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy } = require('firebase/firestore')

// Firebase config uit environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function testDocumentsSystem() {
  console.log('🧪 Testing Documents System...')
  
  try {
    // Test 1: Check if documents collection exists
    console.log('\n📁 Test 1: Documents Collection')
    const documentsRef = collection(db, 'documents')
    const docsSnapshot = await getDocs(documentsRef)
    console.log(`✅ Documents collection accessible: ${docsSnapshot.size} documents found`)
    
    // Test 2: Check if customer_uploads collection exists
    console.log('\n📤 Test 2: Customer Uploads Collection')
    const uploadsRef = collection(db, 'customer_uploads')
    const uploadsSnapshot = await getDocs(uploadsRef)
    console.log(`✅ Customer uploads collection accessible: ${uploadsSnapshot.size} uploads found`)
    
    // Test 3: Try to add a test document
    console.log('\n➕ Test 3: Add Test Document')
    const testDoc = {
      title: 'Test Document',
      description: 'Test document for system verification',
      category_id: 'test',
      permission: 'general',
      file_url: 'https://example.com/test.pdf',
      file_type: 'pdf',
      file_size: 1024,
      created_at: new Date()
    }
    
    const docRef = await addDoc(documentsRef, testDoc)
    console.log(`✅ Test document added with ID: ${docRef.id}`)
    
    // Test 4: Delete test document
    console.log('\n🗑️ Test 4: Delete Test Document')
    await deleteDoc(doc(db, 'documents', docRef.id))
    console.log('✅ Test document deleted successfully')
    
    // Test 5: Test customer-specific query
    console.log('\n🔍 Test 5: Customer Documents Query')
    try {
      const customerDocsQuery = query(
        documentsRef,
        where('customer_id', '==', '2003'),
        orderBy('created_at', 'desc')
      )
      const customerDocs = await getDocs(customerDocsQuery)
      console.log(`✅ Customer documents query successful: ${customerDocs.size} documents found`)
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('❌ Index required for customer documents query')
        console.log('Please create the index: customer_id (Ascending), created_at (Descending)')
      } else {
        console.error('❌ Error:', error.message)
      }
    }
    
    console.log('\n🎉 Documents System Test Completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDocumentsSystem()
  .then(() => {
    console.log('✅ All tests completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  })
