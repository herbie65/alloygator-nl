# 🌐 Browser Cache Wissen & Documenten Testen

## 🧹 Stap 1: Cache Wissen

### Chrome/Edge:
1. **Druk op** `Ctrl+Shift+R` (Windows) of `Cmd+Shift+R` (Mac)
2. **Of:** `F12` → Network tab → "Disable cache" aanvinken
3. **Of:** `Ctrl+Shift+Delete` → "Cached images and files" selecteren

### Firefox:
1. **Druk op** `Ctrl+Shift+R` (Windows) of `Cmd+Shift+R` (Mac)
2. **Of:** `F12` → Network tab → "Disable cache" aanvinken

### Safari:
1. **Druk op** `Cmd+Option+R`
2. **Of:** Develop menu → "Empty Caches"

## 🔄 Stap 2: Pagina's Opnieuw Laden

### Test 1: Documenten Hoofdpagina
1. Ga naar: `http://localhost:3000/admin/documents`
2. **Verwacht resultaat:** Volledige documenten interface
3. **Als het niet werkt:** Controleer console voor errors

### Test 2: CRM Klant Pagina
1. Ga naar: `http://localhost:3000/admin/crm/2003`
2. **Verwacht resultaat:** Documenten sectie onderaan zichtbaar
3. **Als het niet werkt:** Controleer console voor errors

### Test 3: Admin Sidebar
1. Ga naar: `http://localhost:3000/admin`
2. **Verwacht resultaat:** "Documenten" link zichtbaar onder "Content"
3. **Als het niet werkt:** Hard refresh met `Ctrl+F5`

## 🚨 Als Het Nog Niet Werkt

### Controleer Console:
1. **Druk op** `F12` → Console tab
2. **Zoek naar:**
   - Firebase index errors
   - 404 errors
   - JavaScript errors

### Controleer Network:
1. **Druk op** `F12` → Network tab
2. **Herlaad pagina**
3. **Zoek naar:** Failed requests (rood)

## ✅ Succesvolle Test
- ✅ Documenten pagina laadt zonder errors
- ✅ CRM pagina toont documenten sectie
- ✅ Sidebar toont "Documenten" link
- ✅ Geen Firebase index errors in console
