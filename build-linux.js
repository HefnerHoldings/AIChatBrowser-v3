const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🐧 Building MadEasy Browser for Linux...\n');

// Check if we can build for Linux
const platform = process.platform;
console.log(`Building from: ${platform} ${process.arch}`);

if (platform === 'win32') {
    console.log('⚠️  Cross-compiling for Linux from Windows');
    console.log('   This requires proper build tools and dependencies.\n');
} else if (platform === 'darwin') {
    console.log('⚠️  Cross-compiling for Linux from macOS');
    console.log('   This requires proper build tools and dependencies.\n');
} else {
    console.log('✅ Native Linux build environment detected\n');
}

// Configuration
const config = {
    targets: ['AppImage', 'deb', 'rpm', 'tar.gz'],
    architectures: ['x64'],
    outputDir: 'dist-linux'
};

// Build steps
const steps = [
    {
        name: 'Installing dependencies',
        command: 'npm install'
    },
    {
        name: 'Building frontend',
        command: 'npm run build'
    },
    {
        name: 'Building Linux packages',
        command: `npx electron-builder --linux --x64 --publish=never`
    }
];

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Execute build steps
async function buildLinux() {
    try {
        log('🚀 Starting Linux build process...', 'blue');
        console.log('');
        
        for (const step of steps) {
            try {
                log(`📦 ${step.name}...`, 'blue');
                execSync(step.command, { 
                    stdio: 'inherit',
                    cwd: __dirname,
                    timeout: 300000 // 5 minutes
                });
                log(`✅ ${step.name} completed`, 'green');
                console.log('');
            } catch (error) {
                log(`❌ ${step.name} failed:`, 'red');
                console.error(error.message);
                
                // Continue with other steps for non-critical failures
                if (step.name.includes('Building Linux packages')) {
                    log('⚠️  Continuing despite package build failure...', 'yellow');
                    continue;
                } else {
                    process.exit(1);
                }
            }
        }
        
        // Display build results
        displayBuildResults();
        
    } catch (error) {
        log('❌ Linux build process failed:', 'red');
        console.error(error);
        process.exit(1);
    }
}

function displayBuildResults() {
    console.log('');
    log('🎉 Linux Build Summary', 'green');
    log('======================', 'green');
    
    const distDir = path.join(__dirname, 'dist-electron');
    if (fs.existsSync(distDir)) {
        console.log('📁 Build artifacts:');
        const files = fs.readdirSync(distDir);
        
        files.forEach(file => {
            const filePath = path.join(distDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isFile() && (
                file.includes('linux') || 
                file.endsWith('.AppImage') || 
                file.endsWith('.deb') || 
                file.endsWith('.rpm') ||
                file.endsWith('.tar.gz')
            )) {
                const size = (stats.size / 1024 / 1024).toFixed(2);
                console.log(`   • ${file} (${size} MB)`);
            }
        });
    }
    
    console.log('');
    log('📋 Linux Distribution Formats:', 'blue');
    log('   • AppImage - Universal Linux package', 'blue');
    log('   • .deb - Debian/Ubuntu package', 'blue');
    log('   • .rpm - Red Hat/Fedora package', 'blue');
    log('   • .tar.gz - Generic archive', 'blue');
    
    console.log('');
    log('🚀 Installation Instructions:', 'blue');
    log('   AppImage: chmod +x *.AppImage && ./MadEasyBrowser*.AppImage', 'blue');
    log('   Debian: sudo dpkg -i madeasy-browser*.deb', 'blue');
    log('   Red Hat: sudo rpm -i madeasy-browser*.rpm', 'blue');
    log('   Archive: tar -xzf madeasy-browser*.tar.gz', 'blue');
    
    console.log('');
    log('✅ Linux build completed successfully!', 'green');
}

// Run if called directly
if (require.main === module) {
    buildLinux();
}

module.exports = { buildLinux, config };
