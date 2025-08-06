const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup Helper');
console.log('========================');
console.log('');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local bestand gevonden');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('your-api-key')) {
    console.log('⚠️  Firebase configuratie nog niet aangepast in .env.local');
  } else {
    console.log('✅ Firebase configuratie lijkt correct in .env.local');
  }
} else {
  console.log('❌ .env.local bestand niet gevonden');
  console.log('');
  console.log('📝 Maak een .env.local bestand aan met:');
  console.log('');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id');
  console.log('');
}

console.log('');
console.log('📋 Firebase Setup Stappen:');
console.log('1. Ga naar https://console.firebase.google.com/');
console.log('2. Klik "Create a project"');
console.log('3. Project naam: alloygator-nl');
console.log('4. Schakel Google Analytics uit (optioneel)');
console.log('5. Klik "Create project"');
console.log('');
console.log('6. Ga naar "Firestore Database"');
console.log('7. Klik "Create database"');
console.log('8. Kies "Start in test mode"');
console.log('9. Locatie: europe-west1');
console.log('10. Klik "Done"');
console.log('');
console.log('11. Ga naar "Project settings" (tandwiel icoon)');
console.log('12. Scroll naar "Your apps"');
console.log('13. Klik web icoon (</>)');
console.log('14. App nickname: alloygator-nl-web');
console.log('15. Schakel "Firebase Hosting" uit');
console.log('16. Klik "Register app"');
console.log('17. Kopieer de configuratie');
console.log('');
console.log('18. Maak .env.local bestand met je configuratie');
console.log('19. Voer uit: node export_database.js');
console.log('20. Voer uit: node migrate_to_firebase.js');
console.log('');

// Check if database exists
const dbPath = path.join(__dirname, 'alloygator.db');
if (fs.existsSync(dbPath)) {
  console.log('✅ SQLite database gevonden');
} else {
  console.log('❌ SQLite database niet gevonden');
  console.log('📋 Start eerst de development server: npm run dev');
}

console.log('');
console.log('🚀 Volgende stappen:');
console.log('1. Configureer Firebase in .env.local');
console.log('2. Exporteer database: node export_database.js');
console.log('3. Migreer naar Firebase: node migrate_to_firebase.js');
console.log('4. Test lokaal: npm run dev');
console.log('5. Deploy naar Netlify');
console.log(''); 