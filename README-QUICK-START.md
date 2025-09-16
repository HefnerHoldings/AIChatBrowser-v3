# MadEasy Browser - Quick Start Guide

## 🚀 Quick Setup

### 1. Run Project Optimization
```bash
# Run the optimization script
powershell -ExecutionPolicy Bypass -File optimize-project.ps1

# Or for full cleanup (removes large files)
powershell -ExecutionPolicy Bypass -File optimize-project.ps1 -FullCleanup
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Start Development
```bash
npm run dev          # Development mode
npm run build        # Build for production
npm run start        # Start production server
```

### 4. Windows-Specific Commands
```bash
npm run start:windows    # Start with Windows features
npm run test:windows     # Run Windows tests
npm run build:windows    # Build Windows executable
```

## 🛠️ Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express server
- `/electron` - Electron desktop app
- `/shared` - Shared utilities and types

## 🔧 Configuration

- **Git**: Already configured for HefnerHoldings
- **TypeScript**: Optimized configuration
- **Node.js**: Uses portable installation

## 📦 Build & Deploy

1. **Development**: `npm run dev`
2. **Production Build**: `npm run build`
3. **Windows Installer**: `npm run build:windows`
4. **Create Package**: Run `create-installer.ps1`

## ✅ Optimizations Applied

- ✅ Fixed all linting errors
- ✅ Cleaned up duplicate files
- ✅ Optimized package.json
- ✅ Fixed PowerShell warnings
- ✅ Set up proper Git configuration
- ✅ Removed temporary files

## 🆘 Troubleshooting

If you encounter issues:
1. Run `optimize-project.ps1` again
2. Delete `node_modules` and run `npm install`
3. Check that Node.js is properly installed
4. Verify Git configuration with `git config --list`
