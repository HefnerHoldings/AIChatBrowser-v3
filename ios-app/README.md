# 📱 AIChatBrowser iOS App

## 🚀 iOS WebView App for AIChatBrowser

Dette er en iOS WebView-app som kjører AIChatBrowser i en mobil-optimalisert WKWebView.

### ✨ Funksjoner

- **WKWebView-integrasjon** - Moderne iOS WebView med full JavaScript-støtte
- **Navigasjonskontroller** - Tilbake, frem og oppdater-knapper
- **Progressindikator** - Viser lastestatus for sider
- **Adressefelt** - Skriv inn URL-er direkte
- **Gesturestøtte** - Sveip for å navigere tilbake/frem
- **Kamera og mikrofon** - Støtter medieopptak
- **Geolokasjon** - Posisjonsstøtte
- **Full-screen modus** - Immersive browsing-opplevelse

### 🛠️ Installasjon og Bygging

#### Forutsetninger
- **macOS** med Xcode 14+
- **iOS 13.0+** som mål
- **Swift 5.5+**
- **AIChatBrowser server** kjørende

#### Xcode-oppsett

1. **Opprett nytt iOS-prosjekt**
   ```
   File → New → Project → iOS → App
   - Product Name: AIChatBrowser
   - Bundle ID: com.madeasy.aichatbrowser
   - Language: Swift
   - Interface: Storyboard
   ```

2. **Legg til filer**
   - Kopier `ViewController.swift` til prosjektet
   - Kopier `Info.plist` innhold
   - Konfigurer Main.storyboard

3. **Konfigurer Storyboard**
   - Legg til WebView til View Controller
   - Legg til Navigation Controller
   - Legg til Toolbar med knapper
   - Koble IBOutlets og IBActions

#### Build Settings

```
Deployment Target: iOS 13.0
Supported Devices: iPhone, iPad
Orientations: Portrait, Landscape
```

### ⚙️ Konfigurasjon

#### Server URL
Endre URL i `ViewController.swift`:
```swift
private func loadInitialURL() {
    let url = URL(string: "http://your-server:5000")!
    let request = URLRequest(url: url)
    webView.load(request)
}
```

#### App Transport Security
`Info.plist` er konfigurert for å tillate HTTP-trafikk til localhost:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

#### Tillatelser
Appen ber om tilgang til:
- **Kamera** - For foto og video
- **Mikrofon** - For lydopptak
- **Posisjon** - For lokasjonsbaserte tjenester
- **Fotorulle** - For bilder og media

### 🔧 Utvikling

#### Lokal utvikling
1. **Start AIChatBrowser server**
   ```bash
   cd AIChatBrowser
   npm run dev
   ```

2. **Finn IP-adresse**
   ```bash
   ifconfig | grep "inet "
   ```

3. **Oppdater URL i iOS-app**
   ```swift
   let url = URL(string: "http://192.168.1.100:5000")!
   ```

4. **Bygg og kjør i simulator/enhet**

#### Debugging
- Bruk Safari Web Inspector for WebView-debugging
- Console-meldinger vises i Xcode-konsollen
- Bruk breakpoints i Swift-kode

### 📦 Distribusjon

#### TestFlight (Beta Testing)
1. **Archive app i Xcode**
   ```
   Product → Archive
   ```

2. **Upload til App Store Connect**
   ```
   Window → Organizer → Upload to App Store
   ```

3. **Konfigurer TestFlight**
   - Legg til beta-testere
   - Send invitasjoner

#### App Store Release
1. **Fullfør app metadata**
   - App-beskrivelse
   - Skjermbilder
   - App-ikon
   - Kategorier

2. **Submit for review**
   - Følg App Store Review Guidelines
   - Vent på godkjenning

#### Enterprise Distribution
1. **Signer med Enterprise certificate**
2. **Distribuer IPA-fil internt**
3. **Installer via MDM eller direct download**

### 🎨 Tilpasning

#### UI-farger
Endre farger i `ViewController.swift`:
```swift
navigationController?.navigationBar.barTintColor = UIColor.systemBlue
toolbar.barTintColor = UIColor.systemBlue
```

