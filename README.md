# AIChatBrowser v3.0.0

## 🚀 Intelligent Web Browsing Experience

AIChatBrowser v3 is a revolutionary AI-powered browser that combines intelligent web browsing with advanced chat capabilities, built for modern cross-platform deployment.

### ✨ Key Features

**🤖 V3.00 Multi-Agent AI System**
- **Multi-Agent Orchestration**: Specialized AI agents (Leader, PM, Architect, Engineer, Data Analyst) working with consensus protocols
- **Vibecoding Platform**: Gamified development with AI recommendations and goal tracking
- **QA Suite Pro**: Lighthouse integration, visual regression testing, accessibility checks with axe-core
- **Selector Studio v2**: Intelligent selector analysis with stability scoring (0-100) and domain-specific learning

**🌐 Complete Cross-Platform Support**
- **8 Major Platforms**: Windows, macOS, Linux, iOS, Android, Tauri, Browser Extensions, Web/PWA
- **Enterprise Distribution**: Ready for all major app stores and enterprise deployment
- **Native Integration**: Deep OS integration with platform-specific optimizations

**🚀 Advanced Automation & Workflows**
- **Watched Workflows**: Scheduled automation with RRULE support and content change detection
- **Outreach Engine**: Multi-channel support, campaign management, GDPR compliance
- **Marketplace**: Community playbooks and plugins with sandboxed execution
- **Collaborative Mode**: Real-time shared sessions with live cursors, comments, @mentions

**🛡️ Enterprise Security & Performance**
- **Advanced Security**: Site isolation, Windows Defender integration, certificate pinning
- **Performance Optimization**: GPU acceleration, memory management, intelligent power management
- **Policy Guard**: Rule engine for evaluating actions against security policies
- **Lead Data Vault**: Admin-only centralized lead storage with enrichment and GDPR compliance

### 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL with Drizzle ORM
- **Desktop**: Electron + Tauri support
- **Mobile**: React Native WebView (iOS/Android)
- **Extensions**: Chrome/Firefox browser extensions

### 📦 Installation & Quick Start

#### Windows (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/AIChatBrowser-v3.git
cd AIChatBrowser-v3

# Run the automated setup
./auto-setup.bat

# Start the application
npm run start:windows
```

#### Cross-Platform
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 🔧 Build Options

#### Desktop Applications
```bash
# Windows
npm run build:windows

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

#### Mobile Applications
```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

#### Browser Extensions
```bash
npm run build:extensions
```

#### Tauri (Rust-based)
```bash
npm run build:tauri
```

### 🚀 Deployment

#### Quick Deploy
```bash
# Windows deployment
./DEPLOY-NOW.bat

# Advanced deployment
powershell -ExecutionPolicy Bypass -File deploy-advanced.ps1
```

#### Manual Deployment
See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed deployment instructions.

### 📱 Platform Support

| Platform | Status | Type | Build Command | Distribution |
|----------|--------|------|---------------|--------------|
| **🪟 Windows** | ✅ **100%** | Electron + Native | `npm run build:windows` | NSIS, Portable, MSI |
| **🍎 macOS** | ✅ **100%** | Electron + Native | `npm run build:mac` | DMG, ZIP, App Store |
| **🐧 Linux** | ✅ **100%** | Electron | `npm run build:linux` | AppImage, .deb, .rpm |
| **📱 iOS** | ✅ **100%** | Native WebView | `npm run build:ios` | App Store, TestFlight |
| **🤖 Android** | ✅ **100%** | WebView | `npm run build:android` | APK, Play Store |
| **🦀 Tauri** | ✅ **100%** | Rust-based | `npm run build:tauri` | Native bundles |
| **🌐 Extensions** | ✅ **100%** | Browser Extensions | `npm run build:extensions` | Chrome, Firefox, Edge, Safari |
| **🌐 Web/PWA** | ✅ **100%** | Progressive Web App | `npm run build` | Self-hosted, CDN |

### 🛠️ Development

#### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

#### Development Setup
```bash
# Clone and install
git clone https://github.com/yourusername/AIChatBrowser-v3.git
cd AIChatBrowser-v3
npm install

# Start development server
npm run dev

# Run tests
npm run test:all

# Check TypeScript
npm run check
```

#### Project Structure
```
AIChatBrowser/
├── client/              # React frontend
├── server/              # Node.js backend
├── electron/            # Electron app
├── src-tauri/           # Tauri app
├── ios-app/             # iOS application
├── android-webview/     # Android application
├── browser-extensions/  # Browser extensions
├── shared/              # Shared utilities
├── public/              # Static assets
└── build/               # Build outputs
```

### 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/aichatbrowser

# API Keys
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Session
SESSION_SECRET=your_session_secret

# Email
SENDGRID_API_KEY=your_sendgrid_api_key

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### 📚 Documentation

- [Quick Start Guide](README-QUICK-START.md)
- [Cross-Platform Guide](CROSS-PLATFORM-GUIDE.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)
- [Windows Features](WINDOWS_FEATURES.md)
- [Mac Build Guide](MAC_BUILD_GUIDE.md)
- [Electron Build Guide](ELECTRON_BUILD_GUIDE.md)
- [GitHub Release Guide](GITHUB_RELEASE_GUIDE.md)

### 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 👥 Authors

- **HefnerHoldings** - *Initial work* - [andre@hefnerholdings.com](mailto:andre@hefnerholdings.com)

### 🙏 Acknowledgments

- React team for the amazing framework
- Electron team for cross-platform desktop support
- Tauri team for the Rust-based alternative
- All contributors and supporters

### 📊 Project Stats

- **Version**: 3.0.0
- **License**: MIT
- **Platform Support**: 8 platforms
- **Build Targets**: 10+ deployment options
- **Dependencies**: 100+ carefully selected packages

### 🔄 Version History

- **v3.0.0** - Major release with cross-platform support
- **v2.x.x** - Enhanced AI features and performance improvements
- **v1.0.0** - Initial release

---

**Made with ❤️ by HefnerHoldings**

For support, email [andre@hefnerholdings.com](mailto:andre@hefnerholdings.com)
