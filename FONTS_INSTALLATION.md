# Anleitung: Google Fonts lokal hosten

## ✅ Was bereits erledigt wurde:

1. ✅ Ordner `/public/fonts/` erstellt
2. ✅ CSS-Datei `/public/fonts/fonts.css` mit @font-face Deklarationen erstellt
3. ✅ `index.css` aktualisiert (Google Fonts CDN entfernt)
4. ✅ Content Security Policy in `index.html` aktualisiert (Google Domains entfernt)

## 📥 Was Sie noch machen müssen:

### Schritt 1: Fonts herunterladen

Besuchen Sie **https://gwfh.mranftl.com/fonts** und laden Sie folgende Fonts herunter:

1. **Special Elite**
   - URL: https://gwfh.mranftl.com/fonts/special-elite
   - Wählen Sie: Regular (400)
   - Format: Modern Browsers (woff2)

2. **Gloria Hallelujah**
   - URL: https://gwfh.mranftl.com/fonts/gloria-hallelujah
   - Wählen Sie: Regular (400)
   - Format: Modern Browsers (woff2)

3. **Architects Daughter**
   - URL: https://gwfh.mranftl.com/fonts/architects-daughter
   - Wählen Sie: Regular (400)
   - Format: Modern Browsers (woff2)

4. **Courier Prime**
   - URL: https://gwfh.mranftl.com/fonts/courier-prime
   - Wählen Sie: Regular (400) UND Bold (700)
   - Format: Modern Browsers (woff2)

### Schritt 2: Dateien kopieren

Kopieren Sie alle heruntergeladenen `.woff2` Dateien in:
```
/Users/kengel/Documents/Escapology/Heistology Beta/public/fonts/
```

Die Dateinamen sollten sein:
- `special-elite-v18-latin-regular.woff2`
- `gloria-hallelujah-v21-latin-regular.woff2`
- `architects-daughter-v18-latin-regular.woff2`
- `courier-prime-v7-latin-regular.woff2`
- `courier-prime-v7-latin-700.woff2`

**Hinweis:** Die Versionsnummern (v18, v21, v7) können variieren. Passen Sie dann die Pfade in `/public/fonts/fonts.css` entsprechend an.

### Schritt 3: Testen

Starten Sie den Dev-Server neu:
```bash
npm run dev
```

Öffnen Sie die Browser-Entwicklertools (F12) → Network Tab und prüfen Sie:
- ❌ Keine Anfragen an `fonts.googleapis.com`
- ❌ Keine Anfragen an `fonts.gstatic.com`
- ✅ Anfragen an `/fonts/*.woff2` sollten erfolgreich sein (Status 200)

## 🔒 DSGVO-Hinweis

**Wichtig:** Ihre App verwendet immer noch:
- **Google Analytics** (setzt Cookies: _ga, _gid, _gat)
- **Sentry** (kann Cookies setzen)

Für vollständige DSGVO-Konformität benötigen Sie einen **Cookie-Banner** mit Opt-in für diese Dienste.

## 📋 Checkliste

- [ ] Alle 5 Font-Dateien heruntergeladen
- [ ] Dateien nach `/public/fonts/` kopiert
- [ ] Dateinamen in `fonts.css` überprüft/angepasst
- [ ] Dev-Server neu gestartet
- [ ] Im Browser getestet (keine Google-Anfragen mehr)
- [ ] Cookie-Banner für Analytics/Sentry implementieren (optional)
