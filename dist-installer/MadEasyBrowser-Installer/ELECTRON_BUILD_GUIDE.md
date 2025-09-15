# MadEasy Browser V3 - Electron Build Guide

## 📋 Overview

This guide explains how to build and distribute the MadEasy Browser as a desktop application for Windows, Mac, and Linux using Electron.

## 🚀 Quick Start

### Development Mode

```bash
# Run Electron in development mode (starts server automatically)
NODE_ENV=development node run-electron.js

# Or if server is already running
node run-electron.js
```

## 📦 Building for Production

### Prerequisites

1. Ensure all dependencies are installed:
```bash
npm install
```

2. Build the web application first:
```bash
npm run build
```

### Build Commands

Since we cannot directly edit package.json, use these commands manually:

```bash
# Build for all platforms
npx electron-builder

# Build without publishing
npx electron-builder --publish=never

# Platform-specific builds
npx electron-builder --win    # Windows only
npx electron-builder --mac    # macOS only
npx electron-builder --linux  # Linux only

# Build specific architectures
npx electron-builder --win --x64     # Windows 64-bit
npx electron-builder --win --ia32    # Windows 32-bit
npx electron-builder --mac --arm64   # Apple Silicon
npx electron-builder --linux --x64   # Linux 64-bit
```

## 📁 Project Structure

```
.
├── electron/
│   ├── main.js           # Main Electron process
│   ├── preload.js        # Preload script for security
│   ├── tab-manager.js    # Tab management system
│   └── auto-updater.js   # Auto-update handler
├── build/
│   ├── icons/            # Platform-specific icons
│   │   ├── icon.ico      # Windows icon
│   │   ├── icon.icns     # macOS icon
│   │   └── icon.png      # Linux icon
│   ├── entitlements.mac.plist  # macOS entitlements
│   ├── afterPack.js      # Post-pack hook
│   └── afterSign.js      # Post-sign hook (for notarization)
├── electron-builder.yml   # Build configuration
├── run-electron.js       # Development runner script
└── dist-electron/        # Build output directory
```

## 🎨 Icon Requirements

Replace the placeholder icons in `build/icons/` with your actual icons:

- **Windows (icon.ico)**: Multi-resolution ICO file (16x16, 32x32, 48x48, 256x256)
- **macOS (icon.icns)**: ICNS file with all required sizes
- **Linux (icon.png)**: 512x512 PNG file

### Creating Icons

```bash
# Install icon generator (optional)
npm install -g electron-icon-builder

# Generate icons from a 1024x1024 PNG
electron-icon-builder --input=icon.png --output=build/icons
```

## ⚙️ Configuration Details

### electron-builder.yml

The configuration file includes:

- **App Identity**: `ai.madeasy.browser`
- **Product Name**: MadEasy Browser V3
- **Output Directory**: `dist-electron/`
- **Compression**: Maximum compression for smaller downloads
- **Auto-Update**: GitHub releases integration

### Platform Configurations

#### Windows
- NSIS installer with custom options
- Portable version available
- Start menu and desktop shortcuts
- Auto-update support

#### macOS
- DMG with custom background (optional)
- ZIP archive for direct distribution
- Hardened runtime for notarization
- Universal binary support (Intel + Apple Silicon)

#### Linux
- AppImage for universal compatibility
- DEB packages for Debian/Ubuntu
- RPM packages for Fedora/RHEL
- Snap packages for Snap Store

## 🔐 Code Signing

### Windows Code Signing

1. Obtain a code signing certificate
2. Set environment variables:
```bash
export CSC_LINK=path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
```

### macOS Code Signing

1. Install Apple Developer certificates
2. Set environment variables:
```bash
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=your_team_id
```

3. The build process will automatically sign and notarize

### Linux Code Signing

Linux packages can be signed with GPG:
```bash
export GPG_KEY_ID=your_key_id
```

## 🔄 Auto-Updates

The application is configured for auto-updates via GitHub releases:

1. Create a GitHub release
2. Upload the built artifacts
3. The app will check for updates automatically

### Testing Updates

```bash
# Build with update server URL
PUBLISH_PROVIDER=github \
GITHUB_TOKEN=your_token \
npx electron-builder --publish always
```

## 🐛 Debugging

### Development Debugging

```bash
# Enable DevTools in production
ELECTRON_ENABLE_LOGGING=1 npm run electron

# Debug main process
ELECTRON_INSPECT=5858 npm run electron
```

### Build Issues

```bash
# Clean build cache
rm -rf dist-electron/ node_modules/.cache

# Verbose build output
DEBUG=electron-builder npx electron-builder

# Test packaging without building
npx electron-builder --dir
```

## 📊 Build Optimization

### Reducing App Size

1. Use `asar` archives (enabled by default)
2. Exclude unnecessary files in electron-builder.yml
3. Use production builds of dependencies
4. Enable compression

### Performance Tips

1. Lazy load heavy modules
2. Use V8 snapshots for faster startup
3. Optimize images and assets
4. Enable hardware acceleration

## 🚢 Distribution

### Direct Distribution

Built artifacts are in `dist-electron/`:
- Windows: `.exe` installer and `.zip` portable
- macOS: `.dmg` installer and `.zip` archive
- Linux: `.AppImage`, `.deb`, `.rpm` packages

### Store Distribution

#### Microsoft Store
```bash
npx electron-builder --win --config.win.target=appx
```

#### Mac App Store
```bash
npx electron-builder --mac --config.mac.target=mas
```

#### Snap Store
```bash
npx electron-builder --linux --config.linux.target=snap
snapcraft upload dist-electron/*.snap
```

## 📝 Manual Script Addition to package.json

When you have access to edit package.json, add these scripts:

```json
{
  "scripts": {
    "electron": "electron electron/main.js",
    "electron:dev": "NODE_ENV=development node run-electron.js",
    "electron:build": "npm run build && electron-builder",
    "electron:dist": "npm run build && electron-builder --publish=never",
    "electron:win": "npm run build && electron-builder --win",
    "electron:mac": "npm run build && electron-builder --mac",
    "electron:linux": "npm run build && electron-builder --linux",
    "electron:publish": "npm run build && electron-builder --publish=always"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are in `dependencies`, not `devDependencies`
2. **White screen on launch**: Check if the server is running (development) or files are built (production)
3. **Icons not showing**: Verify icon files exist and are in correct format
4. **Code signing fails**: Check certificates and environment variables
5. **Build fails on CI**: Ensure all required tools are installed (Wine for Windows builds on Linux/Mac)

### Getting Help

- Check Electron documentation: https://www.electronjs.org/docs
- Electron Builder docs: https://www.electron.build/
- File issues at: https://github.com/madeasy-ai/madeasy-browser

## ✅ Checklist for Production Release

- [ ] Replace placeholder icons with actual icons
- [ ] Update version in package.json
- [ ] Build and test on all target platforms
- [ ] Set up code signing certificates
- [ ] Configure auto-update server
- [ ] Test auto-updates
- [ ] Create GitHub release
- [ ] Upload built artifacts
- [ ] Update documentation
- [ ] Announce release

## 🎉 Success!

Your Electron build system is now configured and ready to create desktop applications for Windows, Mac, and Linux. The MadEasy Browser can be distributed as a standalone desktop application with all the power of a native browser combined with AI capabilities.