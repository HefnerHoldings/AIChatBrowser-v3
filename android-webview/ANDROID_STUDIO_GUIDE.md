# 🚀 Android Studio Setup Guide

## Steg 1: Åpne prosjektet
1. Start Android Studio
2. Velg "Open an Existing Project"
3. Naviger til denne mappen:
   ```
   C:\Users\post\Downloads\AIChatBrowser\AIChatBrowser\android-webview
   ```
4. Klikk "OK"

## Steg 2: Første synkronisering
- Android Studio vil automatisk synkronisere prosjektet
- Vent til "Gradle Sync" er ferdig
- Du kan se fremdrift nederst i vinduet

## Steg 3: SDK-konfigurasjon
Hvis du får feilmeldinger om manglende SDK:
1. Gå til File → Project Structure
2. Velg "SDK Location"
3. Sørg for at Android SDK er installert

## Steg 4: Opprett emulator
1. Klikk på "Device Manager" (telefon-ikon øverst til høyre)
2. Klikk "Create Virtual Device"
3. Velg "Phone" → "Pixel 4" (eller lignende)
4. Velg API Level 30+ (Android 11+)
5. Klikk "Next" → "Finish"

## Steg 5: Start serveren først
Før du kjører appen, start AIChatBrowser serveren:
```bash
# I hovedprosjekt-mappen
npm install
npm run dev
```

## Steg 6: Kjør appen
1. Velg emulator i dropdown (øverst)
2. Klikk grønn "Run" knapp (▶️)
3. Vent på bygging og installasjon

## 🔧 Troubleshooting

### Problem: "SDK not found"
Løsning: File → Project Structure → SDK Location → velg riktig SDK-sti

### Problem: "Gradle sync failed"
Løsning: File → Sync Project with Gradle Files

### Problem: "Emulator ikke tilgjengelig"
Løsning: Tools → AVD Manager → Create Virtual Device

### Problem: "App crashes på start"
Løsning: Sjekk at serveren kjører på localhost:5000

## 🎯 Neste steg
Når alt er satt opp, vil du se AIChatBrowser-appen kjøre i emulatoren!
