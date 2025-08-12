const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, updateDoc, getDocs, query, where } = require('firebase/firestore');

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

async function fixProductImage() {
  try {
    console.log('Zoeken naar product "Lijm 20 gram"...');
    
    // Zoek naar het product met de naam "Lijm 20 gram"
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('name', '==', 'Lijm 20 gram'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Product "Lijm 20 gram" niet gevonden');
      return;
    }
    
    const productDoc = querySnapshot.docs[0];
    const productId = productDoc.id;
    
    console.log(`Product gevonden met ID: ${productId}`);
    console.log('Huidige product data:', productDoc.data());
    
    // Update de image_url naar een bestaande afbeelding
    const updateData = {
      image_url: '/wysiwyg/media/AlloyGator_Logo.png', // Gebruik een bestaande afbeelding
      updated_at: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'products', productId), updateData);
    
    console.log('Product afbeelding bijgewerkt naar:', updateData.image_url);
    console.log('✅ Klaar!');
    
  } catch (error) {
    console.error('Fout bij bijwerken van product afbeelding:', error);
  }
}

// Run het script
fixProductImage();
