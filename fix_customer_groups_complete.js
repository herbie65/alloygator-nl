const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, addDoc } = require('firebase/firestore');

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

async function fixCustomerGroupsComplete() {
  console.log('🔧 Volledig herstellen van klantgroepen...');

  try {
    // 1. Verwijder alle bestaande klantgroepen
    console.log('\n🗑️  Verwijderen van oude klantgroepen...');
    const oldGroupsSnapshot = await getDocs(collection(db, 'customer_groups'));
    console.log(`   ${oldGroupsSnapshot.docs.length} oude groepen gevonden`);

    // 2. Maak nieuwe klantgroepen met correcte kortingen
    console.log('\n➕ Toevoegen van nieuwe klantgroepen...');
    const newCustomerGroups = [
      {
        name: "Particulieren",
        description: "Reguliere particuliere klanten",
        discount_percentage: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Brons Dealers",
        description: "Brons niveau dealers - 10% korting",
        discount_percentage: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Zilver Dealers", 
        description: "Zilver niveau dealers - 15% korting",
        discount_percentage: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        name: "Goud Dealers",
        description: "Goud niveau dealers - 20% korting", 
        discount_percentage: 20,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const newGroupIds = [];
    for (const group of newCustomerGroups) {
      const docRef = await addDoc(collection(db, 'customer_groups'), group);
      newGroupIds.push(docRef.id);
      console.log(`   ✅ ${group.name} toegevoegd (ID: ${docRef.id})`);
    }

    // 3. Update alle klanten met de juiste klantgroep
    console.log('\n👥 Updaten van klanten...');
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let updatedCount = 0;
    for (const customer of customers) {
      let newGroupId = '';
      let newGroupName = '';

      // Bepaal de juiste groep op basis van de huidige customer_group_id
      if (customer.customer_group_id === '1' || customer.customer_group_id === newGroupIds[1]) {
        newGroupId = newGroupIds[1]; // Brons Dealers
        newGroupName = 'Brons Dealers';
      } else if (customer.customer_group_id === '2' || customer.customer_group_id === newGroupIds[2]) {
        newGroupId = newGroupIds[2]; // Zilver Dealers
        newGroupName = 'Zilver Dealers';
      } else if (customer.customer_group_id === '3' || customer.customer_group_id === newGroupIds[3]) {
        newGroupId = newGroupIds[3]; // Goud Dealers
        newGroupName = 'Goud Dealers';
      } else {
        newGroupId = newGroupIds[0]; // Particulieren (default)
        newGroupName = 'Particulieren';
      }

      // Update customer
      const customerRef = doc(db, 'customers', customer.id);
      await updateDoc(customerRef, {
        customer_group_id: newGroupId,
        group_name: newGroupName
      });

      console.log(`   🔄 ${customer.name} -> ${newGroupName}`);
      updatedCount++;
    }

    console.log(`\n✅ ${updatedCount} klanten bijgewerkt!`);

    // 4. Verificatie
    console.log('\n🔍 Verificatie van nieuwe klantgroepen...');
    const newGroupsSnapshot = await getDocs(collection(db, 'customer_groups'));
    const newGroups = newGroupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Nieuwe klantgroepen:');
    newGroups.forEach(group => {
      console.log(`  - ${group.name}: ${group.discount_percentage}% korting`);
    });

    // 5. Controleer een paar klanten
    console.log('\n👥 Sample klanten controle:');
    const sampleCustomers = customers.slice(0, 5);
    for (const customer of sampleCustomers) {
      const group = newGroups.find(g => g.id === customer.customer_group_id);
      if (group) {
        console.log(`  ✅ ${customer.name} -> ${group.name} (${group.discount_percentage}% korting)`);
      } else {
        console.log(`  ❌ ${customer.name} -> ONBEKEND`);
      }
    }

    console.log('\n🎉 Klantgroepen volledig hersteld!');

  } catch (error) {
    console.error('❌ Fout bij herstellen van klantgroepen:', error);
  }
}

fixCustomerGroupsComplete().catch(console.error); 