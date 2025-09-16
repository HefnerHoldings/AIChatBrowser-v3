# 🐧 MadEasy Browser - Linux App

## 🚀 Native Linux Application

MadEasy Browser for Linux bygget med Electron, optimalisert for alle store Linux-distribusjoner.

### ✨ Funksjoner

- **Universal AppImage** - Kjør på alle Linux-distribusjoner
- **Native pakkeformater** - .deb, .rpm, .tar.gz
- **System integration** - Desktop entries, mime types
- **Auto-updater** - Automatiske oppdateringer
- **Dark theme support** - Følger system theme
- **Wayland og X11** - Støtter begge display servere
- **Hardware acceleration** - GPU-akselerert rendering
- **System notifications** - Native Linux notifications

### 📦 Tilgjengelige Pakkeformater

| Format | Distribusjoner | Installasjon |
|--------|---------------|--------------|
| **AppImage** | Alle Linux | `chmod +x *.AppImage && ./MadEasyBrowser*.AppImage` |
| **.deb** | Debian, Ubuntu, Mint | `sudo dpkg -i madeasy-browser*.deb` |
| **.rpm** | Fedora, RHEL, openSUSE | `sudo rpm -i madeasy-browser*.rpm` |
| **.tar.gz** | Alle (manuell) | `tar -xzf madeasy-browser*.tar.gz` |

### 🛠️ Systemkrav

#### Minimum:
- **Linux kernel** 3.10+
- **glibc** 2.17+
- **GTK** 3.0+
- **RAM** 2GB
- **Disk** 500MB

#### Anbefalt:
- **Linux kernel** 5.0+
- **glibc** 2.28+
- **GTK** 3.24+
- **RAM** 4GB+
- **Disk** 1GB+
- **GPU** med OpenGL 2.0+

### 🏗️ Bygging

#### Forutsetninger
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libxss1 libgconf-2-4 libxrandr2 libasound2-dev libpangocairo-1.0-0 libatk1.0-dev libcairo-gobject2 libgtk-3-dev libgdk-pixbuf2.0-dev

# Fedora/RHEL
sudo dnf install nodejs npm gcc-c++ make nss-devel atk-devel at-spi2-atk-devel libdrm-devel libXScrnSaver-devel GConf2-devel libXrandr-devel alsa-lib-devel

# Arch Linux
sudo pacman -S nodejs npm base-devel nss atk at-spi2-atk libdrm libxss gconf libxrandr alsa-lib
```

#### Build-kommandoer
```bash
# Installer dependencies
npm install

# Bygg for Linux
npm run build:linux

# Eller bruk build-script
node build-linux.js

# Bygg alle formater
npm run dist:linux
```

### ⚙️ Konfigurasjon

#### Desktop Integration
Appen installerer automatisk:
- Desktop entry (`.desktop` fil)
- Application icon
- MIME type associations
- URL scheme handlers

#### Konfigurasjonsfiler
```bash
# User config
~/.config/madeasy-browser/

# System config  
/etc/madeasy-browser/

# Cache
~/.cache/madeasy-browser/

# Data
~/.local/share/madeasy-browser/
```

#### Environment Variables
```bash
# Wayland support
export ELECTRON_OZONE_PLATFORM_HINT=wayland

# X11 support (default)
export ELECTRON_OZONE_PLATFORM_HINT=x11

# Hardware acceleration
export ELECTRON_ENABLE_GPU=1

# Debug mode
export ELECTRON_ENABLE_LOGGING=1
```

### 🎨 Themes og Utseende

#### System Theme Integration
```bash
# Følg system dark/light theme
gsettings set org.gnome.desktop.interface gtk-theme 'Adwaita-dark'

# Custom theme directory
~/.local/share/madeasy-browser/themes/
```

#### Icon Themes
Støtter standard Linux icon themes:
- Adwaita
- Papirus  
- Numix
- Breeze

### 🔧 Feilsøking

#### Vanlige problemer

**AppImage kjører ikke:**
```bash
# Sjekk tillatelser
chmod +x MadEasyBrowser*.AppImage

# Sjekk FUSE
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse fuse-libs  # Fedora

