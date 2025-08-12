# 🔑 Firebase Service Account Key Ophalen

## Stap 1: Ga naar Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Selecteer je project: `alloygator-nl`

## Stap 2: Project Instellingen
1. Klik op het tandwiel (⚙️) naast "Project Overview"
2. Selecteer "Project settings"

## Stap 3: Service Accounts Tab
1. Ga naar de "Service accounts" tab
2. Klik op "Generate new private key"
3. Download het JSON bestand

## Stap 4: Bestand Hernoemen
1. Hernoem het gedownloade bestand naar: `serviceAccountKey.json`
2. Plaats het in de root van je project: `/Users/herbertkats/Desktop/AlloyGator/alloygator-nl/`

## Stap 5: Indexes Aanmaken
Na het plaatsen van de key, run:
```bash
node create_indexes_admin.js
```

## ⚠️ Belangrijk
- **Deel NOOIT** de service account key
- Voeg `serviceAccountKey.json` toe aan `.gitignore`
- Bewaar de key veilig
