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

async function fixDealerAssignments() {
  console.log('🔧 Correct toewijzen van dealers aan klantgroepen...');

  try {
    // 1. Haal klantgroepen op
    const groupsSnapshot = await getDocs(collection(db, 'customer_groups'));
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('\n📋 Beschikbare klantgroepen:');
    groups.forEach(group => {
      console.log(`  - ${group.name}: ${group.discount_percentage}% korting (ID: ${group.id})`);
    });

    // 2. Haal klanten op
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. Bepaal welke klanten dealers zijn (op basis van email domein of naam)
    const dealerKeywords = [
      'garage', 'autobedrijf', 'banden', 'wheels', 'tuning', 'service', 'automotive',
      'autoservice', 'bandenservice', 'autobanden', 'velgen', 'customs', 'detailing'
    ];

    let updatedCount = 0;
    for (const customer of customers) {
      const customerName = customer.name.toLowerCase();
      const customerEmail = customer.email.toLowerCase();
      
      // Check of het een dealer is
      const isDealer = dealerKeywords.some(keyword => 
        customerName.includes(keyword) || customerEmail.includes(keyword)
      ) || customer.is_dealer;

      let newGroupId = '';
      let newGroupName = '';

      if (isDealer) {
        // Wijs dealers toe op basis van naam/email
        if (customerName.includes('goud') || customerName.includes('premium') || customerName.includes('exclusive')) {
          newGroupId = groups.find(g => g.name === 'Goud Dealers')?.id;
          newGroupName = 'Goud Dealers';
        } else if (customerName.includes('zilver') || customerName.includes('silver') || customerName.includes('professional')) {
          newGroupId = groups.find(g => g.name === 'Zilver Dealers')?.id;
          newGroupName = 'Zilver Dealers';
        } else {
          // Standaard voor dealers
          newGroupId = groups.find(g => g.name === 'Brons Dealers')?.id;
          newGroupName = 'Brons Dealers';
        }
      } else {
        // Particulieren
        newGroupId = groups.find(g => g.name === 'Particulieren')?.id;
        newGroupName = 'Particulieren';
      }

      if (newGroupId && newGroupId !== customer.customer_group_id) {
        // Update customer
        const customerRef = doc(db, 'customers', customer.id);
        await updateDoc(customerRef, {
          customer_group_id: newGroupId,
          group_name: newGroupName,
          is_dealer: isDealer
        });

        console.log(`   🔄 ${customer.name} -> ${newGroupName} (${isDealer ? 'Dealer' : 'Particulier'})`);
        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount} klanten bijgewerkt!`);

    // 4. Verificatie
    console.log('\n🔍 Verificatie van dealer toewijzingen...');
    const updatedCustomersSnapshot = await getDocs(collection(db, 'customers'));
    const updatedCustomers = updatedCustomersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const dealerCount = updatedCustomers.filter(c => c.is_dealer).length;
    const particulierCount = updatedCustomers.filter(c => !c.is_dealer).length;

    console.log(`\n📊 Statistieken:`);
    console.log(`  - Totaal klanten: ${updatedCustomers.length}`);
    console.log(`  - Dealers: ${dealerCount}`);
    console.log(`  - Particulieren: ${particulierCount}`);

    // Sample verificatie
    console.log('\n👥 Sample verificatie:');
    const sampleCustomers = updatedCustomers.slice(0, 10);
    for (const customer of sampleCustomers) {
      const group = groups.find(g => g.id === customer.customer_group_id);
      if (group) {
        console.log(`  ✅ ${customer.name} -> ${group.name} (${group.discount_percentage}% korting)`);
      } else {
        console.log(`  ❌ ${customer.name} -> ONBEKEND`);
      }
    }

    console.log('\n🎉 Dealer toewijzingen voltooid!');

  } catch (error) {
    console.error('❌ Fout bij toewijzen van dealers:', error);
  }
}

fixDealerAssignments().catch(console.error); 