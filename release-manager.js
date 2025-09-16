const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 MadEasy Browser - Automated Release Manager\n');
console.log('==============================================\n');

// Release configuration
const releaseConfig = {
    version: '3.0.0',
    platforms: {
        web: { enabled: true, priority: 1 },
        windows: { enabled: true, priority: 2 },
        mac: { enabled: true, priority: 3 },
        linux: { enabled: true, priority: 4 },
        extensions: { enabled: true, priority: 5 },
        tauri: { enabled: true, priority: 6 },
        ios: { enabled: process.platform === 'darwin', priority: 7 },
        android: { enabled: process.env.ANDROID_HOME !== undefined, priority: 8 }
    },
    distributionChannels: {
        github: { enabled: true, createRelease: true },
        npm: { enabled: false, publish: false },
        stores: {
            windows: { enabled: false, submit: false },
            mac: { enabled: false, submit: false },
            ios: { enabled: false, submit: false },
            android: { enabled: false, submit: false },
            chrome: { enabled: false, submit: false },
            firefox: { enabled: false, submit: false }
        }
    }
};

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Version management
class VersionManager {
    static getCurrentVersion() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.version;
    }
    
    static updateVersion(newVersion) {
        // Update package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = newVersion;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        
        // Update Tauri config
        const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
        tauriConfig.package.version = newVersion;
        fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(tauriConfig, null, 2));
        
        // Update Cargo.toml
        const cargoToml = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
        const updatedCargoToml = cargoToml.replace(
            /version = "[^"]*"/,
            `version = "${newVersion}"`
        );
        fs.writeFileSync('src-tauri/Cargo.toml', updatedCargoToml);
        
        // Update extension manifests
        const extensionManifest = JSON.parse(fs.readFileSync('browser-extensions/chrome/manifest.json', 'utf8'));
        extensionManifest.version = newVersion;
        fs.writeFileSync('browser-extensions/chrome/manifest.json', JSON.stringify(extensionManifest, null, 2));
        
        log(`✅ Version updated to ${newVersion}`, 'green');
    }
    
    static bumpVersion(type = 'patch') {
        const currentVersion = this.getCurrentVersion();
        const [major, minor, patch] = currentVersion.split('.').map(Number);
        
        let newVersion;
        switch (type) {
            case 'major':
                newVersion = `${major + 1}.0.0`;
                break;
            case 'minor':
                newVersion = `${major}.${minor + 1}.0`;
                break;
            case 'patch':
            default:
                newVersion = `${major}.${minor}.${patch + 1}`;
                break;
        }
        
        this.updateVersion(newVersion);
        return newVersion;
    }
}

// Build manager
class BuildManager {
    static async buildPlatform(platform) {
        const config = releaseConfig.platforms[platform];
        if (!config || !config.enabled) {
            log(`⏭️  Skipping ${platform} (disabled or not available)`, 'yellow');
            return { success: false, reason: 'disabled' };
        }
        
        log(`🏗️ Building ${platform}...`, 'blue');
        
        try {
            const startTime = Date.now();
            
            switch (platform) {
                case 'web':
                    execSync('npm run build', { stdio: 'inherit' });
                    break;
                case 'windows':
                    execSync('npm run build:windows', { stdio: 'inherit' });
                    break;
                case 'mac':
                    execSync('npm run build:mac', { stdio: 'inherit' });
                    break;
                case 'linux':
                    execSync('npm run build:linux', { stdio: 'inherit' });
                    break;
                case 'ios':
                    execSync('npm run build:ios', { stdio: 'inherit' });
                    break;
                case 'android':
                    execSync('npm run build:android', { stdio: 'inherit' });
                    break;
                case 'tauri':
                    execSync('npm run build:tauri', { stdio: 'inherit' });
                    break;
                case 'extensions':
                    execSync('npm run build:extensions', { stdio: 'inherit' });
                    break;
                default:
                    throw new Error(`Unknown platform: ${platform}`);
            }
            
            const duration = Date.now() - startTime;
            log(`✅ ${platform} built successfully (${duration}ms)`, 'green');
            
            return { success: true, duration };
            
        } catch (error) {
            log(`❌ ${platform} build failed: ${error.message}`, 'red');
            return { success: false, error: error.message };
        }
    }
    
