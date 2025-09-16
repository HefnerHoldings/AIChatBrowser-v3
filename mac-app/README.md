# 🖥️ MadEasy Browser - macOS App

## 🚀 Native macOS Application

Dette er en native macOS-applikasjon som kjører MadEasy Browser i en WKWebView med full macOS-integrasjon.

### ✨ Funksjoner

- **Native macOS UI** - Følger Apple's Human Interface Guidelines
- **WKWebView-integrasjon** - Moderne WebKit med full JavaScript-støtte
- **Toolbar med navigasjon** - Tilbake, frem, oppdater og adressefelt
- **Progressindikator** - Viser lastestatus for sider
- **Keyboard shortcuts** - Standard macOS-snarveier
- **Dark Mode støtte** - Automatisk tilpasning til systemutseende
- **Multi-window støtte** - Åpne flere vinduer samtidig
- **Developer Tools** - Integrert web inspector
- **Full-screen modus** - Immersive browsing-opplevelse
- **Retina-støtte** - Optimalisert for høyoppløselige skjermer

### 🛠️ Installasjon og Bygging

#### Forutsetninger
- **macOS 10.15+** (Catalina eller nyere)
- **Xcode 12+** med Command Line Tools
- **Swift 5.3+**
- **MadEasy Browser server** kjørende

#### Xcode-oppsett

1. **Opprett nytt macOS-prosjekt**
   ```
   File → New → Project → macOS → App
   - Product Name: MadEasyBrowser
   - Bundle ID: com.hefnerholdings.madeasy.browser
   - Language: Swift
   - Interface: Storyboard
   - Use Core Data: No
   ```

2. **Legg til filer**
   - Kopier `AppDelegate.swift` til prosjektet
   - Kopier `Info.plist` innhold
   - Konfigurer Main.storyboard
   - Legg til app-ikon i Assets.xcassets

3. **Konfigurer Build Settings**
   ```
   Deployment Target: macOS 10.15
   Supported Architectures: x86_64, arm64
   Code Signing: Development Team
   ```

#### Automatisk bygging

Kjør build-scriptet:
```bash
chmod +x build-mac.sh
./build-mac.sh
```

### ⚙️ Konfigurasjon

#### Server URL
Endre URL i `AppDelegate.swift`:
```swift
private func loadInitialURL() {
    let url = URL(string: "http://your-server:5000")!
    let request = URLRequest(url: url)
    webView.load(request)
}
```

#### App Transport Security
`Info.plist` er konfigurert for å tillate HTTP-trafikk til localhost og 127.0.0.1.

#### Tillatelser
Appen ber om tilgang til:
- **Kamera** - For foto og video i websider
- **Mikrofon** - For lydopptak i websider
- **Posisjon** - For lokasjonsbaserte tjenester
- **Filer** - For nedlastinger og filhåndtering
- **Kontakter** - For deling av innhold

### 🎨 Tilpasning

#### UI-farger og utseende
```swift
// Dark mode støtte
if #available(macOS 10.14, *) {
    NSApp.appearance = NSAppearance(named: .darkAqua)
}

// Toolbar-farger
toolbar.appearance = NSAppearance(named: .vibrantDark)
```

#### Keyboard Shortcuts
Standard macOS-snarveier er implementert:
- **⌘+R** - Reload
- **⌘+←** - Go Back
- **⌘+→** - Go Forward
- **⌘+L** - Focus Address Bar
- **⌘+W** - Close Window
- **⌘+N** - New Window

#### App-ikon
Erstatt `AppIcon` i `Assets.xcassets` med dine egne ikoner:
- 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024

### 🔧 Utvikling

#### Lokal utvikling
1. **Start MadEasy Browser server**
   ```bash
   cd AIChatBrowser
   npm run dev
   ```

2. **Finn IP-adresse** (hvis nødvendig)
   ```bash
   ifconfig | grep "inet "
   ```

3. **Oppdater URL i macOS-app**
   ```swift
   let url = URL(string: "http://192.168.1.100:5000")!
   ```

4. **Bygg og kjør i Xcode**
   ```bash
   ⌘+R i Xcode
   ```

#### Debugging
- Bruk Safari Web Inspector for WebView-debugging
- Console-meldinger vises i Xcode-konsollen
- Bruk breakpoints i Swift-kode
- Developer Tools tilgjengelig via meny

### 📦 Distribusjon

#### Mac App Store

1. **Forbered app for distribusjon**
   ```bash
   # Archive i Xcode
   Product → Archive
   ```

