const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

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

async function fixCustomerGroups() {
  console.log('🔧 Corrigeren van klantgroep koppelingen...');

  try {
    // Get customer groups
    const customerGroupsSnapshot = await getDocs(collection(db, 'customer_groups'));
    const customerGroups = customerGroupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Beschikbare klantgroepen:');
    customerGroups.forEach(group => {
      console.log(`  - ID: ${group.id} -> ${group.name}`);
    });

    // Create mapping from old numeric IDs to new Firebase IDs
    const groupMapping = {
      1: customerGroups.find(g => g.name === "Brons Dealers")?.id,
      2: customerGroups.find(g => g.name === "Zilver Dealers")?.id,
      3: customerGroups.find(g => g.name === "Goud Dealers")?.id,
      4: customerGroups.find(g => g.name === "Particulieren")?.id
    };

    console.log('\n🗺️  Mapping van oude naar nieuwe IDs:');
    Object.entries(groupMapping).forEach(([oldId, newId]) => {
      const groupName = customerGroups.find(g => g.id === newId)?.name || 'ONBEKEND';
      console.log(`  ${oldId} -> ${newId} (${groupName})`);
    });

    // Get customers
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n👥 Corrigeren van klanten...');
    let updatedCount = 0;

    for (const customer of customers) {
      const oldGroupId = customer.customer_group_id;
      const newGroupId = groupMapping[oldGroupId];

      if (newGroupId && oldGroupId !== newGroupId) {
        const group = customerGroups.find(g => g.id === newGroupId);
        const groupName = group ? group.name : 'Onbekend';

        console.log(`  🔄 ${customer.name}: ${oldGroupId} -> ${newGroupId} (${groupName})`);

        // Update customer
        const customerRef = doc(db, 'customers', customer.id);
        await updateDoc(customerRef, {
          customer_group_id: newGroupId,
          group_name: groupName
        });

        updatedCount++;
      } else if (oldGroupId === 'dealers-group-id') {
        // Fix the sample customers that have the wrong ID
        const newGroupId = groupMapping[2]; // Zilver Dealers
        const group = customerGroups.find(g => g.id === newGroupId);
        const groupName = group ? group.name : 'Zilver Dealers';

        console.log(`  🔄 ${customer.name}: dealers-group-id -> ${newGroupId} (${groupName})`);

        const customerRef = doc(db, 'customers', customer.id);
        await updateDoc(customerRef, {
          customer_group_id: newGroupId,
          group_name: groupName
        });

        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount} klanten bijgewerkt!`);

    // Verify the changes
    console.log('\n🔍 Verificatie van wijzigingen...');
    const updatedCustomersSnapshot = await getDocs(collection(db, 'customers'));
    const updatedCustomers = updatedCustomersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    updatedCustomers.forEach(customer => {
      const group = customerGroups.find(g => g.id === customer.customer_group_id);
      if (group) {
        console.log(`✅ ${customer.name} -> ${group.name}`);
      } else {
        console.log(`❌ ${customer.name} -> ONBEKEND (ID: ${customer.customer_group_id})`);
      }
    });

  } catch (error) {
    console.error('❌ Fout bij corrigeren van klantgroepen:', error);
  }
}

fixCustomerGroups().catch(console.error); 