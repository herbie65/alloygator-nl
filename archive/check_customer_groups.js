const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCustomerGroups() {
  console.log('🔍 Controleren van klantgroepen...');

  try {
    // Get customer groups
    const customerGroupsSnapshot = await getDocs(collection(db, 'customer_groups'));
    const customerGroups = customerGroupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Klantgroepen in Firebase:');
    customerGroups.forEach(group => {
      console.log(`  - ID: ${group.id}`);
      console.log(`    Naam: ${group.name}`);
      console.log(`    Beschrijving: ${group.description}`);
      console.log(`    Korting: ${group.discount_percentage}%`);
      console.log('');
    });

    // Get customers
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n👥 Klanten in Firebase:');
    customers.forEach(customer => {
      console.log(`  - ID: ${customer.id}`);
      console.log(`    Naam: ${customer.name}`);
      console.log(`    Email: ${customer.email}`);
      console.log(`    Klantgroep ID: ${customer.customer_group_id}`);
      console.log(`    Klantgroep Naam: ${customer.group_name}`);
      console.log('');
    });

    console.log('\n🔗 Koppeling Analyse:');
    customers.forEach(customer => {
      const group = customerGroups.find(g => g.id === customer.customer_group_id);
      if (group) {
        console.log(`✅ ${customer.name} -> ${group.name}`);
      } else {
        console.log(`❌ ${customer.name} -> ONBEKEND (ID: ${customer.customer_group_id})`);
      }
    });

  } catch (error) {
    console.error('❌ Fout bij controleren van data:', error);
  }
}

checkCustomerGroups().catch(console.error); 