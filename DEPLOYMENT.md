# Netlify Deployment Guide

## Voorbereiding

### 1. Database Setup
Voor productie deployment heb je een externe database nodig omdat Netlify geen persistente bestandsopslag heeft.

**Opties:**
- **Supabase** (Aanbevolen - gratis tier)
- **PlanetScale** (MySQL)
- **Railway** (PostgreSQL)
- **Vercel Postgres**

### 2. Environment Variables
Voeg deze environment variables toe in Netlify:

```env
NODE_ENV=production
DATABASE_URL=your_database_connection_string
NEXT_PUBLIC_API_URL=https://your-site.netlify.app
```

## Deployment Stappen

### 1. GitHub Repository
1. Push je code naar GitHub
2. Zorg dat je repository public is of verbind je Netlify account

### 2. Netlify Setup
1. Ga naar [netlify.com](https://netlify.com)
2. Klik "New site from Git"
3. Kies je GitHub repository
4. Configureer de build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18

### 3. Environment Variables
In Netlify dashboard:
1. Ga naar Site settings > Environment variables
2. Voeg de environment variables toe

### 4. Database Migration
Voor Supabase:
1. Maak een Supabase project
2. Exporteer je lokale database data
3. Importeer in Supabase
4. Update de database connection string

## Huidige Limitaties

⚠️ **Belangrijk:** De huidige setup gebruikt een tijdelijke database in productie. Dit betekent:
- Data wordt niet opgeslagen tussen requests
- Elke server restart verliest alle data
- Niet geschikt voor productie gebruik

## Aanbevolen Volgende Stappen

1. **Implementeer Supabase integratie**
2. **Migreer bestaande data**
3. **Test de deployment**
4. **Configureer custom domain**

## Lokale Test

```bash
# Test build
npm run build

# Test production build
NODE_ENV=production npm start
```

## Troubleshooting

### Build Errors
- Controleer of alle dependencies in package.json staan
- Zorg dat Node.js versie 18+ wordt gebruikt

### Database Errors
- Controleer DATABASE_URL environment variable
- Zorg dat database toegankelijk is vanaf Netlify

### API Errors
- Controleer of alle API routes werken
- Test met Postman of curl 