# AlloyGator Nederland - E-commerce Platform

Een moderne Next.js e-commerce website voor AlloyGator Nederland met hybride deployment (statisch + server-side).

## 🚀 Features

### ✅ Werkende Functionaliteiten
- **Product Catalogus** - Volledige producten database
- **Winkelwagen** - Add to cart functionaliteit
- **Checkout Proces** - Bestellingen plaatsen
- **Dealer Login** - Specifieke dealer functionaliteiten
- **Admin Panel** - Beheer van producten, orders, klanten
- **Contact Pagina** - Bedrijfsinformatie
- **SEO Optimized** - Sitemap en robots.txt

### 🔧 API Functionaliteiten
- **User Authentication** - Login/Register systeem
- **Order Management** - Bestellingen aanmaken en ophalen
- **Email Notifications** - SendGrid integratie voor order bevestigingen
- **Firebase Integration** - Realtime database

## 🏗️ Deployment Strategie

### Hybride Deployment
- **Statische Export** - Voor snelle pagina's (producten, info)
- **Server-side API** - Voor dynamische functionaliteiten (login, orders, email)
- **Firebase Hosting** - Voor statische content
- **Firebase Functions** - Voor server-side API's

## 📦 Installatie

```bash
# Clone repository
git clone https://github.com/herbie65/alloygator-nl.git
cd alloygator-nl

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase and SendGrid credentials

# Run development server
npm run dev
```

## 🔧 Environment Variables

Maak een `.env.local` bestand aan:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# SendGrid Email Service
SENDGRID_API_KEY=your_sendgrid_api_key

# Node Environment
NODE_ENV=production
```

## 🚀 Deployment

### 1. Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init hosting
firebase init functions

# Deploy to Firebase
firebase deploy
```

### 2. GitHub Actions (Automatisch)
De deployment gebeurt automatisch via GitHub Actions wanneer je naar de `main` branch pusht.

### 3. SendGrid Setup
1. Maak een SendGrid account aan
2. Verificeer je sender domain (info@alloygator.nl)
3. Genereer een API key
4. Voeg de API key toe aan je environment variables

## 📁 Project Structuur

```
alloygator-nl/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # Authentication
│   │   │   ├── orders/            # Order management
│   │   │   └── email/             # Email notifications
│   │   ├── admin/                 # Admin panel
│   │   ├── winkel/                # Product catalog
│   │   └── checkout/              # Checkout process
│   └── lib/
│       ├── firebase.ts            # Firebase configuration
│       └── firebase-client.ts     # Client-side Firebase
├── functions/                     # Firebase Functions
├── public/                       # Static assets
└── .github/workflows/            # CI/CD pipelines
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server

# Building
npm run build           # Build for production
npm run build:static    # Build for static export
npm run build:server    # Build for server-side

# Deployment
npm run start           # Start production server
firebase deploy         # Deploy to Firebase
```

## 📧 Email Functionaliteit

### SendGrid Integratie
- **Order Confirmations** - Automatische emails bij bestellingen
- **HTML Templates** - Professionele email layouts
- **Error Handling** - Fallback naar console logging

### Email Template
```typescript
// Order confirmation email
const emailContent = {
  to: customerEmail,
  from: 'info@alloygator.nl',
  subject: `Bestelling bevestiging - ${orderNumber}`,
  html: `...` // HTML template
}
```

## 🔐 Authentication

### User Types
- **Customers** - Normale klanten
- **Dealers** - Specifieke dealer functionaliteiten
- **Admins** - Volledige admin toegang

### API Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/orders?customerId=...` - Get user orders
- `POST /api/orders` - Create new order

## 🛒 E-commerce Features

### Product Management
- **Product Catalog** - Volledige product database
- **Categories** - Product categorisering
- **Images** - Product afbeeldingen
- **Pricing** - Dynamische prijzen

### Order System
- **Cart Management** - Winkelwagen functionaliteit
- **Checkout Process** - Bestelling plaatsen
- **Order Tracking** - Bestelling status
- **Email Notifications** - Order bevestigingen

## 🎨 UI/UX

### Design System
- **Mantine UI** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Responsive Design** - Mobile-first approach
- **Brand Colors** - Green and orange theme

### Key Pages
- **Homepage** - Landing page met hero section
- **Product Catalog** - Product overzicht
- **Product Detail** - Individuele product pagina's
- **Cart** - Winkelwagen
- **Checkout** - Bestelling afronden
- **Admin Panel** - Beheer interface

## 🔧 Technische Details

### Tech Stack
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Firebase** - Backend services
- **SendGrid** - Email service
- **Mantine UI** - Component library
- **Tailwind CSS** - Styling

### Performance
- **Static Generation** - Voor snelle pagina's
- **Server-side Rendering** - Voor dynamische content
- **Image Optimization** - Next.js image component
- **Code Splitting** - Automatische code splitting

## 🚀 Deployment Status

### ✅ Werkende Deployment
- **Website** - https://alloygator-nl.web.app/
- **GitHub Actions** - Automatische CI/CD
- **Firebase Hosting** - Statische content
- **Firebase Functions** - Server-side API's

### 📊 Monitoring
- **Build Status** - GitHub Actions
- **Deployment Logs** - Firebase Console
- **Error Tracking** - Console logging

## 🔄 Updates en Maintenance

### Automatische Updates
- **GitHub Actions** - Automatische deployment bij push
- **Firebase Functions** - Serverless scaling
- **SendGrid** - Email delivery monitoring

### Manual Updates
```bash
# Update dependencies
npm update

# Rebuild and deploy
npm run build
firebase deploy
```

## 📞 Support

Voor vragen of problemen:
- **Email** - info@alloygator.nl
- **Telefoon** - 085-3033400
- **GitHub Issues** - Voor technische problemen

---

**AlloyGator Nederland** - Kweekgrasstraat 36, 1313 BX Almere
