const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection } = require('firebase/firestore');

// Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM",
  authDomain: "alloygator-nl.firebaseapp.com",
  projectId: "alloygator-nl",
  storageBucket: "alloygator-nl.firebasestorage.app",
  messagingSenderId: "501404252412",
  appId: "1:501404252412:web:0dd2bd394f9a13117a3f79",
  measurementId: "G-QY0QVXYJ5H"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkHomepagePages() {
  try {
    console.log('🔍 Controleren van alle CMS pagina\'s...');
    
    const pagesSnapshot = await getDocs(collection(db, 'cms_pages'));
    const pages = pagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`\n📊 Totaal aantal CMS pagina's: ${pages.length}`);
    
    // Zoek naar alle pagina's die mogelijk als homepage kunnen dienen
    const possibleHomepages = pages.filter(p => 
      ['home', 'homepage', 'index', '/'].includes(String(p.slug || '').toLowerCase()) ||
      p.title?.toLowerCase().includes('home') ||
      p.title?.toLowerCase().includes('start')
    );
    
    if (possibleHomepages.length > 0) {
      console.log('\n🏠 Mogelijke homepage pagina\'s gevonden:');
      possibleHomepages.forEach(page => {
        console.log(`\n📄 ID: ${page.id}`);
        console.log(`   Titel: ${page.title}`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   Gepubliceerd: ${page.is_published ? '✅ Ja' : '❌ Nee'}`);
        console.log(`   Aangemaakt: ${page.created_at}`);
        console.log(`   Bijgewerkt: ${page.updated_at}`);
        
        // Toon eerste 200 karakters van content
        if (page.content) {
          const preview = page.content.substring(0, 200).replace(/\s+/g, ' ').trim();
          console.log(`   Content preview: ${preview}...`);
        }
      });
    } else {
      console.log('\n✅ Geen homepage pagina\'s gevonden');
    }
    
    // Toon alle andere pagina's
    const otherPages = pages.filter(p => !possibleHomepages.includes(p));
    if (otherPages.length > 0) {
      console.log('\n📚 Overige CMS pagina\'s:');
      otherPages.forEach(page => {
        console.log(`   • ${page.title} (${page.slug}) - ${page.is_published ? 'Gepubliceerd' : 'Concept'}`);
      });
    }
    
    console.log('\n🔍 Controle voltooid!');
    
  } catch (error) {
    console.error('❌ Fout bij controleren CMS pagina\'s:', error);
  }
}

// Voer het script uit
checkHomepagePages().then(() => {
  console.log('🏁 Script voltooid');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script gefaald:', error);
  process.exit(1);
});
