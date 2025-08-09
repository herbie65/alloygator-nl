# 🔥 Firebase Setup voor AlloyGator

## 📋 Vereisten

### 1. Firebase Project
1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Maak een nieuw project aan: `alloygator-nl`
3. Schakel Google Analytics in (optioneel)

### 2. Firestore Database
1. In je Firebase project, ga naar "Firestore Database"
2. Klik "Create database"
3. Kies "Start in test mode" (voor development)
4. Selecteer een locatie (bijv. europe-west3)

### 3. Authentication
1. Ga naar "Authentication" in Firebase Console
2. Klik "Get started"
3. Schakel "Email/Password" in
4. Voeg je admin email toe als gebruiker

### 4. Hosting (optioneel)
1. Ga naar "Hosting" in Firebase Console
2. Klik "Get started"
3. Volg de setup instructies

---

## 🔧 Environment Variables

Maak een `.env.local` bestand aan in de root van het project:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alloygator-nl.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alloygator-nl
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alloygator-nl.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=501404252412
NEXT_PUBLIC_FIREBASE_APP_ID=1:501404252412:web:0dd2bd394f9a13117a3f79
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-QY0QVXYJ5H
NODE_ENV=development
```

---

## 🚀 Deployment

### 1. Firebase CLI Installeren
```bash
npm install -g firebase-tools
```

### 2. Login op Firebase
```bash
firebase login
```

### 3. Project Initialiseren
```bash
firebase init
```

Selecteer:
- Firestore
- Hosting (optioneel)
- Functions (optioneel)

### 4. Database Regels Instellen

Ga naar Firebase Console > Firestore Database > Rules en voeg deze rules toe:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin access
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.token.email == 'admin@alloygator.nl';
    }
    
    // Public read access for products and pages
    match /products/{productId} {
      allow read: if true;
    }
    
    match /cms_pages/{pageId} {
      allow read: if true;
    }
    
    // Customer access to own data
    match /customers/{customerId} {
      allow read, write: if request.auth != null && request.auth.uid == customerId;
    }
    
    // Orders - customers can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        (resource.data.customer_email == request.auth.token.email || 
         request.auth.token.email == 'admin@alloygator.nl');
    }
  }
}
```

---

## 📊 Database Schema

### Collections

#### customers
```javascript
{
  id: "auto-generated",
  name: "string",
  email: "string (unique)",
  phone: "string",
  address: "string",
  city: "string",
  postal_code: "string",
  country: "string",
  customer_group_id: "string",
  is_dealer: "boolean",
  first_name: "string",
  last_name: "string",
  company_name: "string",
  vat_number: "string",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

#### products
```javascript
{
  id: "auto-generated",
  sku: "string (unique)",
  name: "string",
  description: "string",
  price: "number",
  category: "string",
  stock: "number",
  is_active: "boolean",
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

#### orders
```javascript
{
  id: "auto-generated",
  order_number: "string (unique)",
  customer_email: "string",
  customer_name: "string",
  items: "array",
  total_amount: "number",
  status: "string",
  created_at: "timestamp"
}
```

#### vat_settings
```javascript
{
  id: "auto-generated",
  country_code: "string",
  country_name: "string",
  standard_rate: "number",
  reduced_rate: "number",
  is_eu_member: "boolean",
  created_at: "timestamp"
}
```

---

## 🔍 Troubleshooting

### 1. Firebase Connection Errors
- Controleer of alle environment variables correct zijn ingesteld
- Zorg dat Firebase project online is
- Controleer Firebase Console voor errors

### 2. Permission Errors
- Controleer Firestore Rules
- Zorg dat admin email correct is ingesteld
- Test met Firebase Console

### 3. Build Errors
- Controleer of Firebase dependencies geïnstalleerd zijn
- Zorg dat TypeScript types correct zijn
- Test lokaal voor deployment

---

## 📚 Handige Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli)

---

## ✅ Checklist

- [ ] Firebase project aangemaakt
- [ ] Firestore database geïnitialiseerd
- [ ] Authentication geconfigureerd
- [ ] Environment variables ingesteld
- [ ] Firestore rules geconfigureerd
- [ ] Lokaal testen gedaan
- [ ] Deployment getest 