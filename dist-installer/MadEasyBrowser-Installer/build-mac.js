const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🍎 Building MadEasy Browser for macOS...\n');

// Check if we're on macOS
if (process.platform !== 'darwin') {
    console.log('⚠️  Warning: This script is designed for macOS builds.');
    console.log('   You can still build for macOS on Windows using cross-compilation.\n');
}

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
        name: 'Building macOS app',
        command: 'npx electron-builder --mac --publish=never'
    }
];

// Execute build steps
for (const step of steps) {
    try {
        console.log(`📦 ${step.name}...`);
        execSync(step.command, { 
            stdio: 'inherit',
            cwd: __dirname
        });
        console.log(`✅ ${step.name} completed\n`);
    } catch (error) {
        console.error(`❌ ${step.name} failed:`, error.message);
        process.exit(1);
    }
}

console.log('🎉 macOS build completed successfully!');
console.log('📁 Check the dist-electron folder for the built app.');

// Display build info
const distDir = path.join(__dirname, 'dist-electron');
if (fs.existsSync(distDir)) {
    console.log('\n📋 Build artifacts:');
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            const size = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`   • ${file} (${size} MB)`);
        }
    });
}

