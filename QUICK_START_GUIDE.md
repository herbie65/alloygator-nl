# 🚀 AlloyGator NL - Quick Start Guide

**Bewaar dit document voor toekomstig gebruik!**

---

## 📋 Project Overzicht

**AlloyGator Nederland** - Professionele velgbescherming website
- **Live Site**: https://alloygator-nl.web.app/
- **GitHub**: https://github.com/herbie65/alloygator-nl
- **Firebase Project**: alloygator-nl

---

## 🔄 Opnieuw Verbinden (Voor Volgende Keer)

### Stap 1: Repository Clonen
```bash
# Ga naar je gewenste directory
cd ~/Desktop

# Clone de repository
git clone https://github.com/herbie65/alloygator-nl.git

# Ga naar de project directory
cd alloygator-nl
```

### Stap 2: Dependencies Installeren
```bash
# Installeer alle packages
npm install
```

### Stap 3: Environment Variables Instellen
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

### Stap 4: Development Server Starten
```bash
# Start de development server
npm run dev
```

**🎉 Je site draait nu op http://localhost:3000**

---

## 🛠️ Development Commands

### Basis Commands
```bash
npm run dev          # Start development server
npm run build        # Build voor productie
npm run start        # Start productie server
npm run lint         # Run ESLint
```

### Git Commands
```bash
git status           # Bekijk wijzigingen
git add .            # Voeg alle wijzigingen toe
git commit -m "message"  # Commit wijzigingen
git push             # Push naar GitHub
git pull             # Haal updates op
```

### Firebase Commands
```bash
# Installeer Firebase CLI (eerste keer)
npm install -g firebase-tools

# Login op Firebase
firebase login

# Bekijk projecten
firebase projects:list

# Deploy naar Firebase
firebase deploy
```

---

## 🔗 Belangrijke Links

### 🌐 Live Websites
- **AlloyGator NL**: https://alloygator-nl.web.app/
- **Admin Panel**: https://alloygator-nl.web.app/admin

### 🛠️ Development Tools
- **GitHub Repository**: https://github.com/herbie65/alloygator-nl
- **Firebase Console**: https://console.firebase.google.com/project/alloygator-nl
- **Firebase Hosting**: https://console.firebase.google.com/project/alloygator-nl/hosting

### 📊 Database
- **Firestore Database**: https://console.firebase.google.com/project/alloygator-nl/firestore
- **Authentication**: https://console.firebase.google.com/project/alloygator-nl/authentication

---

## 📁 Project Structuur

```
alloygator-nl/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin panel (/admin)
│   │   ├── api/               # API routes (/api/*)
│   │   ├── winkel/            # Shop pages (/winkel/*)
│   │   ├── checkout/          # Checkout process
│   │   └── components/        # Shared components
│   ├── lib/                   # Utilities & Firebase
│   └── styles/                # Global styles
├── public/                    # Static assets
├── functions/                 # Firebase Functions
└── docs/                      # Documentation
```

---

## 🎯 Belangrijke Functionaliteiten

### 🛍️ E-commerce
- **Product catalogus**: AlloyGator sets, montagehulpmiddelen, accessoires
- **Winkelwagen**: Shopping cart functionality
- **Checkout proces**: Complete order flow
- **Betalingen**: Secure payment processing

### 🏢 Admin Panel (/admin)
- **Klantbeheer**: Customer CRM
- **Bestellingen**: Order management
- **Productbeheer**: Product administration
- **DHL Instellingen**: Shipping configuration
- **Database viewer**: Data management

### 🚚 Shipping & Logistics
- **DHL Parcel integratie**: Automated shipping
- **Dealer locator**: Find nearby dealers
- **Shipping calculator**: Cost calculation

---

## 📊 Database Status

**Firebase Firestore Collections:**
- **customers**: 117 klanten (84 dealers + 33 particulieren)
- **products**: 7 producten
- **orders**: 3 bestellingen
- **settings**: 1 instellingen document
- **dhl_settings**: 1 DHL configuratie

---

## 🔧 Troubleshooting

### Probleem: "npm run dev" werkt niet
```bash
# Controleer of je in de juiste directory bent
pwd
# Moet eindigen op: /alloygator-nl

# Controleer package.json
cat package.json

# Reinstalleer dependencies
rm -rf node_modules package-lock.json
npm install
```

### Probleem: Firebase verbinding werkt niet
```bash
# Test Firebase verbinding
node -e "
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyBfTecdVHIYbwyI822bcKAhLWs0bNNT1yM',
  authDomain: 'alloygator-nl.firebaseapp.com',
  projectId: 'alloygator-nl',
  storageBucket: 'alloygator-nl.firebasestorage.app',
  messagingSenderId: '501404252412',
  appId: '1:501404252412:web:0dd2bd394f9a13117a3f79'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log('✅ Firebase verbinding succesvol!');
"
```

### Probleem: Environment variables niet gevonden
```bash
# Controleer of .env.local bestaat
ls -la .env*

# Maak .env.local aan als het niet bestaat
cp .env.example .env.local
# Of maak het handmatig aan met de configuratie hierboven
```

---

## 🚀 Deployment

### Automatische Deployment
- **GitHub Actions** is ingesteld voor automatische deployment
- Bij elke push naar `main` branch wordt automatisch gedeployed
- **Geen handmatige actie nodig!**

### Handmatige Deployment
```bash
# Build voor productie
npm run build

# Deploy naar Firebase
firebase deploy
```

---

## 📞 Contact & Support

**AlloyGator Nederland**
- 📍 Kweekgrasstraat 36, 1313 BX Almere
- 📞 085-3033400
- 📧 info@alloygator.nl
- 🌐 https://alloygator-nl.web.app/

---

## 💾 Backup Informatie

### Belangrijke Bestanden
- `.env.local` - Environment variables
- `firebase.json` - Firebase configuratie
- `.firebaserc` - Firebase project instellingen
- `package.json` - Dependencies

### Database Backup
- **Automatisch**: Firebase Firestore heeft automatische backups
- **Handmatig**: Export via Firebase Console
- **Lokaal**: `alloygator.db` (SQLite backup)

---

**📝 Bewaar dit document op een veilige plek!**

**Laatste update**: 6 augustus 2025
**Versie**: 1.0 