    static async buildAll() {
        log('🚀 Building all platforms...', 'cyan');
        
        // Sort platforms by priority
        const sortedPlatforms = Object.entries(releaseConfig.platforms)
            .filter(([_, config]) => config.enabled)
            .sort(([_, a], [__, b]) => a.priority - b.priority)
            .map(([platform, _]) => platform);
        
        const results = {};
        
        for (const platform of sortedPlatforms) {
            results[platform] = await this.buildPlatform(platform);
        }
        
        return results;
    }
}

// Release packager
class ReleasePackager {
    static createReleasePackages() {
        log('📦 Creating release packages...', 'blue');
        
        const releaseDir = 'release-packages';
        if (fs.existsSync(releaseDir)) {
            fs.rmSync(releaseDir, { recursive: true });
        }
        fs.mkdirSync(releaseDir, { recursive: true });
        
        const packages = [];
        
        // Web package
        if (fs.existsSync('dist')) {
            this.createZipPackage('dist', path.join(releaseDir, 'madeasy-browser-web.zip'));
            packages.push('madeasy-browser-web.zip');
        }
        
        // Desktop packages
        if (fs.existsSync('dist-electron')) {
            const electronFiles = fs.readdirSync('dist-electron');
            electronFiles.forEach(file => {
                const sourcePath = path.join('dist-electron', file);
                const destPath = path.join(releaseDir, file);
                
                if (fs.statSync(sourcePath).isFile()) {
                    fs.copyFileSync(sourcePath, destPath);
                    packages.push(file);
                }
            });
        }
        
        // Extension packages
        if (fs.existsSync('dist-extensions')) {
            const extensionFiles = fs.readdirSync('dist-extensions');
            extensionFiles.forEach(file => {
                const sourcePath = path.join('dist-extensions', file);
                const destPath = path.join(releaseDir, file);
                
                if (fs.statSync(sourcePath).isFile()) {
                    fs.copyFileSync(sourcePath, destPath);
                    packages.push(file);
                } else if (fs.statSync(sourcePath).isDirectory()) {
                    this.createZipPackage(sourcePath, path.join(releaseDir, `${file}.zip`));
                    packages.push(`${file}.zip`);
                }
            });
        }
        
        // Tauri packages
        const tauriDir = 'src-tauri/target/release/bundle';
        if (fs.existsSync(tauriDir)) {
            this.copyTauriPackages(tauriDir, releaseDir);
        }
        
        log(`✅ Created ${packages.length} release packages`, 'green');
        return packages;
    }
    
    static createZipPackage(sourceDir, zipPath) {
        try {
            if (process.platform === 'win32') {
                const psCommand = `Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${zipPath}" -Force`;
                execSync(`powershell -Command "${psCommand}"`, { stdio: 'pipe' });
            } else {
                execSync(`cd "${path.dirname(sourceDir)}" && zip -r "${zipPath}" "${path.basename(sourceDir)}"`, { stdio: 'pipe' });
            }
        } catch (error) {
            log(`⚠️  Failed to create ZIP: ${zipPath}`, 'yellow');
        }
    }
    
    static copyTauriPackages(sourceDir, destDir) {
        const formats = ['msi', 'nsis', 'deb', 'rpm', 'dmg', 'app'];
        
        formats.forEach(format => {
            const formatDir = path.join(sourceDir, format);
            if (fs.existsSync(formatDir)) {
                const files = fs.readdirSync(formatDir);
                files.forEach(file => {
                    const sourcePath = path.join(formatDir, file);
                    const destPath = path.join(destDir, file);
                    
                    if (fs.statSync(sourcePath).isFile()) {
                        fs.copyFileSync(sourcePath, destPath);
                    }
                });
            }
        });
    }
}

