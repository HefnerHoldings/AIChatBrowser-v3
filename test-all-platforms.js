const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🧪 MadEasy Browser - Comprehensive Platform Testing Suite\n');
console.log('====================================================\n');

// Test configuration for each platform
const testConfigs = {
    web: {
        name: 'Web Application',
        enabled: true,
        tests: ['unit', 'integration', 'e2e'],
        commands: {
            unit: 'npm test',
            integration: 'npm run test:integration',
            e2e: 'npm run test:e2e'
        }
    },
    windows: {
        name: 'Windows Electron',
        enabled: process.platform === 'win32',
        tests: ['build', 'functionality', 'installer'],
        commands: {
            build: 'npm run build:windows',
            functionality: 'npm run test:windows',
            installer: 'powershell -File test-windows-installer.ps1'
        }
    },
    mac: {
        name: 'macOS Application',
        enabled: process.platform === 'darwin',
        tests: ['build', 'functionality', 'native'],
        commands: {
            build: 'npm run build:mac',
            functionality: 'npm run test:mac',
            native: 'xcodebuild test -project mac-app/MadEasyBrowser.xcodeproj'
        }
    },
    linux: {
        name: 'Linux Application',
        enabled: process.platform === 'linux' || process.platform === 'win32',
        tests: ['build', 'functionality', 'packages'],
        commands: {
            build: 'npm run build:linux',
            functionality: 'npm run test:linux',
            packages: 'node test-linux-packages.js'
        }
    },
    ios: {
        name: 'iOS Application',
        enabled: process.platform === 'darwin',
        tests: ['build', 'simulator'],
        commands: {
            build: 'npm run build:ios',
            simulator: 'ios-app/test-ios-simulator.sh'
        }
    },
    android: {
        name: 'Android Application',
        enabled: process.env.ANDROID_HOME !== undefined,
        tests: ['build', 'emulator'],
        commands: {
            build: 'npm run build:android',
            emulator: 'android-webview/test-android-emulator.sh'
        }
    },
    tauri: {
        name: 'Tauri Application',
        enabled: true,
        tests: ['build', 'functionality'],
        commands: {
            build: 'npm run build:tauri',
            functionality: 'cargo test --manifest-path src-tauri/Cargo.toml'
        }
    },
    extensions: {
        name: 'Browser Extensions',
        enabled: true,
        tests: ['build', 'chrome', 'firefox'],
        commands: {
            build: 'npm run build:extensions',
            chrome: 'node test-chrome-extension.js',
            firefox: 'node test-firefox-extension.js'
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

// Test results tracking
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    platforms: {}
};

// Run test for specific platform
async function runPlatformTests(platform) {
    const config = testConfigs[platform];
    
    if (!config.enabled) {
        log(`⏭️  Skipping ${config.name} (not available on this system)`, 'yellow');
        testResults.platforms[platform] = { status: 'skipped', reason: 'not available' };
        testResults.skipped++;
        return;
    }
    
    log(`🧪 Testing ${config.name}...`, 'blue');
    
    const platformResults = {
        status: 'passed',
        tests: {},
        errors: []
    };
    
    for (const testType of config.tests) {
        const command = config.commands[testType];
        
        if (!command) {
            log(`  ⚠️  No command defined for ${testType}`, 'yellow');
            continue;
        }
        
        try {
            log(`  📋 Running ${testType} test...`, 'cyan');
            
            const startTime = Date.now();
            
            // Execute test command
            execSync(command, { 
                stdio: 'pipe',
                timeout: 300000, // 5 minutes
                cwd: __dirname
            });
            
            const duration = Date.now() - startTime;
            
            platformResults.tests[testType] = {
                status: 'passed',
                duration: duration
            };
            
            log(`  ✅ ${testType} test passed (${duration}ms)`, 'green');
            testResults.passed++;
            
        } catch (error) {
            platformResults.tests[testType] = {
                status: 'failed',
                error: error.message
            };
            
            platformResults.status = 'failed';
            platformResults.errors.push(`${testType}: ${error.message}`);
            
            log(`  ❌ ${testType} test failed: ${error.message}`, 'red');
            testResults.failed++;
        }
        
        testResults.total++;
    }
    
    testResults.platforms[platform] = platformResults;
    
    if (platformResults.status === 'passed') {
        log(`✅ ${config.name} - All tests passed`, 'green');
    } else {
        log(`❌ ${config.name} - Some tests failed`, 'red');
    }
    
    console.log('');
}

// Create test files for platforms that need them
function createTestFiles() {
    log('📝 Creating test files...', 'blue');
    
    // Windows installer test
    const windowsInstallerTest = `# Windows Installer Test Script
Write-Host "Testing Windows installer..." -ForegroundColor Blue

$installerPath = "dist-electron\\MadEasyBrowser Setup*.exe"
if (Test-Path $installerPath) {
    Write-Host "✅ Installer found" -ForegroundColor Green
    
    # Test installer properties
    $installer = Get-Item $installerPath
    $size = [math]::Round($installer.Length / 1MB, 2)
    Write-Host "📦 Installer size: $size MB" -ForegroundColor Cyan
    
    if ($size -gt 0 -and $size -lt 500) {
        Write-Host "✅ Installer size is reasonable" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Installer size may be too large" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Installer not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Windows installer tests completed" -ForegroundColor Green`;
    
    fs.writeFileSync('test-windows-installer.ps1', windowsInstallerTest);
    
    // Linux packages test
    const linuxPackagesTest = `const fs = require('fs');
const path = require('path');

console.log('🐧 Testing Linux packages...');

const packageFormats = ['AppImage', 'deb', 'rpm'];
const distDir = 'dist-electron';

let allFound = true;

packageFormats.forEach(format => {
    const files = fs.readdirSync(distDir).filter(file => 
        file.includes(format.toLowerCase()) || file.endsWith('.' + format.toLowerCase())
    );
    
    if (files.length > 0) {
        console.log(\`✅ \${format} package found: \${files[0]}\`);
        
        const filePath = path.join(distDir, files[0]);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(\`📦 Size: \${size} MB\`);
    } else {
        console.log(\`❌ \${format} package not found\`);
        allFound = false;
    }
});

if (allFound) {
    console.log('✅ All Linux packages found');
    process.exit(0);
} else {
    console.log('❌ Some Linux packages missing');
    process.exit(1);
}`;
    
    fs.writeFileSync('test-linux-packages.js', linuxPackagesTest);
    
    // Chrome extension test
    const chromeExtensionTest = `const fs = require('fs');
const path = require('path');

console.log('🌐 Testing Chrome extension...');

const extensionDir = 'dist-extensions/chrome';
const requiredFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.html',
    'popup.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(extensionDir, file);
    if (fs.existsSync(filePath)) {
        console.log(\`✅ \${file} found\`);
        
        if (file === 'manifest.json') {
            try {
                const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(\`📋 Manifest version: \${manifest.manifest_version}\`);
                console.log(\`📋 Extension version: \${manifest.version}\`);
            } catch (error) {
                console.log(\`❌ Invalid manifest.json: \${error.message}\`);
                allFilesExist = false;
            }
        }
    } else {
        console.log(\`❌ \${file} not found\`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('✅ Chrome extension structure is valid');
    process.exit(0);
} else {
    console.log('❌ Chrome extension structure is invalid');
    process.exit(1);
}`;
    
    fs.writeFileSync('test-chrome-extension.js', chromeExtensionTest);
    
    // Firefox extension test
    const firefoxExtensionTest = `const fs = require('fs');
const path = require('path');

console.log('🦊 Testing Firefox extension...');

const extensionDir = 'dist-extensions/firefox';
const manifestPath = path.join(extensionDir, 'manifest.json');

if (fs.existsSync(manifestPath)) {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        if (manifest.manifest_version === 2) {
            console.log('✅ Firefox manifest version 2 detected');
        } else {
            console.log('⚠️ Firefox should use manifest version 2');
        }
        
        if (manifest.browser_action) {
            console.log('✅ browser_action found (Firefox format)');
        } else {
            console.log('❌ browser_action not found');
        }
        
        console.log('✅ Firefox extension structure is valid');
        process.exit(0);
        
    } catch (error) {
        console.log(\`❌ Invalid Firefox manifest: \${error.message}\`);
        process.exit(1);
    }
} else {
    console.log('❌ Firefox extension manifest not found');
    process.exit(1);
}`;
    
    fs.writeFileSync('test-firefox-extension.js', firefoxExtensionTest);
    
    log('✅ Test files created', 'green');
    console.log('');
}

// System information
function displaySystemInfo() {
    log('💻 System Information:', 'cyan');
    console.log(`   Platform: ${process.platform} ${process.arch}`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`   OS: ${os.type()} ${os.release()}`);
    console.log(`   CPU: ${os.cpus()[0].model}`);
    console.log(`   Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
    
    // Check for development tools
    const tools = {
        'Git': 'git --version',
        'Docker': 'docker --version',
        'Android SDK': 'echo $ANDROID_HOME',
        'Xcode': 'xcode-select --version'
    };
    
    console.log('');
    log('🛠️  Development Tools:', 'cyan');
    
    Object.entries(tools).forEach(([tool, command]) => {
        try {
            const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
            if (result && !result.includes('not found')) {
                console.log(`   ✅ ${tool}: Available`);
            } else {
                console.log(`   ❌ ${tool}: Not available`);
            }
        } catch (error) {
            console.log(`   ❌ ${tool}: Not available`);
        }
    });
    
    console.log('');
}

// Generate test report
function generateTestReport() {
    log('📊 Test Report Generation...', 'blue');
    
    const report = {
        timestamp: new Date().toISOString(),
        system: {
            platform: process.platform,
            arch: process.arch,
            node: process.version,
            os: `${os.type()} ${os.release()}`
        },
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            skipped: testResults.skipped,
            success_rate: testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0
        },
        platforms: testResults.platforms
    };
    
    // Write JSON report
    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    
    // Write HTML report
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
    <title>MadEasy Browser - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .platform { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-left: 5px solid #28a745; }
        .failed { border-left: 5px solid #dc3545; }
        .skipped { border-left: 5px solid #ffc107; }
        .test-item { margin: 5px 0; padding: 5px; background: #f8f9fa; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 MadEasy Browser Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.total}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Skipped:</strong> ${report.summary.skipped}</p>
        <p><strong>Success Rate:</strong> ${report.summary.success_rate}%</p>
    </div>
    
    <h2>🎯 Platform Results</h2>
    ${Object.entries(report.platforms).map(([platform, result]) => `
        <div class="platform ${result.status}">
            <h3>${testConfigs[platform].name}</h3>
            <p><strong>Status:</strong> ${result.status}</p>
            ${result.tests ? Object.entries(result.tests).map(([test, testResult]) => `
                <div class="test-item">
                    <strong>${test}:</strong> ${testResult.status} 
                    ${testResult.duration ? `(${testResult.duration}ms)` : ''}
                    ${testResult.error ? `- ${testResult.error}` : ''}
                </div>
            `).join('') : ''}
            ${result.errors && result.errors.length > 0 ? `
                <div style="color: #dc3545; margin-top: 10px;">
                    <strong>Errors:</strong>
                    <ul>${result.errors.map(error => `<li>${error}</li>`).join('')}</ul>
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <div style="margin-top: 30px; text-align: center; color: #666;">
        <p>MadEasy Browser v3.0.0 - Cross-Platform Testing Suite</p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('test-report.html', htmlReport);
    
    log('✅ Test reports generated:', 'green');
    console.log('   📄 test-report.json');
    console.log('   🌐 test-report.html');
    console.log('');
}

// Display final summary
function displaySummary() {
    console.log('');
    log('🎉 Testing Summary', 'green');
    log('==================', 'green');
    
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${colors.green}${testResults.passed}${colors.reset}`);
    console.log(`Failed: ${colors.red}${testResults.failed}${colors.reset}`);
    console.log(`Skipped: ${colors.yellow}${testResults.skipped}${colors.reset}`);
    
    const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
    console.log(`Success Rate: ${successRate}%`);
    
    console.log('');
    log('📋 Platform Status:', 'cyan');
    Object.entries(testResults.platforms).forEach(([platform, result]) => {
        const config = testConfigs[platform];
        const statusColor = result.status === 'passed' ? 'green' : 
                          result.status === 'failed' ? 'red' : 'yellow';
        log(`   ${config.name}: ${result.status}`, statusColor);
    });
    
    console.log('');
    if (testResults.failed === 0) {
        log('🎊 All available platforms tested successfully!', 'green');
    } else {
        log('⚠️  Some tests failed. Check the detailed report for more information.', 'yellow');
    }
    
    console.log('');
    log('📄 Detailed reports available:', 'blue');
    console.log('   • test-report.json - Machine-readable results');
    console.log('   • test-report.html - Human-readable report');
}

// Main testing process
async function runAllTests() {
    try {
        displaySystemInfo();
        createTestFiles();
        
        log('🚀 Starting comprehensive platform testing...', 'blue');
        console.log('');
        
        // Test each platform
        for (const platform of Object.keys(testConfigs)) {
            await runPlatformTests(platform);
        }
        
        generateTestReport();
        displaySummary();
        
        // Exit with appropriate code
        process.exit(testResults.failed > 0 ? 1 : 0);
        
    } catch (error) {
        log('❌ Testing process failed:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Command line interface
const command = process.argv[2];

if (command === '--help' || command === '-h') {
    console.log('Usage: node test-all-platforms.js [platform]');
    console.log('');
    console.log('Available platforms:');
    Object.entries(testConfigs).forEach(([key, config]) => {
        console.log(`  ${key.padEnd(12)} - ${config.name}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  node test-all-platforms.js           # Test all platforms');
    console.log('  node test-all-platforms.js web       # Test only web platform');
    console.log('  node test-all-platforms.js windows   # Test only Windows platform');
    process.exit(0);
}

if (command && testConfigs[command]) {
    // Test specific platform
    runPlatformTests(command).then(() => {
        generateTestReport();
        displaySummary();
    });
} else {
    // Test all platforms
    runAllTests();
}

module.exports = { runAllTests, runPlatformTests, testConfigs };

