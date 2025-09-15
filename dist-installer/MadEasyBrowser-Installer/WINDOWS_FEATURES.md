# MadEasy Browser - Windows Features

## Overview
MadEasy Browser V3.00 is optimized for Windows with deep OS integration and enhanced performance features specifically designed for Windows 10/11.

## Key Windows Features

### 🚀 Performance Optimization
- **GPU Acceleration**: Hardware-accelerated rendering with DirectX integration
- **Memory Management**: Advanced memory optimization with V8 heap tuning
- **Power Management**: Intelligent power saving with battery/AC detection
- **Disk Caching**: Optimized caching on fastest available drives (SSD detection)
- **Network Optimization**: HTTP/2, QUIC, and TCP Fast Open support

### 🔒 Security & Sandboxing
- **Site Isolation**: Process-per-site security model
- **Windows Defender Integration**: Real-time malware scanning
- **Certificate Validation**: Enhanced SSL/TLS verification
- **Download Protection**: Automatic file scanning and quarantine
- **Content Security Policy**: Strict CSP enforcement
- **Mixed Content Blocking**: HTTPS upgrade and mixed content prevention

### 🎯 Windows Integration
- **Jump Lists**: Quick access from taskbar
- **Taskbar Progress**: Download and operation progress indicators
- **Overlay Icons**: Status indicators on taskbar icon
- **Windows Notifications**: Native Windows 10/11 notification center
- **File Associations**: Default browser registration
- **Registry Integration**: Proper Windows registry entries
- **UAC Integration**: Administrator privilege requests

### ⌨️ Keyboard Shortcuts
Complete Windows-standard keyboard shortcuts with full customization support.

#### Navigation
- `Ctrl+L` / `Alt+D` - Focus address bar
- `Alt+Left` / `Alt+Right` - Navigate back/forward
- `F5` / `Ctrl+R` - Refresh page
- `Ctrl+F5` - Hard refresh (ignore cache)
- `Alt+Home` - Go to home page

#### Tab Management
- `Ctrl+T` - New tab
- `Ctrl+Shift+T` - Restore closed tab
- `Ctrl+W` - Close current tab
- `Ctrl+Tab` / `Ctrl+Shift+Tab` - Switch between tabs
- `Ctrl+1-9` - Switch to specific tab

#### Window Management
- `Ctrl+N` - New window
- `Ctrl+Shift+N` - New incognito window
- `F11` - Toggle fullscreen
- `Alt+F4` - Close window

#### Developer Tools
- `F12` / `Ctrl+Shift+I` - Toggle Developer Tools
- `Ctrl+Shift+J` - Open console
- `Ctrl+U` - View page source

### 📢 Enhanced Notifications
- **Progress Notifications**: Real-time download and operation progress
- **Security Alerts**: Malware detection and security warnings
- **Update Notifications**: Automatic update availability alerts
- **AI Assistant**: Smart notifications from AI features
- **Bookmark Reminders**: Intelligent bookmark suggestions
- **Action Buttons**: Interactive notification responses

### 🛡️ Windows Defender Integration
- **Real-time Scanning**: Automatic file and download scanning
- **Threat Detection**: URL and content analysis
- **Quarantine System**: Automatic isolation of suspicious files
- **Exclusion Management**: Smart exclusions for browser performance
- **Security Reports**: Detailed security activity logging

## Installation

### System Requirements
- Windows 10 (version 1903 or later) or Windows 11
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- DirectX 11 compatible graphics card
- .NET Framework 4.8 or later

### Installation Methods

#### 1. Enhanced PowerShell Installer
```powershell
# Run as Administrator for full features
.\windows-installer-enhanced.ps1 -SetAsDefault -CreateShortcuts
```

#### 2. Portable Installation
```powershell
.\windows-installer-enhanced.ps1 -PortableInstall -InstallPath "C:\Portable\MadEasyBrowser"
```

#### 3. Silent Installation
```powershell
.\windows-installer-enhanced.ps1 -Silent -SetAsDefault
```

### Installation Features
- **Administrator Detection**: Automatic privilege checking
- **File Association**: HTTP/HTTPS protocol registration
- **Start Menu Integration**: Proper Start Menu entries
- **Desktop Shortcuts**: Optional desktop shortcut creation
- **Registry Entries**: Proper Windows registry configuration
- **Uninstaller**: Complete removal tool
- **Windows Defender**: Automatic exclusion setup

## Configuration

### Performance Settings
Located in `windows-performance.js`:

```javascript
const performanceSettings = {
    gpuAcceleration: true,        // Hardware acceleration
    hardwareDecoding: true,       // Video hardware decoding
    memoryOptimization: true,     // Memory pressure handling
    diskCaching: true,           // Optimized disk caching
    networkOptimization: true    // Network stack optimization
};
```