# Kjør med --appimage-extract
./MadEasyBrowser*.AppImage --appimage-extract-and-run
```

**GPU acceleration problemer:**
```bash
# Sjekk GPU support
glxinfo | grep "direct rendering"

# Deaktiver GPU acceleration
./MadEasyBrowser --disable-gpu

# Bruk software rendering
./MadEasyBrowser --disable-gpu --disable-software-rasterizer
```

**Wayland problemer:**
```bash
# Tving X11 mode
export ELECTRON_OZONE_PLATFORM_HINT=x11

# Wayland native
export ELECTRON_OZONE_PLATFORM_HINT=wayland
```

**Audio problemer:**
```bash
# Sjekk PulseAudio
pulseaudio --check

# ALSA fallback
export ELECTRON_PULSE_SERVER=unix:/run/user/$(id -u)/pulse/native
```

### 📋 Distribusjon

#### AppImage (Anbefalt)
```bash
# Bygg AppImage
npm run build:linux

# Test AppImage
./dist-electron/MadEasyBrowser*.AppImage

# Distribuer
# Upload til GitHub Releases eller egen server
```

#### Debian/Ubuntu Repository
```bash
# Opprett repository struktur
mkdir -p deb-repo/pool/main/m/madeasy-browser
cp *.deb deb-repo/pool/main/m/madeasy-browser/

# Generer Packages fil
cd deb-repo
dpkg-scanpackages pool/ /dev/null | gzip -9c > dists/stable/main/binary-amd64/Packages.gz
```

#### Fedora/RHEL Repository
```bash
# Opprett RPM repository
mkdir -p rpm-repo
cp *.rpm rpm-repo/
createrepo rpm-repo/
```

#### Flatpak (Fremtidig)
```bash
# Flatpak manifest (planlagt)
# org.hefnerholdings.MadEasyBrowser.yml
```

#### Snap (Fremtidig)
```bash
# Snap package (planlagt)
# snapcraft.yaml
```

### 🔐 Sikkerhet

#### Sandboxing
```bash
# Electron sandboxing aktivert
--enable-sandbox

# Wayland sandboxing
--enable-features=UseOzonePlatform --ozone-platform=wayland
```

#### Permissions
Standard Linux permissions:
- Network access
- File system access (user home)
- Audio/video devices
- Notifications

### 📊 Performance

#### Optimalisering
```bash
# Memory optimization
--memory-pressure-off
--max_old_space_size=4096

# CPU optimization  
--js-flags="--max-old-space-size=4096"

# GPU optimization
--enable-gpu-rasterization
--enable-zero-copy
```

#### Monitoring
```bash
# Resource usage
htop
iotop
nethogs

# Electron debugging
./MadEasyBrowser --enable-logging --log-level=0
```

### 🧪 Testing

#### Distribusjoner testet:
- ✅ Ubuntu 20.04, 22.04, 24.04
- ✅ Debian 11, 12
- ✅ Fedora 38, 39, 40
- ✅ openSUSE Leap 15.5
- ✅ Arch Linux
- ✅ Linux Mint 21
- ⚠️ CentOS 7 (limited support)

#### Desktop Environments:
- ✅ GNOME 40+
- ✅ KDE Plasma 5.24+
- ✅ XFCE 4.16+
- ✅ Cinnamon 5.0+
- ⚠️ i3/sway (basic support)

### 🆕 Planlagte Funksjoner

1. **Flatpak support** - Universal Linux packaging
2. **Snap support** - Ubuntu Store distribution
3. **Native Wayland** - Better Wayland integration
4. **System tray** - Background operation
5. **Global shortcuts** - Keyboard shortcuts
6. **Protocol handlers** - Custom URL schemes

### 📞 Support

#### Community Support
- **GitHub Issues** - Bug reports og feature requests
- **Linux Forums** - Community discussions
- **IRC/Discord** - Real-time chat support

#### Distribution-Specific
- **Ubuntu/Debian** - APT repository support
- **Fedora/RHEL** - DNF repository support
- **Arch Linux** - AUR package (community)
- **openSUSE** - OBS package (community)

### 📄 Lisens

MIT License - se hovedprosjektet for detaljer.

---

**🐧 MadEasy Browser - Native Linux Experience!**
