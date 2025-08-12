const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore')

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79"
}

console.log('🔧 Forcing Firebase index creation...')
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function forceIndexCreation() {
  console.log('🚀 Starting forced index creation...')
  
  // Force documents index
  console.log('\n📁 Forcing documents index creation...')
  for (let i = 0; i < 10; i++) {
    try {
      const documentsRef = collection(db, 'documents')
      const documentsQuery = query(
        documentsRef,
        where('customer_id', '==', '2003'),
        orderBy('created_at', 'desc')
      )
      
      await getDocs(documentsQuery)
      console.log(`✅ Documents query ${i + 1} successful - index might be ready!`)
      break
      
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log(`⏳ Documents index still building... attempt ${i + 1}/10`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      } else {
        console.error('❌ Unexpected error:', error.message)
        break
      }
    }
  }
  
  // Force customer uploads index
  console.log('\n📤 Forcing customer uploads index creation...')
  for (let i = 0; i < 10; i++) {
    try {
      const uploadsRef = collection(db, 'customer_uploads')
      const uploadsQuery = query(
        uploadsRef,
        where('status', '==', 'pending'),
        orderBy('created_at', 'desc')
      )
      
      await getDocs(uploadsQuery)
      console.log(`✅ Customer uploads query ${i + 1} successful - index might be ready!`)
      break
      
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log(`⏳ Customer uploads index still building... attempt ${i + 1}/10`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      } else {
        console.error('❌ Unexpected error:', error.message)
        break
      }
    }
  }
  
  console.log('\n🎉 Forced index creation completed!')
  console.log('📋 Check Firebase Console > Firestore > Indexes for final status')
}

forceIndexCreation()
  .then(() => {
    console.log('✅ All operations completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
