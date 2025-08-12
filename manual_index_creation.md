# 🏗️ Handmatige Firebase Index Aanmaak

## 📁 Index 1: Documents Collection

### Stap 1: Firebase Console
1. Ga naar [Firebase Console](https://console.firebase.google.com)
2. Selecteer project: `alloygator-nl`
3. Ga naar **Firestore Database** > **Indexes**

### Stap 2: Index Aanmaken
1. Klik op **"Create Index"**
2. Vul in:
   - **Collection ID:** `documents`
   - **Fields:**
     - `customer_id` (Ascending)
     - `created_at` (Descending)
   - **Query scope:** Collection
3. Klik **"Create"**

## 📤 Index 2: Customer Uploads Collection

### Stap 1: Nieuwe Index
1. Klik opnieuw op **"Create Index"**
2. Vul in:
   - **Collection ID:** `customer_uploads`
   - **Fields:**
     - `status` (Ascending)
     - `created_at` (Descending)
   - **Query scope:** Collection
3. Klik **"Create"**

## ⏱️ Wacht Tijd
- **Eerste index:** 2-5 minuten
- **Tweede index:** 2-5 minuten
- **Status:** "Building" → "Enabled"

## ✅ Test Na Aanmaak
1. Ga naar `/admin/documents` - Zou nu moeten laden
2. Ga naar `/admin/crm/2003` - Documenten sectie zichtbaar
3. Console errors verdwijnen