// GitHub release manager
class GitHubReleaseManager {
    static async createRelease(version, packages) {
        if (!releaseConfig.distributionChannels.github.enabled) {
            log('⏭️  GitHub release disabled', 'yellow');
            return;
        }
        
        log('🚀 Creating GitHub release...', 'blue');
        
        try {
            // Create git tag
            execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'pipe' });
            execSync(`git push origin v${version}`, { stdio: 'pipe' });
            
            // Generate release notes
            const releaseNotes = this.generateReleaseNotes(version, packages);
            
            log(`✅ GitHub release v${version} created`, 'green');
            log('📝 Release notes generated', 'cyan');
            
            return { success: true, version, notes: releaseNotes };
            
        } catch (error) {
            log(`❌ GitHub release failed: ${error.message}`, 'red');
            return { success: false, error: error.message };
        }
    }
    
    static generateReleaseNotes(version, packages) {
        const notes = `# 🎉 MadEasy Browser v${version}

## 📦 Available Downloads

### 🖥️ Desktop Applications
${packages.filter(p => p.includes('win') || p.includes('mac') || p.includes('linux') || p.includes('tauri')).map(p => `- ${p}`).join('\n')}

### 📱 Mobile Applications
${packages.filter(p => p.includes('android') || p.includes('ios')).map(p => `- ${p}`).join('\n')}

### 🌐 Web & Extensions
${packages.filter(p => p.includes('web') || p.includes('chrome') || p.includes('firefox')).map(p => `- ${p}`).join('\n')}

## 🚀 Installation Instructions

### Windows
1. Download the Windows installer (.exe)
2. Run the installer and follow the setup wizard
3. Launch MadEasy Browser from Start Menu

### macOS
1. Download the macOS package (.dmg)
2. Mount the disk image and drag to Applications
3. Launch from Applications folder

### Linux
1. Download your preferred package format:
   - AppImage: Make executable and run directly
   - .deb: \`sudo dpkg -i package.deb\`
   - .rpm: \`sudo rpm -i package.rpm\`

### Mobile
- **iOS**: Install via TestFlight or App Store
- **Android**: Install APK or download from Play Store

### Browser Extensions
- **Chrome**: Install from Chrome Web Store
- **Firefox**: Install from Firefox Add-ons
- **Edge**: Install from Microsoft Edge Add-ons

## 🆕 What's New in v${version}

- 🌍 Complete cross-platform support
- 🦀 New Tauri-based desktop app
- 🤖 Enhanced AI assistant
- 📱 Native mobile applications
- 🌐 Browser extensions for all major browsers
- 🔧 Improved performance and stability

## 🐛 Bug Fixes & Improvements

- Fixed various platform-specific issues
- Improved build system and CI/CD
- Enhanced documentation
- Better error handling
- Performance optimizations

## 📞 Support

- 📖 [Documentation](https://github.com/hefnerholdings/madeasy-browser)
- 🐛 [Issue Tracker](https://github.com/hefnerholdings/madeasy-browser/issues)
- 💬 [Discussions](https://github.com/hefnerholdings/madeasy-browser/discussions)

---

Built with ❤️ by HefnerHoldings`;

        fs.writeFileSync('RELEASE_NOTES.md', notes);
        return notes;
    }
}

