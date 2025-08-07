# AlloyGator Nederland 🚗

**Professionele velgbescherming tegen stoeprandschade**

[![Live Site](https://img.shields.io/badge/Live%20Site-alloygator-nl.web.app-green)](https://alloygator-nl.web.app/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%7C%20Database-blue)](https://firebase.google.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 🌟 Over AlloyGator

AlloyGator is de meest effectieve manier om uw velgen te beschermen tegen stoeprandschade. Onze kunststof velgbescherming is duurzaam, eenvoudig te monteren en vrijwel onzichtbaar.

### ✨ Kenmerken

- **Eenvoudige montage** - Monteer in slechts 30 minuten zonder speciale gereedschappen
- **Onzichtbare bescherming** - Behoudt de originele uitstraling van uw velgen
- **Duurzaam materiaal** - Hoogwaardige kunststof bestand tegen extreme weersomstandigheden
- **Gegarandeerde bescherming** - Beschermt tegen schade tot 5cm van de stoeprand

## 🚀 Live Website

**🌐 [https://alloygator-nl.web.app/](https://alloygator-nl.web.app/)**

## 🛠️ Technische Stack

### Frontend
- **Next.js 14** - React framework met App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI library

### Backend & Database
- **Firebase Hosting** - Web hosting
- **Firebase Firestore** - NoSQL database
- **Firebase Functions** - Serverless functions

### Integraties
- **DHL Parcel API** - Shipping integration
- **Google Maps API** - Dealer locator
- **Payment processing** - Checkout system

## 📁 Project Structuur

```
alloygator-nl/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes
│   │   ├── winkel/            # Shop pages
│   │   ├── checkout/          # Checkout process
│   │   └── components/        # Shared components
│   ├── lib/                   # Utilities & Firebase
│   └── styles/                # Global styles
├── public/                    # Static assets
├── functions/                 # Firebase Functions
└── docs/                      # Documentation
```

## 🎯 Functionaliteiten

### 🛍️ E-commerce
- **Product catalogus** - AlloyGator sets, montagehulpmiddelen, accessoires
- **Winkelwagen** - Shopping cart functionality
- **Checkout proces** - Complete order flow
- **Betalingen** - Secure payment processing

### 🏢 Admin Panel
- **Klantbeheer** - Customer CRM
- **Bestellingen** - Order management
- **Productbeheer** - Product administration
- **DHL Instellingen** - Shipping configuration
- **Database viewer** - Data management

### 🚚 Shipping & Logistics
- **DHL Parcel integratie** - Automated shipping
- **Dealer locator** - Find nearby dealers
- **Shipping calculator** - Cost calculation

### 📊 Data Management
- **Firebase Firestore** - Real-time database
- **Customer groups** - Segmentation
- **VAT settings** - Tax configuration
- **Payment settings** - Payment methods

## 🚀 Deployment

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy to Firebase
firebase deploy
```

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🛠️ Development

### Installatie
```bash
# Clone repository
git clone https://github.com/herbie65/alloygator-nl.git
cd alloygator-nl

# Install dependencies
npm install

# Start development server
npm run dev
```

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📊 Database Schema

### Collections
- **customers** - Klantgegevens
- **products** - Productcatalogus
- **orders** - Bestellingen
- **dealers** - Dealer informatie
- **settings** - App instellingen
- **dhl_settings** - Shipping configuratie

## 🔧 API Endpoints

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/[id]` - Get customer by ID
- `POST /api/customers` - Create customer
- `PUT /api/customers/[id]` - Update customer

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order

### Settings
- `GET /api/dhl-settings` - Get DHL settings
- `PUT /api/dhl-settings` - Update DHL settings

## 🤝 Bijdragen

1. Fork het project
2. Maak een feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit je wijzigingen (`git commit -m 'Add some AmazingFeature'`)
4. Push naar de branch (`git push origin feature/AmazingFeature`)
5. Open een Pull Request

## 📞 Contact

**AlloyGator Nederland**
- 📍 Kweekgrasstraat 36, 1313 BX Almere
- 📞 085-3033400
- 📧 info@alloygator.nl
- 🌐 [https://alloygator-nl.web.app/](https://alloygator-nl.web.app/)

## 📄 Licentie

© 2025 AlloyGator Netherlands. All rights reserved.

---

**Built with ❤️ using Next.js, Firebase, and TypeScript**