### Security Settings
Located in `windows-security.js`:

```javascript
const securitySettings = {
    sandboxEnabled: true,              // Process sandboxing
    webSecurityEnabled: true,          // Web security features
    contextIsolationEnabled: true,     // Context isolation
    contentSecurityPolicy: true,      // CSP enforcement
    downloadProtection: true,         // Download scanning
    safeBrowsing: true                // Safe browsing
};
```

### Notification Settings
Located in `windows-notifications.js`:

```javascript
const notificationSettings = {
    enabled: true,              // Master notification toggle
    soundEnabled: true,         // Notification sounds
    showBadge: true,           // Taskbar badge counts
    urgencyLevels: true,       // Urgency-based styling
    actionButtons: true,       // Interactive buttons
    customSounds: true         // Custom notification sounds
};
```

## Usage

### Starting the Browser

#### Development Mode
```batch
start-windows-enhanced.bat
```

#### Production Mode
```batch
MadEasyBrowser.exe
```

#### With Specific Options
```batch
MadEasyBrowser.exe --new-window --incognito
```

### Command Line Arguments
- `--new-window` - Open new window
- `--incognito` - Start in incognito mode
- `--ai-chat` - Open AI chat directly
- `--startup` - Silent startup mode
- `--performance-mode=[high|balanced|power-saving]`
- `--debug` - Enable debug mode

### Registry Configuration
Browser settings are stored in:
```
HKEY_CURRENT_USER\Software\MadEasy\Browser
```

Key registry values:
- `Version` - Browser version
- `InstallPath` - Installation directory
- `DefaultBrowser` - Default browser status
- `PerformanceMode` - Current performance mode

## Troubleshooting

### Common Issues

#### Performance Issues
1. **Check GPU acceleration**: Ensure graphics drivers are up to date
2. **Memory usage**: Monitor memory usage in Task Manager
3. **Disk space**: Ensure adequate free disk space for cache
4. **Antivirus conflicts**: Add browser to antivirus exclusions

#### Security Issues
1. **Certificate errors**: Check system time and date
2. **Download blocks**: Verify Windows Defender settings
3. **Site access issues**: Check Windows Firewall settings
4. **Permission errors**: Run as administrator if needed

#### Installation Issues
1. **Permission denied**: Run installer as administrator
2. **Registry errors**: Check Windows registry permissions
3. **File association conflicts**: Uninstall conflicting browsers
4. **Startup errors**: Check Event Viewer for error details

### Diagnostic Tools

#### Performance Monitor
Access via: `Right-click taskbar icon → Performance Monitor`
- Real-time CPU/Memory usage
- GPU utilization
- Network activity
- Cache statistics

#### Security Center
Access via: `Settings → Security → Security Center`
- Threat detection history
- Quarantine management
- Security policy status
- Scan results

#### Debug Console
Enable with `--debug` command line flag:
- Detailed logging
- Performance metrics
- Security events
- Network activity

## Development

### Building for Windows

#### Prerequisites
```bash
npm install --global --production windows-build-tools
npm install
```

#### Build Commands
```bash
# Development build
npm run dev

# Production build
npm run build:windows

# Installer package
npm run package:windows

# Distribution package
npm run dist:windows
```

### Windows-Specific Development

#### Adding Windows Features
1. Create feature module in root directory
2. Import in `electron/main.js`
3. Initialize in `ready-to-show` event
4. Add IPC handlers as needed

#### Testing Windows Integration
```bash
# Run Windows-specific tests
npm run test:windows

# Test installer
npm run test:installer

# Test security features
npm run test:security
```

## Support

### System Information
Get system info via: `Help → About → System Information`

Includes:
- Windows version and build
- Hardware specifications
- Browser version and build
- Feature compatibility status

### Log Files
Log files are stored in:
```
%APPDATA%\MadEasy\Browser\logs\
```

Important logs:
- `main.log` - Main process events
- `renderer.log` - Renderer process events
- `security.log` - Security events
- `performance.log` - Performance metrics

### Reporting Issues
When reporting Windows-specific issues, include:
1. Windows version and build number
2. Hardware specifications
3. Log files from the session
4. Steps to reproduce
5. Expected vs actual behavior

### Performance Optimization Tips
1. **Keep Windows updated** - Latest Windows updates improve performance
2. **Update graphics drivers** - Essential for hardware acceleration
3. **Sufficient RAM** - 8GB+ recommended for optimal performance
4. **SSD storage** - Significant performance improvement over HDD
5. **Close unnecessary programs** - Free up system resources
6. **Regular maintenance** - Windows disk cleanup and defragmentation

## License
MadEasy Browser is licensed under MIT License. See LICENSE file for details.

## Contributing
See CONTRIBUTING.md for guidelines on contributing to Windows-specific features.
