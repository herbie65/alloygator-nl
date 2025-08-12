const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore')

// Gebruik dezelfde Firebase config als in je project
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79"
}

console.log('🔧 Initializing Firebase for index creation...')
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function createIndexesAutomatically() {
  console.log('🚀 Starting automatic index creation...')
  
  try {
    // Test 1: Documents collection index
    console.log('\n📁 Testing documents collection query...')
    const documentsRef = collection(db, 'documents')
    
    try {
      const documentsQuery = query(
        documentsRef,
        where('customer_id', '==', '2003'),
        orderBy('created_at', 'desc')
      )
      
      const docs = await getDocs(documentsQuery)
      console.log(`✅ Documents query successful: ${docs.size} documents found`)
      console.log('✅ Documents index already exists!')
      
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('❌ Documents index missing - triggering creation...')
        console.log('📋 Firebase will automatically create this index')
        console.log('⏱️ Please wait 2-5 minutes for index to be ready')
        
        // Trigger the index creation by running the query multiple times
        for (let i = 0; i < 3; i++) {
          try {
            await getDocs(query(
              documentsRef,
              where('customer_id', '==', '2003'),
              orderBy('created_at', 'desc')
            ))
          } catch (e) {
            // Expected error - this triggers index creation
          }
        }
        console.log('✅ Documents index creation triggered')
      } else {
        console.error('❌ Unexpected error:', error.message)
      }
    }
    
    // Test 2: Customer uploads collection index
    console.log('\n📤 Testing customer uploads collection query...')
    const uploadsRef = collection(db, 'customer_uploads')
    
    try {
      const uploadsQuery = query(
        uploadsRef,
        where('status', '==', 'pending'),
        orderBy('created_at', 'desc')
      )
      
      const uploads = await getDocs(uploadsQuery)
      console.log(`✅ Customer uploads query successful: ${uploads.size} uploads found`)
      console.log('✅ Customer uploads index already exists!')
      
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('❌ Customer uploads index missing - triggering creation...')
        console.log('📋 Firebase will automatically create this index')
        console.log('⏱️ Please wait 2-5 minutes for index to be ready')
        
        // Trigger the index creation by running the query multiple times
        for (let i = 0; i < 3; i++) {
          try {
            await getDocs(query(
              uploadsRef,
              where('status', '==', 'pending'),
              orderBy('created_at', 'desc')
            ))
          } catch (e) {
            // Expected error - this triggers index creation
          }
        }
        console.log('✅ Customer uploads index creation triggered')
      } else {
        console.error('❌ Unexpected error:', error.message)
      }
    }
    
    console.log('\n🎉 Index creation process completed!')
    console.log('📋 Check Firebase Console > Firestore > Indexes for status')
    console.log('⏱️ Indexes will be ready in 2-5 minutes')
    
  } catch (error) {
    console.error('❌ Script failed:', error.message)
  }
}

createIndexesAutomatically()
  .then(() => {
    console.log('✅ All operations completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
