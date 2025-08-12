const admin = require('firebase-admin')

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'alloygator-nl'
})

const db = admin.firestore()

async function createIndexes() {
  console.log('🔧 Creating Firebase indexes...')
  
  try {
    // Create documents index
    console.log('📁 Creating documents index...')
    await db.collection('documents').createIndex({
      fields: [
        { fieldPath: 'customer_id', order: 'ASCENDING' },
        { fieldPath: 'created_at', order: 'DESCENDING' }
      ]
    })
    console.log('✅ Documents index created successfully')
    
  } catch (error) {
    if (error.code === 6) { // ALREADY_EXISTS
      console.log('✅ Documents index already exists')
    } else {
      console.error('❌ Error creating documents index:', error.message)
    }
  }
  
  try {
    // Create customer_uploads index
    console.log('📤 Creating customer_uploads index...')
    await db.collection('customer_uploads').createIndex({
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'created_at', order: 'DESCENDING' }
      ]
    })
    console.log('✅ Customer uploads index created successfully')
    
  } catch (error) {
    if (error.code === 6) { // ALREADY_EXISTS
      console.log('✅ Customer uploads index already exists')
    } else {
      console.error('❌ Error creating customer_uploads index:', error.message)
    }
  }
  
  console.log('\n🎉 Index creation completed!')
}

createIndexes()
  .then(() => {
    console.log('✅ All indexes are ready')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
