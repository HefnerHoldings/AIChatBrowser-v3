const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🦀 Building MadEasy Browser with Tauri (Rust)...\n');

// Check if we have Rust and Tauri installed
function checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    try {
        const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Rust found: ${rustVersion}`);
    } catch (error) {
        console.log('❌ Rust not found. Please install Rust:');
        console.log('   https://rustup.rs/');
        process.exit(1);
    }
    
    try {
        const cargoVersion = execSync('cargo --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Cargo found: ${cargoVersion}`);
    } catch (error) {
        console.log('❌ Cargo not found. Please install Rust toolchain.');
        process.exit(1);
    }
    
    try {
        const tauriVersion = execSync('cargo tauri --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Tauri CLI found: ${tauriVersion}`);
    } catch (error) {
        console.log('⚠️  Tauri CLI not found. Installing...');
        try {
            execSync('cargo install tauri-cli', { stdio: 'inherit' });
            console.log('✅ Tauri CLI installed');
        } catch (installError) {
            console.log('❌ Failed to install Tauri CLI');
            process.exit(1);
        }
    }
    
    console.log('');
}

// Build steps for Tauri
const steps = [
    {
        name: 'Installing Node.js dependencies',
        command: 'npm install',
        cwd: __dirname
    },
    {
        name: 'Building frontend',
        command: 'npm run build',
        cwd: __dirname
    },
    {
        name: 'Building Tauri application',
        command: 'cargo tauri build',
        cwd: path.join(__dirname, 'src-tauri')
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
async function buildTauri() {
    try {
        checkPrerequisites();
        
        log('🚀 Starting Tauri build process...', 'blue');
        console.log('');
        
        for (const step of steps) {
            try {
                log(`📦 ${step.name}...`, 'blue');
                execSync(step.command, { 
                    stdio: 'inherit',
                    cwd: step.cwd || __dirname,
                    timeout: 600000 // 10 minutes for Rust compilation
                });
                log(`✅ ${step.name} completed`, 'green');
                console.log('');
            } catch (error) {
                log(`❌ ${step.name} failed:`, 'red');
                console.error(error.message);
                process.exit(1);
            }
        }
        
        // Display build results
        displayBuildResults();
        
    } catch (error) {
        log('❌ Tauri build process failed:', 'red');
        console.error(error);
        process.exit(1);
    }
}

function displayBuildResults() {
    console.log('');
    log('🎉 Tauri Build Summary', 'green');
    log('======================', 'green');
    
    const targetDir = path.join(__dirname, 'src-tauri', 'target', 'release');
    const bundleDir = path.join(targetDir, 'bundle');
    
    if (fs.existsSync(bundleDir)) {
        console.log('📁 Build artifacts:');
        
        // Check for different bundle formats
        const formats = ['msi', 'nsis', 'deb', 'rpm', 'dmg', 'app'];
        
        formats.forEach(format => {
            const formatDir = path.join(bundleDir, format);
            if (fs.existsSync(formatDir)) {
                const files = fs.readdirSync(formatDir);
                files.forEach(file => {
                    const filePath = path.join(formatDir, file);
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        const size = (stats.size / 1024 / 1024).toFixed(2);
                        console.log(`   • ${format}/${file} (${size} MB)`);
                    }
                });
            }
        });
    }
    
    // Check for executable
    const exeName = process.platform === 'win32' ? 'madeasy-browser.exe' : 'madeasy-browser';
    const exePath = path.join(targetDir, exeName);
    if (fs.existsSync(exePath)) {
        const stats = fs.statSync(exePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   • ${exeName} (${size} MB)`);
    }
    
    console.log('');
    log('🦀 Tauri Benefits:', 'blue');
    log('   • Smaller bundle size than Electron', 'blue');
    log('   • Better performance with Rust backend', 'blue');
    log('   • Enhanced security with Rust memory safety', 'blue');
    log('   • Native system integration', 'blue');
    
    console.log('');
    log('🚀 Installation:', 'blue');
    if (process.platform === 'win32') {
        log('   Windows: Run the .msi or .exe installer', 'blue');
    } else if (process.platform === 'darwin') {
        log('   macOS: Mount .dmg and drag to Applications', 'blue');
    } else {
        log('   Linux: Install .deb/.rpm or use AppImage', 'blue');
    }
    
    console.log('');
    log('✅ Tauri build completed successfully!', 'green');
}

// Development mode
async function devTauri() {
    try {
        checkPrerequisites();
        
        log('🚀 Starting Tauri development mode...', 'blue');
        console.log('');
        
        execSync('cargo tauri dev', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, 'src-tauri')
        });
        
    } catch (error) {
        log('❌ Tauri development mode failed:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Command line interface
const command = process.argv[2];

if (command === 'dev') {
    devTauri();
} else {
    buildTauri();
}

module.exports = { buildTauri, devTauri };
