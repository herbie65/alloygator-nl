# AlloyGator NL

Een complete e-commerce applicatie voor AlloyGator met BTW berekening, dealer management, en Mollie betalingen.

## 🚀 Snelle Start

### Lokale Development
```bash
# Installeer dependencies
npm install

# Start development server
npm run dev

# Build voor productie
npm run build
```

## 📊 Database Setup

### Development (SQLite)
- **Lokale SQLite database** voor development
- **Automatische data initialisatie** bij eerste start
- **115 klanten** (84 dealers + 31 particulieren)

### Productie (Firebase Firestore)
- **Firebase Spark Plan** (gratis tier)
- **Real-time database** met offline support
- **Automatische scaling** en backup

## 🔥 Firebase Setup

### 1. Firebase Project
1. Ga naar [Firebase Console](https://console.firebase.google.com/)
2. Maak een nieuw project: `alloygator-nl`
3. Activeer Firestore Database
4. Voeg web app toe en kopieer configuratie

### 2. Environment Variables
Voeg deze toe aan `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 3. Database Migratie
```bash
# Exporteer huidige data
node export_database.js

# Migreer naar Firebase
node migrate_to_firebase.js
```

📖 **Uitgebreide Firebase setup:** Zie `FIREBASE_SETUP.md`

## 🌐 Netlify Deployment

### Stap 1: GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/alloygator-nl.git
git push -u origin main
```

### Stap 2: Netlify Setup
1. Ga naar [netlify.com](https://netlify.com)
2. Klik "New site from Git"
3. Kies je GitHub repository
4. Configureer build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18

### Stap 3: Environment Variables
Voeg Firebase configuratie toe in Netlify dashboard:
- Ga naar Site settings > Environment variables
- Voeg alle Firebase environment variables toe

## 🛠️ Technische Details

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite (dev) + Firebase Firestore (prod)
- **Betalingen:** Mollie API
- **Verzending:** DHL Parcel integratie

### Database Schema
- `customers` - Klanten en dealers (115 records)
- `products` - Producten met BTW categorieën (5 records)
- `orders` - Bestellingen en facturen
- `vat_settings` - BTW instellingen per land (5 records)
- `shipping_settings` - Verzendmethoden (3 records)
- `payment_settings` - Betalingsinstellingen (1 record)

### API Endpoints
- `/api/customers` - Klant management
- `/api/products` - Product management
- `/api/orders` - Bestellingen
- `/api/vat-settings` - BTW instellingen
- `/api/mollie/*` - Betalingsintegratie
- `/api/dhl-*` - Verzendintegratie

## 📁 Project Structuur

```
alloygator-nl/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/            # API routes
│   │   ├── checkout/       # Checkout proces
│   │   ├── winkel/         # Product catalogus
│   │   └── components/     # Herbruikbare componenten
│   └── lib/
│       ├── database.ts     # Database configuratie (SQLite/Firebase)
│       ├── firebase.ts     # Firebase service
│       └── vat-utils.ts    # BTW berekening utilities
├── public/                 # Statische bestanden
├── netlify.toml           # Netlify configuratie
├── FIREBASE_SETUP.md      # Firebase setup guide
└── DEPLOYMENT.md          # Uitgebreide deployment guide
```

## 🔧 Development

### Database Reset
```bash
# Verwijder database en start opnieuw
rm alloygator.db
npm run dev
```

### Data Import
```bash
# Importeer dealers
node import_all_dealers.js

# Importeer goud dealers
node import_goud_dealers.js

# Exporteer database
node export_database.js
```

### Firebase Migratie
```bash
# Migreer naar Firebase
node migrate_to_firebase.js
```

## 📈 Firebase Spark Plan Limieten

### Gratis Tier:
- **1GB** opslag
- **50K reads** per dag
- **20K writes** per dag
- **20K deletes** per dag

### Monitoring:
- Firebase Console > Usage and billing
- Stel alerts in voor limieten

## ⚠️ Belangrijke Notities

### Database Limitaties
- **Development:** SQLite (lokaal bestand)
- **Productie:** Firebase Firestore (cloud database)
- **Migratie:** Automatisch via scripts

### Security
- **Development:** Open toegang
- **Productie:** Firebase security rules vereist
- **API Keys:** Altijd via environment variables

## 📞 Support

Voor vragen over:
- **Firebase setup:** Zie `FIREBASE_SETUP.md`
- **Deployment:** Zie `DEPLOYMENT.md`
- **Database migratie:** Zie migratie scripts

## 🎯 Volgende Stappen

1. ✅ **Firebase project aanmaken**
2. ✅ **Environment variables configureren**
3. ✅ **Database migreren**
4. ✅ **Security rules instellen**
5. ✅ **Testen in development**
6. ✅ **Deployen naar Netlify**
7. ✅ **Monitoring instellen**
