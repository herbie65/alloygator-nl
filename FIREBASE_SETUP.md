# Firebase Setup Guide

## 🚀 Firebase Project Setup

### 1. Firebase Console
1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Klik "Create a project" of "Add project"
3. Geef je project een naam: `alloygator-nl`
4. Schakel Google Analytics uit (optioneel)
5. Klik "Create project"

### 2. Firestore Database
1. In je Firebase project, ga naar "Firestore Database"
2. Klik "Create database"
3. Kies "Start in test mode" (voor development)
4. Kies een locatie (bijv. `europe-west1` voor Nederland)
5. Klik "Done"

### 3. Web App Toevoegen
1. Ga naar "Project settings" (tandwiel icoon)
2. Scroll naar "Your apps" sectie
3. Klik het web icoon (`</>`)
4. Geef je app een naam: `alloygator-nl-web`
5. Schakel "Firebase Hosting" uit
6. Klik "Register app"
7. Kopieer de configuratie:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 4. Environment Variables
Voeg deze environment variables toe aan je `.env.local` bestand:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 5. Netlify Environment Variables
Voeg dezelfde environment variables toe in Netlify:
1. Ga naar je Netlify dashboard
2. Ga naar Site settings > Environment variables
3. Voeg alle Firebase configuratie toe

## 📊 Database Migratie

### 1. Export Huidige Data
```bash
# Exporteer de huidige SQLite database
node export_database.js
```

### 2. Migreer naar Firebase
```bash
# Update de Firebase configuratie in migrate_to_firebase.js
# Voer je eigen Firebase configuratie in

# Voer de migratie uit
node migrate_to_firebase.js
```

### 3. Verificeer Migratie
1. Ga naar Firebase Console > Firestore Database
2. Controleer of alle collections zijn aangemaakt:
   - `customers` (115 documents)
   - `products` (5 documents)
   - `vat_settings` (5 documents)
   - `shipping_settings` (3 documents)
   - `payment_settings` (1 document)
   - etc.

## 🔒 Security Rules

### Firestore Security Rules
Ga naar Firebase Console > Firestore Database > Rules en voeg deze rules toe:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    // WARNING: This is for development only!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Waarschuwing:** Deze rules staan alle toegang toe. Voor productie moet je specifieke rules maken.

## 🧪 Test Setup

### 1. Lokale Test
```bash
# Start development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/customers
curl http://localhost:3000/api/products
```

### 2. Productie Test
```bash
# Build voor productie
npm run build

# Test met NODE_ENV=production
NODE_ENV=production npm start
```

## 📈 Firebase Spark Plan Limieten

### Gratis Tier Limieten:
- **1GB** opslag
- **50K reads** per dag
- **20K writes** per dag
- **20K deletes** per dag

### Monitoring:
1. Ga naar Firebase Console > Usage and billing
2. Monitor je dagelijkse gebruik
3. Stel alerts in voor limieten

## 🔧 Troubleshooting

### Veelvoorkomende Problemen:

1. **"Firebase App named '[DEFAULT]' already exists"**
   - Zorg dat je Firebase maar één keer initialiseert

2. **"Missing or insufficient permissions"**
   - Controleer je Firestore security rules
   - Zorg dat je API key correct is

3. **"Quota exceeded"**
   - Monitor je Firebase usage
   - Overweeg upgrade naar Blaze plan

4. **"Network error"**
   - Controleer je internet verbinding
   - Controleer Firebase project locatie

## 📞 Support

Voor vragen over Firebase setup:
1. [Firebase Documentation](https://firebase.google.com/docs)
2. [Firebase Console](https://console.firebase.google.com/)
3. [Firebase Support](https://firebase.google.com/support)

## 🎯 Volgende Stappen

1. ✅ **Firebase project aanmaken**
2. ✅ **Environment variables configureren**
3. ✅ **Database migreren**
4. ✅ **Security rules instellen**
5. ✅ **Testen in development**
6. ✅ **Deployen naar Netlify**
7. ✅ **Monitoring instellen** 