// Main release manager
class ReleaseManager {
    static async createRelease(options = {}) {
        const {
            versionBump = 'patch',
            buildAll = true,
            createPackages = true,
            publishToGitHub = true
        } = options;
        
        try {
            log('🚀 Starting automated release process...', 'cyan');
            console.log('');
            
            // 1. Version management
            let version;
            if (versionBump) {
                version = VersionManager.bumpVersion(versionBump);
                log(`📈 Version bumped to ${version}`, 'green');
            } else {
                version = VersionManager.getCurrentVersion();
                log(`📋 Using current version ${version}`, 'blue');
            }
            
            console.log('');
            
            // 2. Build all platforms
            if (buildAll) {
                const buildResults = await BuildManager.buildAll();
                
                const successful = Object.values(buildResults).filter(r => r.success).length;
                const total = Object.keys(buildResults).length;
                
                log(`📊 Build Summary: ${successful}/${total} platforms built successfully`, 'cyan');
                
                if (successful === 0) {
                    throw new Error('No platforms built successfully');
                }
                
                console.log('');
            }
            
            // 3. Create release packages
            let packages = [];
            if (createPackages) {
                packages = ReleasePackager.createReleasePackages();
                console.log('');
            }
            
            // 4. Create GitHub release
            if (publishToGitHub) {
                await GitHubReleaseManager.createRelease(version, packages);
                console.log('');
            }
            
            // 5. Summary
            log('🎉 Release Process Completed Successfully!', 'green');
            log('=========================================', 'green');
            console.log(`Version: ${version}`);
            console.log(`Packages: ${packages.length}`);
            console.log(`Release Directory: release-packages/`);
            
            console.log('');
            log('🎯 Next Steps:', 'blue');
            log('1. Test the release packages', 'blue');
            log('2. Update documentation if needed', 'blue');
            log('3. Announce the release', 'blue');
            log('4. Monitor for issues', 'blue');
            
            return {
                success: true,
                version,
                packages,
                releaseDir: 'release-packages'
            };
            
        } catch (error) {
            log('❌ Release process failed:', 'red');
            console.error(error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Command line interface
const command = process.argv[2];
const options = {};

// Parse command line arguments
process.argv.slice(3).forEach(arg => {
    if (arg.startsWith('--version-bump=')) {
        options.versionBump = arg.split('=')[1];
    } else if (arg === '--no-build') {
        options.buildAll = false;
    } else if (arg === '--no-packages') {
        options.createPackages = false;
    } else if (arg === '--no-github') {
        options.publishToGitHub = false;
    }
});

switch (command) {
    case 'version':
        const currentVersion = VersionManager.getCurrentVersion();
        console.log(`Current version: ${currentVersion}`);
        break;
        
    case 'bump':
        const bumpType = process.argv[3] || 'patch';
        const newVersion = VersionManager.bumpVersion(bumpType);
        console.log(`Version bumped to: ${newVersion}`);
        break;
        
    case 'build':
        const platform = process.argv[3];
        if (platform && releaseConfig.platforms[platform]) {
            BuildManager.buildPlatform(platform);
        } else {
            BuildManager.buildAll();
        }
        break;
        
    case 'package':
        ReleasePackager.createReleasePackages();
        break;
        
    case 'release':
        ReleaseManager.createRelease(options);
        break;
        
    case '--help':
    case '-h':
    default:
        console.log('MadEasy Browser Release Manager');
        console.log('');
        console.log('Usage: node release-manager.js <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  version              Show current version');
        console.log('  bump [type]          Bump version (patch|minor|major)');
        console.log('  build [platform]     Build specific platform or all');
        console.log('  package              Create release packages');
        console.log('  release              Full release process');
        console.log('');
        console.log('Options:');
        console.log('  --version-bump=TYPE  Version bump type for release');
        console.log('  --no-build           Skip building');
        console.log('  --no-packages        Skip package creation');
        console.log('  --no-github          Skip GitHub release');
        console.log('');
        console.log('Examples:');
        console.log('  node release-manager.js release');
        console.log('  node release-manager.js release --version-bump=minor');
        console.log('  node release-manager.js build windows');
        console.log('  node release-manager.js bump major');
        break;
}

module.exports = { ReleaseManager, VersionManager, BuildManager };

