# AIChatBrowser Android App

## 📱 Android WebView App for AIChatBrowser

Dette er en Android WebView-app som kjører AIChatBrowser i en mobil-optimalisert WebView.

### 🚀 Funksjoner

- **Full WebView-støtte** - Kjører hele AIChatBrowser i en Android WebView
- **CORS-bypass** - Støtter utvikling med CORS-omgåelse
- **Fil-opplasting** - Støtter fil-opplasting og nedlasting
- **Kamera og mikrofon** - Støtter medieopptak og -opplasting
- **Geolokasjon** - Støtter posisjonsbaserte tjenester
- **Hardware-akselerasjon** - Optimalisert for ytelse
- **Fullskjerm** - Immersive browsing-opplevelse

### 🛠️ Installasjon

1. **Åpne i Android Studio**
   ```bash
   # Åpne prosjektet i Android Studio
   File -> Open -> Velg android-webview mappen
   ```

2. **Konfigurer SDK**
   - Min SDK: 21 (Android 5.0)
   - Target SDK: 34 (Android 14)
   - Compile SDK: 34

3. **Bygg og kjør**
   ```bash
   # Bygg APK
   ./gradlew assembleDebug
   
   # Installer på enhet
   ./gradlew installDebug
   ```

### ⚙️ Konfigurasjon

#### Endre server-URL
Rediger `MainActivity.java` og endre:
```java
webView.loadUrl("http://localhost:5000");
```
til din server-URL.

#### Tillatelser
Appen ber om følgende tillatelser:
- `INTERNET` - For nettverksadgang
- `ACCESS_NETWORK_STATE` - For nettverksstatus
- `WRITE_EXTERNAL_STORAGE` - For filnedlasting
- `READ_EXTERNAL_STORAGE` - For filopplasting
- `CAMERA` - For kamera-funksjonalitet
- `RECORD_AUDIO` - For mikrofon-funksjonalitet

### 🔧 Utvikling

#### Lokal utvikling
1. Start AIChatBrowser serveren:
   ```bash
   npm run dev
   ```

2. Endre URL i MainActivity.java til:
   ```java
   webView.loadUrl("http://10.0.2.2:5000"); // Android emulator
   // eller
   webView.loadUrl("http://[din-ip]:5000"); // Fysisk enhet
   ```

#### Produksjon
1. Bygg AIChatBrowser for produksjon:
   ```bash
   npm run build
   ```

2. Deploy til en server og endre URL i MainActivity.java

### 📦 Bygging

#### Debug APK
```bash
./gradlew assembleDebug
```

#### Release APK
```bash
./gradlew assembleRelease
```

#### AAB (Android App Bundle)
```bash
./gradlew bundleRelease
```

### 🎨 Tilpasning

#### Farger og tema
Rediger `styles.xml` for å endre app-temaet:
```xml
<item name="android:colorPrimary">#1a1a1a</item>
<item name="android:colorAccent">#007AFF</item>
```

#### WebView-innstillinger
Rediger `MainActivity.java` for å tilpasse WebView-oppførsel:
```java
webSettings.setJavaScriptEnabled(true);
webSettings.setDomStorageEnabled(true);
// ... flere innstillinger
```

### 🐛 Feilsøking

#### Vanlige problemer

1. **WebView laster ikke innhold**
   - Sjekk at serveren kjører
   - Sjekk nettverkstilkobling
   - Sjekk at URL er riktig

2. **CORS-feil**
   - Appen har innebygd CORS-bypass
   - Sjekk at serveren tillater cross-origin requests

3. **Filer laster ikke**
   - Sjekk tillatelser
   - Sjekk at filer er tilgjengelige via HTTP

### 📱 Testing

#### Emulator
1. Start Android emulator
2. Bygg og installer appen
3. Test alle funksjoner

#### Fysisk enhet
1. Aktiver USB-debugging
2. Koble til enhet
3. Bygg og installer appen

### 🚀 Distribusjon

#### Google Play Store
1. Bygg release AAB
2. Signer med release-nøkkel
3. Last opp til Play Console

#### Direkte distribusjon
1. Bygg release APK
2. Signer med release-nøkkel
3. Distribuer via sideloading

### 📄 Lisens

MIT License - se hovedprosjektet for detaljer.

### 🤝 Bidrag

Bidrag er velkommen! Se hovedprosjektet for retningslinjer.

### 📞 Support

For spørsmål og støtte, se hovedprosjektet.

