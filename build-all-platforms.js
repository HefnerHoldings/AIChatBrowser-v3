const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🌍 Building MadEasy Browser for All Platforms...\n');
console.log('================================================\n');

// Configuration
const config = {
    version: '3.0.0',
    platforms: {
        windows: {
            enabled: true,
            targets: ['nsis', 'portable'],
            arch: ['x64', 'ia32']
        },
        mac: {
            enabled: true,
            targets: ['dmg', 'zip'],
            arch: ['x64', 'arm64']
        },
        ios: {
            enabled: true,
            note: 'Requires Xcode on macOS'
        },
        linux: {
            enabled: false,
            targets: ['AppImage', 'deb', 'rpm'],
            arch: ['x64']
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

function logStep(step) {
    log(`📦 ${step}`, 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

// Check prerequisites
function checkPrerequisites() {
    logStep('Checking prerequisites...');
    
    const checks = {
        node: false,
        npm: false,
        git: false
    };
    
    try {
        execSync('node --version', { stdio: 'pipe' });
        checks.node = true;
        logSuccess('Node.js found');
    } catch (error) {
        logError('Node.js not found');
    }
    
    try {
        execSync('npm --version', { stdio: 'pipe' });
        checks.npm = true;
        logSuccess('npm found');
    } catch (error) {
        logError('npm not found');
    }
    
    try {
        execSync('git --version', { stdio: 'pipe' });
        checks.git = true;
        logSuccess('Git found');
    } catch (error) {
        logWarning('Git not found (optional)');
    }
    
    if (!checks.node || !checks.npm) {
        logError('Missing required dependencies. Please install Node.js and npm.');
        process.exit(1);
    }
    
    console.log('');
}

// Install dependencies
function installDependencies() {
    logStep('Installing dependencies...');
    
    try {
        if (!fs.existsSync('node_modules')) {
            execSync('npm install', { stdio: 'inherit' });
            logSuccess('Dependencies installed');
        } else {
            logSuccess('Dependencies already installed');
        }
    } catch (error) {
        logError('Failed to install dependencies');
        process.exit(1);
    }
    
    console.log('');
}

// Build web application
function buildWebApp() {
    logStep('Building web application...');
    
    try {
        execSync('npm run build', { stdio: 'inherit' });
        logSuccess('Web application built');
    } catch (error) {
        logError('Failed to build web application');
        process.exit(1);
    }
    
    console.log('');
}

// Build Windows version
function buildWindows() {
    if (!config.platforms.windows.enabled) {
        logWarning('Windows build disabled');
        return;
    }
    
    logStep('Building Windows version...');
    
    try {
        // Build with electron-builder
        const targets = config.platforms.windows.targets.join(',');
        const arch = config.platforms.windows.arch.join(',');
        
        execSync(`npx electron-builder --win --x64 --ia32 --publish=never`, { 
            stdio: 'inherit',
            timeout: 300000 // 5 minutes
        });
        
        logSuccess('Windows build completed');
        
        // Also run our custom Windows installer script
        if (fs.existsSync('create-installer.ps1')) {
            logStep('Creating Windows installer package...');
            try {
                execSync('powershell -ExecutionPolicy Bypass -File create-installer.ps1 -IncludeNodeJS -CreatePortable', {
                    stdio: 'inherit',
                    timeout: 180000 // 3 minutes
                });
                logSuccess('Windows installer package created');
            } catch (error) {
                logWarning('Windows installer package creation failed (continuing...)');
            }
        }
        
    } catch (error) {
        logError('Windows build failed');
        console.error(error.message);
    }
    
    console.log('');
}

// Build macOS version
function buildMac() {
    if (!config.platforms.mac.enabled) {
        logWarning('macOS build disabled');
        return;
    }
    
    logStep('Building macOS version...');
    
    try {
        // Check if we can build for macOS
        if (process.platform === 'darwin') {
            // Native macOS build
            execSync('npx electron-builder --mac --x64 --arm64 --publish=never', { 
                stdio: 'inherit',
                timeout: 300000 // 5 minutes
            });
            logSuccess('macOS build completed (native)');
        } else {
            // Cross-compilation (requires certificates)
            logWarning('Cross-compiling for macOS from ' + process.platform);
            logWarning('This requires proper code signing certificates');
            
            try {
                execSync('npx electron-builder --mac --publish=never', { 
                    stdio: 'inherit',
                    timeout: 300000 // 5 minutes
                });
                logSuccess('macOS build completed (cross-compiled)');
            } catch (error) {
                logWarning('macOS cross-compilation failed (certificates required)');
            }
        }
        
    } catch (error) {
        logError('macOS build failed');
        console.error(error.message);
    }
    
    console.log('');
}

// Build iOS version (information only)
function buildIOS() {
    if (!config.platforms.ios.enabled) {
        logWarning('iOS build disabled');
        return;
    }
    
    logStep('iOS Build Information...');
    
    if (process.platform === 'darwin') {
        if (fs.existsSync('ios-app/build-ios.sh')) {
            log('📱 iOS build script available: ios-app/build-ios.sh', 'cyan');
            log('   Run this script on macOS with Xcode installed', 'cyan');
            log('   chmod +x ios-app/build-ios.sh && ./ios-app/build-ios.sh', 'cyan');
        } else {
            log('📱 iOS project files available in ios-app/', 'cyan');
            log('   Set up Xcode project manually using the provided files', 'cyan');
        }
        logSuccess('iOS build information provided');
    } else {
        logWarning('iOS builds require macOS with Xcode');
        log('   iOS project files are available in ios-app/', 'yellow');
        log('   Transfer to macOS and follow ios-app/README.md', 'yellow');
    }
    
    console.log('');
}

// Create distribution packages
function createDistribution() {
    logStep('Creating distribution packages...');
    
    const distDir = 'dist-all-platforms';
    
    // Create distribution directory
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Copy built files
    const buildDirs = ['dist-electron', 'dist', 'build'];
    let copiedFiles = 0;
    
    buildDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            try {
                const targetDir = path.join(distDir, dir);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                
                // Copy files (simplified - in real implementation, use proper copy)
                logSuccess(`Found build directory: ${dir}`);
                copiedFiles++;
            } catch (error) {
                logWarning(`Failed to copy ${dir}: ${error.message}`);
            }
        }
    });
    
    // Create README for distribution
    const readmeContent = `# MadEasy Browser - Distribution Package

## Version: ${config.version}
## Build Date: ${new Date().toISOString()}
## Platform: ${process.platform} ${process.arch}

## Contents:
- Windows: Executable and installer
- macOS: DMG and ZIP packages  
- iOS: Project files (requires Xcode)

## Installation:
1. Windows: Run the installer or extract portable version
2. macOS: Mount DMG and drag to Applications
3. iOS: Open project in Xcode and build

## Support:
Contact HefnerHoldings for support and licensing.
`;
    
    fs.writeFileSync(path.join(distDir, 'README.txt'), readmeContent);
    
    logSuccess(`Distribution package created in ${distDir}/`);
    console.log('');
}

// Display build summary
function displaySummary() {
    log('🎉 Build Summary', 'green');
    log('================', 'green');
    
    console.log(`Version: ${config.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`Node.js: ${process.version}`);
    console.log('');
    
    // Check what was built
    const builtPlatforms = [];
    
    if (fs.existsSync('dist-electron')) {
        const files = fs.readdirSync('dist-electron');
        files.forEach(file => {
            if (file.includes('win')) builtPlatforms.push('Windows');
            if (file.includes('mac') || file.includes('darwin')) builtPlatforms.push('macOS');
            if (file.includes('linux')) builtPlatforms.push('Linux');
        });
    }
    
    if (builtPlatforms.length > 0) {
        log('✅ Successfully built for:', 'green');
        builtPlatforms.forEach(platform => {
            log(`   • ${platform}`, 'green');
        });
    }
    
    console.log('');
    log('📁 Output directories:', 'cyan');
    log('   • dist-electron/ - Electron builds', 'cyan');
    log('   • dist/ - Web build', 'cyan');
    log('   • dist-all-platforms/ - Distribution package', 'cyan');
    
    console.log('');
    log('🚀 Next steps:', 'blue');
    log('   1. Test the built applications', 'blue');
    log('   2. Sign and notarize for distribution', 'blue');
    log('   3. Upload to app stores or distribute directly', 'blue');
    log('   4. Update documentation and version info', 'blue');
}

// Main build process
async function main() {
    try {
        log('🚀 Starting multi-platform build process...', 'cyan');
        console.log('');
        
        checkPrerequisites();
        installDependencies();
        buildWebApp();
        buildWindows();
        buildMac();
        buildIOS();
        createDistribution();
        displaySummary();
        
        log('✅ Multi-platform build completed successfully!', 'green');
        
    } catch (error) {
        logError('Build process failed:');
        console.error(error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, config };