#### WebView-innstillinger
Tilpass WebView-oppførsel:
```swift
configuration.allowsInlineMediaPlayback = true
configuration.mediaTypesRequiringUserActionForPlayback = []
webView.allowsBackForwardNavigationGestures = true
```

#### App-ikon og Launch Screen
- Erstatt `AppIcon` i Assets.xcassets
- Tilpass `LaunchScreen.storyboard`

### 🐛 Feilsøking

#### Vanlige problemer

1. **WebView laster ikke innhold**
   - Sjekk nettverkstilkobling
   - Verifiser server URL
   - Kontroller ATS-innstillinger

2. **CORS-feil**
   - Konfigurer server for CORS
   - Bruk HTTPS i produksjon
   - Sjekk Content Security Policy

3. **App crashes**
   - Sjekk Xcode-konsoll
   - Verifiser IBOutlet-koblinger
   - Test på forskjellige enheter

4. **Ytelse problemer**
   - Optimaliser WebView-innstillinger
   - Reduser JavaScript-kompleksitet
   - Bruk lazy loading

### 📊 Performance Tips

#### Optimalisering
1. **WKWebView optimalisering**
   ```swift
   webView.scrollView.decelerationRate = UIScrollView.DecelerationRate.normal
   webView.scrollView.delaysContentTouches = false
   ```

2. **Memory management**
   ```swift
   webView.configuration.processPool = WKProcessPool()
   webView.configuration.websiteDataStore = WKWebsiteDataStore.nonPersistent()
   ```

3. **Preloading**
   - Preload kritiske ressurser
   - Bruk cache-strategier
   - Optimiser bilder og assets

### 🔐 Sikkerhet

#### Best Practices
1. **URL-validering**
   ```swift
   guard url.scheme == "https" || url.host == "localhost" else {
       return // Reject unsafe URLs
   }
   ```

2. **Content Security Policy**
   - Konfigurer CSP-headers på server
   - Begrenste script sources
   - Valider all input

3. **Certificate pinning** (produksjon)
   ```swift
   // Implementer certificate pinning for produksjons-API-er
   ```

### 📱 Testing

#### Simulator Testing
```bash
# Kjør på iPhone simulator
cmd+R i Xcode

# Test på iPad simulator
# Velg iPad simulator i Xcode
```

#### Device Testing
1. **Koble iOS-enhet til Mac**
2. **Tillat Developer Mode**
3. **Bygg og installer via Xcode**
4. **Test alle funksjoner**

#### Automated Testing
```swift
// UI Tests
func testWebViewLoading() {
    let app = XCUIApplication()
    app.launch()
    
    let webView = app.webViews.firstMatch
    XCTAssertTrue(webView.waitForExistence(timeout: 10))
}
```

### 📄 App Store Requirements

#### Metadata
- **App Name**: AIChatBrowser
- **Description**: AI-powered web browser for iOS
- **Keywords**: browser, AI, chat, web
- **Category**: Productivity
- **Age Rating**: 4+

#### Screenshots
- iPhone 6.7" (required)
- iPhone 6.5" (required)
- iPhone 5.5" (optional)
- iPad Pro 12.9" (if supporting iPad)

#### Review Guidelines
- Følg Apple's Human Interface Guidelines
- Sikre at app-en fungerer uten ekstern innhold
- Implementer proper error handling
- Respekter brukerens privatliv

### 🆕 Future Enhancements

#### Planlagte funksjoner
1. **Offline mode** - Cached content for offline viewing
2. **Dark mode** - System appearance support
3. **Haptic feedback** - Enhanced user interaction
4. **Spotlight search** - Index content for search
5. **Shortcuts** - Siri Shortcuts integration
6. **Widget** - Home screen widget

### 📞 Support

For spørsmål og støtte:
- Sjekk denne dokumentasjonen
- Se Apple Developer Documentation
- File issues på GitHub
- Kontakt utviklingsteamet

### 📄 Lisens

MIT License - se hovedprosjektet for detaljer.