2. **Upload til App Store Connect**
   ```bash
   # Via Xcode Organizer
   Window → Organizer → Distribute App
   ```

3. **App Store metadata**
   - App-beskrivelse og skjermbilder
   - Kategorier og nøkkelord
   - Prising og tilgjengelighet

#### Direct Distribution

1. **Signer med Developer ID**
   ```bash
   codesign --deep --force --verify --verbose --sign "Developer ID Application: Your Name" MadEasyBrowser.app
   ```

2. **Notarize app** (kreves for macOS 10.15+)
   ```bash
   xcrun altool --notarize-app --primary-bundle-id "com.hefnerholdings.madeasy.browser" --username "your@email.com" --password "@keychain:AC_PASSWORD" --file MadEasyBrowser.zip
   ```

3. **Distribuer DMG eller ZIP**
   ```bash
   # Lag DMG
   hdiutil create -volname "MadEasy Browser" -srcfolder MadEasyBrowser.app -ov -format UDZO MadEasyBrowser.dmg
   ```

#### Enterprise Distribution

1. **Signer med Enterprise certificate**
2. **Distribuer via MDM eller direct download**
3. **Konfigurer automatiske oppdateringer**

### 🔐 Sikkerhet

#### Code Signing
```bash
# Sjekk signatur
codesign -dv --verbose=4 MadEasyBrowser.app

# Verifiser notarization
spctl -a -vvv -t install MadEasyBrowser.app
```

#### Sandboxing (for Mac App Store)
```xml
<!-- Entitlements.plist -->
<key>com.apple.security.app-sandbox</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.files.user-selected.read-write</key>
<true/>
```

#### Hardened Runtime
```bash
# Enable hardened runtime
codesign --entitlements Entitlements.plist --options runtime --sign "Developer ID Application: Your Name" MadEasyBrowser.app
```

### 📊 Performance

#### Optimalisering
```swift
// WebView optimalisering
webView.configuration.processPool = WKProcessPool()
webView.configuration.websiteDataStore = WKWebsiteDataStore.default()

// Memory management
webView.configuration.suppressesIncrementalRendering = false
```

#### Monitoring
- Bruk Instruments for performance-analyse
- Monitor memory usage og CPU
- Optimaliser WebView-innstillinger

### 🧪 Testing

#### Unit Testing
```swift
import XCTest
@testable import MadEasyBrowser

class MadEasyBrowserTests: XCTestCase {
    func testWebViewLoading() {
        let expectation = XCTestExpectation(description: "WebView loads")
        // Test implementation
        wait(for: [expectation], timeout: 10.0)
    }
}
```

#### UI Testing
```swift
func testNavigationButtons() {
    let app = XCUIApplication()
    app.launch()
    
    let backButton = app.toolbars.buttons["Back"]
    let forwardButton = app.toolbars.buttons["Forward"]
    
    XCTAssertTrue(backButton.exists)
    XCTAssertTrue(forwardButton.exists)
}
```

### 🔄 Automatiske Oppdateringer

#### Sparkle Framework
```swift
import Sparkle

class AppDelegate: NSObject, NSApplicationDelegate {
    @IBOutlet var updaterController: SPUStandardUpdaterController!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        updaterController.startUpdater()
    }
}
```

### 📄 App Store Requirements

#### Metadata
- **App Name**: MadEasy Browser
- **Description**: AI-powered web browser for macOS
- **Keywords**: browser, AI, productivity, web
- **Category**: Productivity
- **Age Rating**: 4+

#### Screenshots
- 1280x800 (required)
- 1440x900 (recommended)
- 2880x1800 (Retina)

#### Review Guidelines
- Følg macOS Human Interface Guidelines
- Implementer proper error handling
- Respekter brukerens privatliv
- Støtt VoiceOver for tilgjengelighet

### 🆕 Planlagte Funksjoner

1. **Tab-støtte** - Multiple tabs i samme vindu
2. **Bookmarks** - Lagre og organisere favoritter
3. **History** - Browsinghistorikk
4. **Extensions** - Safari Web Extensions støtte
5. **Sync** - Synkroniser med iOS-app
6. **Touch Bar** - MacBook Pro Touch Bar-støtte

### 📞 Support

For spørsmål og støtte:
- Sjekk denne dokumentasjonen
- Se Apple Developer Documentation
- File issues på GitHub
- Kontakt HefnerHoldings support

### 📄 Lisens

MIT License - se hovedprosjektet for detaljer.

Copyright © 2025 HefnerHoldings. All rights reserved.
