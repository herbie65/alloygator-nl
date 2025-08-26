# 🔑 API Keys Setup - Veilige Configuratie

## 🎯 **Waarom Environment Variables?**

API keys mogen **NOOIT** in de database worden opgeslagen omdat:
- ❌ Ze zijn zichtbaar voor alle gebruikers
- ❌ Ze kunnen per ongeluk naar GitHub worden gepusht
- ❌ Ze zijn niet veilig bij database compromittering
- ✅ Environment variables zijn server-side en veilig

## 📁 **Lokale Ontwikkeling (.env.local)**

Maak een `.env.local` bestand aan in je project root:

```bash
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyB...your_key_here

# Mollie Payment API
NEXT_PUBLIC_MOLLIE_API_KEY=live_...your_live_key_here
NEXT_PUBLIC_MOLLIE_TEST_API_KEY=test_...your_test_key_here

# e-Boekhouden API
NEXT_PUBLIC_EBOEK_USERNAME=your_username_here
NEXT_PUBLIC_EBOEK_SECURITY_CODE1=your_security_code1_here
NEXT_PUBLIC_EBOEK_SECURITY_CODE2=your_security_code2_here
```

## 🚀 **Productie Deployment**

### Vercel
1. Ga naar je project dashboard
2. Settings → Environment Variables
3. Voeg elke variabele toe

### Firebase Functions
1. `firebase functions:config:set google.maps_api_key="your_key"`
2. `firebase functions:config:set mollie.api_key="your_key"`

### Netlify
1. Site settings → Environment variables
2. Voeg elke variabele toe

## 🔒 **Veiligheid**

- ✅ `.env.local` staat in `.gitignore`
- ✅ Environment variables zijn server-side
- ✅ API keys zijn nooit zichtbaar in de frontend code
- ✅ Elke omgeving heeft eigen keys

## 📋 **Vereiste API Keys**

| Service | Environment Variable | Beschrijving |
|---------|---------------------|--------------|
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Dealer locator functionaliteit |
| Mollie | `NEXT_PUBLIC_MOLLIE_API_KEY` | Live betalingen |
| Mollie Test | `NEXT_PUBLIC_MOLLIE_TEST_API_KEY` | Test betalingen |
| e-Boekhouden | `NEXT_PUBLIC_EBOEK_USERNAME` | Boekhouding integratie |
| e-Boekhouden | `NEXT_PUBLIC_EBOEK_SECURITY_CODE1` | Beveiligingscode 1 |
| e-Boekhouden | `NEXT_PUBLIC_EBOEK_SECURITY_CODE2` | Beveiligingscode 2 |

## 🧪 **Testen**

1. Start je development server: `npm run dev`
2. Ga naar `/admin/settings` (tab: Payments)
3. Controleer of alle API keys als "✅ Geconfigureerd" worden getoond
4. Gebruik de "Toon API Keys" knop om de waarden te verifiëren

## 🚨 **Probleemoplossing**

### API Key verdwijnt na refresh
- **Oorzaak:** Environment variable niet correct ingesteld
- **Oplossing:** Controleer `.env.local` en herstart de server

### "Niet geconfigureerd" status
- **Oorzaak:** Environment variable ontbreekt of is leeg
- **Oplossing:** Voeg de juiste variabele toe aan `.env.local`

### Environment variable niet geladen
- **Oorzaak:** Server niet herstart na wijzigingen
- **Oplossing:** Stop en start de development server opnieuw

## 📚 **Meer Informatie**

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Functions Config](https://firebase.google.com/docs/functions/config-use)
