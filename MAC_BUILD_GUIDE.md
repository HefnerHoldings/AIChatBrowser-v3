# 🍎 MadEasy Browser - macOS Build Guide

## 📋 Overview

This guide explains how to build and distribute the MadEasy Browser for macOS, including Intel and Apple Silicon Macs.

## 🚀 Quick Start

### Prerequisites

1. **macOS Development Environment**
   - macOS 10.15 (Catalina) or later
   - Xcode Command Line Tools
   - Node.js 18+ (already installed)

2. **Apple Developer Account** (for code signing)
   - Required for App Store distribution
   - Optional for local builds

### Building for macOS

#### Method 1: Automated Build Script
```bash
# Run the automated build script
node build-mac.js
```

#### Method 2: Manual Build
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Build macOS app
npx electron-builder --mac --publish=never
```

## 🎯 Build Targets

### Universal Binary (Recommended)
Builds for both Intel and Apple Silicon:
```bash
npx electron-builder --mac --x64 --arm64
```

### Intel Only
```bash
npx electron-builder --mac --x64
```

### Apple Silicon Only
```bash
npx electron-builder --mac --arm64
```

## 📦 Output Formats

### DMG (Disk Image)
- **File**: `MadEasy Browser-3.0.0.dmg`
- **Purpose**: User-friendly installer
- **Features**: Drag-and-drop installation

### ZIP Archive
- **File**: `MadEasy Browser-3.0.0-mac.zip`
- **Purpose**: Direct distribution
- **Features**: Extract and run

## 🔐 Code Signing

### Setup Code Signing

1. **Get Apple Developer Certificate**
   ```bash
   # Install Xcode Command Line Tools
   xcode-select --install
   
   # Create certificate in Keychain Access
   # Or use Xcode to manage certificates
   ```

2. **Set Environment Variables**
   ```bash
   export APPLE_ID="your@email.com"
   export APPLE_ID_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   ```

3. **Update electron-builder.json**
   ```json
   {
     "mac": {
       "notarize": {
         "teamId": "YOUR_TEAM_ID"
       }
     }
   }
   ```

### Signing Commands

```bash
# Build with code signing
npx electron-builder --mac --publish=never

# Build and notarize
npx electron-builder --mac --publish=always
```

## 🏪 App Store Distribution

### Mac App Store Build
```bash
npx electron-builder --mac --config.mac.target=mas
```

### Requirements
- Apple Developer Program membership
- App Store Connect access
- Proper entitlements configuration

## 🎨 Customization

### App Icon
Replace `attached_assets/icon.icns` with your custom icon:
- **Size**: 512x512 pixels minimum
- **Format**: ICNS file
- **Tools**: Use `iconutil` or online converters

### App Metadata
Edit `package.json`:
```json
{
  "name": "madeasy-browser",
  "productName": "MadEasy Browser",
  "version": "3.0.0",
  "description": "AI-Powered Autonomous Web Browser",
  "author": "MadEasy Team",
  "license": "MIT"
}
```

### Window Configuration
Edit `electron/main.js`:
```javascript
const mainWindow = new BrowserWindow({
  width: 1400,
  height: 900,
  minWidth: 800,
  minHeight: 600,
  titleBarStyle: 'hiddenInset', // macOS specific
  // ... other options
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Build Fails with Permission Errors**
   ```bash
   # Fix permissions
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) node_modules
   ```

2. **Code Signing Fails**
   ```bash
   # Check certificate
   security find-identity -v -p codesigning
   
   # Reset keychain
   security delete-identity -c "Developer ID Application: Your Name"
   ```

3. **Notarization Fails**
   ```bash
   # Check notarization status
   xcrun altool --notarization-info <request-id> -u <apple-id> -p <password>
   ```

4. **App Won't Launch**
   ```bash
   # Check console logs
   log show --predicate 'process == "MadEasy Browser"' --last 1h
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=electron-builder npx electron-builder --mac
```

## 📊 Performance Optimization

### Bundle Size Reduction
1. **Exclude unnecessary files**
   ```json
   {
     "files": [
       "dist/**/*",
       "electron/**/*",
       "package.json",
       "!node_modules/**/*",
       "!src/**/*",
       "!*.md"
     ]
   }
   ```

2. **Enable compression**
   ```json
   {
     "mac": {
       "compression": "maximum"
     }
   }
   ```

### Runtime Performance
1. **Enable hardware acceleration**
2. **Optimize images and assets**
3. **Use production builds**
4. **Enable V8 snapshots**

## 🚀 Distribution

### Direct Distribution
1. **Build the app**
   ```bash
   node build-mac.js
   ```

2. **Test locally**
   ```bash
   open "dist-electron/MadEasy Browser-3.0.0.dmg"
   ```

3. **Distribute**
   - Upload DMG to your website
   - Share ZIP for direct download
   - Use cloud storage services

### App Store Distribution
1. **Prepare for App Store**
   ```bash
   npx electron-builder --mac --config.mac.target=mas
   ```

2. **Upload to App Store Connect**
   - Use Xcode or Transporter
   - Submit for review
   - Wait for approval

## 📱 Testing

### Local Testing
```bash
# Run in development mode
npm run dev

# Test Electron app
npm run electron:dev
```

### Production Testing
```bash
# Build and test
node build-mac.js

# Test installed app
open "/Applications/MadEasy Browser.app"
```

## 🔄 Updates

### Auto-Updates
The app is configured for auto-updates via GitHub releases:

1. **Create GitHub Release**
2. **Upload built artifacts**
3. **App checks for updates automatically**

### Manual Updates
Users can download new versions from:
- Your website
- GitHub releases
- App Store (if published)

## 📄 Legal

### Privacy Policy
Ensure you have a privacy policy covering:
- Data collection and usage
- Third-party services
- User rights and choices

### Terms of Service
Include terms covering:
- App usage rights
- Prohibited activities
- Liability limitations

## 🎉 Success!

Your macOS build system is now configured and ready to create desktop applications for Intel and Apple Silicon Macs. The MadEasy Browser can be distributed as a standalone macOS application with all the power of a native browser combined with AI capabilities.

## 📞 Support

For issues and questions:
- Check this guide first
- Review Electron documentation
- File issues on GitHub
- Contact the development team

