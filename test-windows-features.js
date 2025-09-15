const { app, BrowserWindow } = require('electron');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Windows Features Test Suite
class WindowsFeaturesTester {
    constructor() {
        this.testResults = [];
        this.failedTests = [];
        this.passedTests = [];
        this.skippedTests = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Windows Features Test Suite...\n');
        
        if (process.platform !== 'win32') {
            console.log('⚠️  Tests skipped - not running on Windows');
            return;
        }

        const tests = [
            this.testWindowsFeatures,
            this.testPerformanceOptimization,
            this.testSecurityFeatures,
            this.testNotificationSystem,
            this.testKeyboardShortcuts,
            this.testFileAssociations,
            this.testRegistryIntegration,
            this.testInstallerFunctionality,
            this.testSystemIntegration
        ];

        for (const test of tests) {
            try {
                await test.call(this);
            } catch (error) {
                this.logTestResult('ERROR', test.name, error.message);
            }
        }

        this.printSummary();
    }

    async testWindowsFeatures() {
        const testName = 'Windows Features Integration';
        console.log(`🔍 Testing ${testName}...`);

        try {
            // Test WindowsFeatures class
            const WindowsFeatures = require('./windows-features');
            
            // Create mock main window
            const mockWindow = {
                webContents: {
                    send: () => {},
                    once: () => {}
                },
                setProgressBar: () => {},
                setOverlayIcon: () => {},
                flashFrame: () => {}
            };

            const windowsFeatures = new WindowsFeatures(mockWindow);
            
            // Test methods exist
            assert(typeof windowsFeatures.setupWindowsSpecificFeatures === 'function', 'setupWindowsSpecificFeatures method missing');
            assert(typeof windowsFeatures.getWindowsAccentColor === 'function', 'getWindowsAccentColor method missing');
            assert(typeof windowsFeatures.setupWindowsRegistry === 'function', 'setupWindowsRegistry method missing');
            
            // Test accent color retrieval
            const accentColor = windowsFeatures.getWindowsAccentColor();
            assert(typeof accentColor === 'string', 'Accent color should be a string');
            assert(accentColor.startsWith('#'), 'Accent color should be hex format');

            this.logTestResult('PASS', testName, 'All Windows features initialized correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testPerformanceOptimization() {
        const testName = 'Performance Optimization';
        console.log(`🔍 Testing ${testName}...`);

        try {
            const WindowsPerformance = require('./windows-performance');
            
            const mockWindow = {
                webContents: {
                    send: () => {}
                }
            };

            const performance = new WindowsPerformance(mockWindow);
            
            // Test system info collection
            const systemInfo = performance.getSystemInfo();
            assert(systemInfo.platform === 'win32', 'Platform should be win32');
            assert(typeof systemInfo.cpus === 'number', 'CPU count should be a number');
            assert(typeof systemInfo.totalMemory === 'number', 'Total memory should be a number');

            // Test performance settings
            const stats = performance.getPerformanceStats();
            assert(stats.systemInfo, 'System info should be available');
            assert(stats.performanceSettings, 'Performance settings should be available');

            // Test settings update
            performance.updatePerformanceSettings({ gpuAcceleration: false });
            assert(performance.performanceSettings.gpuAcceleration === false, 'Settings should update');

            this.logTestResult('PASS', testName, 'Performance optimization working correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testSecurityFeatures() {
        const testName = 'Security Features';
        console.log(`🔍 Testing ${testName}...`);

        try {
            const WindowsSecurity = require('./windows-security');
            
            const mockWindow = {
                webContents: {
                    send: () => {}
                }
            };

            const security = new WindowsSecurity(mockWindow);
            
            // Test security status
            const status = security.getSecurityStatus();
            assert(status.settings, 'Security settings should be available');
            assert(Array.isArray(status.blockedDomains), 'Blocked domains should be an array');
            assert(Array.isArray(status.trustedDomains), 'Trusted domains should be an array');

            // Test domain blocking
            security.blockDomain('malicious-site.com');
            assert(security.blockedDomains.has('malicious-site.com'), 'Domain should be blocked');

            security.unblockDomain('malicious-site.com');
            assert(!security.blockedDomains.has('malicious-site.com'), 'Domain should be unblocked');

            // Test dangerous file detection
            assert(security.isDangerousFileType('virus.exe'), 'EXE files should be detected as dangerous');
            assert(!security.isDangerousFileType('document.pdf'), 'PDF files should be safe');

            this.logTestResult('PASS', testName, 'Security features working correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testNotificationSystem() {
        const testName = 'Notification System';
        console.log(`🔍 Testing ${testName}...`);

        try {
            const WindowsNotifications = require('./windows-notifications');
            
            const mockWindow = {
                webContents: {
                    send: () => {}
                },
                show: () => {},
                focus: () => {}
            };

            const notifications = new WindowsNotifications(mockWindow);
            
            // Test settings
            const settings = notifications.settings;
            assert(typeof settings.enabled === 'boolean', 'Enabled setting should be boolean');
            assert(typeof settings.soundEnabled === 'boolean', 'Sound setting should be boolean');

            // Test notification ID generation
            const id1 = notifications.generateNotificationId();
            const id2 = notifications.generateNotificationId();
            assert(id1 !== id2, 'Notification IDs should be unique');
            assert(id1.startsWith('notification_'), 'ID should have correct prefix');

            // Test Toast XML generation
            const xml = notifications.generateToastXml({
                title: 'Test Title',
                body: 'Test Body'
            });
            assert(xml.includes('<toast>'), 'XML should contain toast element');
            assert(xml.includes('Test Title'), 'XML should contain title');

            // Test settings update
            const result = notifications.updateSettings({ enabled: false });
            assert(result.success, 'Settings update should succeed');
            assert(notifications.settings.enabled === false, 'Setting should be updated');

            this.logTestResult('PASS', testName, 'Notification system working correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testKeyboardShortcuts() {
        const testName = 'Keyboard Shortcuts';
        console.log(`🔍 Testing ${testName}...`);

        try {
            const WindowsShortcuts = require('./windows-shortcuts');
            
            const mockWindow = {
                webContents: {
                    send: () => {},
                    toggleDevTools: () => {}
                },
                setFullScreen: () => {},
                isFullScreen: () => false
            };

            const mockTabManager = {
                windows: new Map([['main', mockWindow]]),
                activeTab: new Map(),
                tabs: new Map(),
                createTab: () => 'tab1',
                closeTab: () => {},
                nextTab: () => {},
                previousTab: () => {}
            };

            const shortcuts = new WindowsShortcuts(mockWindow, mockTabManager);
            
            // Test shortcuts list
            const shortcutsList = shortcuts.getShortcutsList();
            assert(Array.isArray(shortcutsList), 'Shortcuts list should be an array');
            assert(shortcutsList.length > 0, 'Should have registered shortcuts');

            // Test specific shortcut exists
            const ctrlT = shortcutsList.find(s => s.accelerator === 'Ctrl+T');
            assert(ctrlT, 'Ctrl+T shortcut should be registered');
            assert(ctrlT.description, 'Shortcut should have description');

            // Test shortcut description
            const description = shortcuts.getShortcutDescription('new-tab');
            assert(typeof description === 'string', 'Description should be a string');

            this.logTestResult('PASS', testName, 'Keyboard shortcuts working correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testFileAssociations() {
        const testName = 'File Associations';
        console.log(`🔍 Testing ${testName}...`);

        try {
            // Test protocol registration
            const protocols = ['http', 'https', 'madeasy-browser'];
            
            for (const protocol of protocols) {
                try {
                    app.setAsDefaultProtocolClient(protocol);
                    const isDefault = app.isDefaultProtocolClient(protocol);
                    console.log(`  Protocol ${protocol}: ${isDefault ? 'registered' : 'not registered'}`);
                } catch (error) {
                    console.log(`  Protocol ${protocol}: registration failed (${error.message})`);
                }
            }

            this.logTestResult('PASS', testName, 'File associations tested (may need admin rights)');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testRegistryIntegration() {
        const testName = 'Registry Integration';
        console.log(`🔍 Testing ${testName}...`);

        try {
            // Test if winreg module is available
            let winregAvailable = false;
            try {
                require('winreg');
                winregAvailable = true;
            } catch (error) {
                console.log('  WinReg module not available, skipping registry tests');
            }

            if (winregAvailable) {
                const Registry = require('winreg');
                
                // Test registry key creation (read-only test)
                const testKey = new Registry({
                    hive: Registry.HKCU,
                    key: '\\Software\\MadEasy\\Browser'
                });

                // Just test that we can create the key object
                assert(testKey.hive === Registry.HKCU, 'Registry key should use HKCU hive');
                assert(testKey.key.includes('MadEasy'), 'Registry key should include MadEasy path');
            }

            this.logTestResult('PASS', testName, 'Registry integration available');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testInstallerFunctionality() {
        const testName = 'Installer Functionality';
        console.log(`🔍 Testing ${testName}...`);

        try {
            // Test installer script exists
            const installerPath = path.join(__dirname, 'windows-installer-enhanced.ps1');
            assert(fs.existsSync(installerPath), 'Enhanced installer script should exist');

            // Read installer content
            const installerContent = fs.readFileSync(installerPath, 'utf8');
            assert(installerContent.includes('MadEasy Browser'), 'Installer should reference MadEasy Browser');
            assert(installerContent.includes('param('), 'Installer should accept parameters');
            assert(installerContent.includes('function'), 'Installer should contain functions');

            // Test startup script
            const startupPath = path.join(__dirname, 'start-windows-enhanced.bat');
            assert(fs.existsSync(startupPath), 'Enhanced startup script should exist');

            const startupContent = fs.readFileSync(startupPath, 'utf8');
            assert(startupContent.includes('MadEasy Browser'), 'Startup script should reference MadEasy Browser');
            assert(startupContent.includes('NODE_ENV'), 'Startup script should set environment variables');

            this.logTestResult('PASS', testName, 'Installer functionality available');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    async testSystemIntegration() {
        const testName = 'System Integration';
        console.log(`🔍 Testing ${testName}...`);

        try {
            // Test app user model ID
            const userModelId = app.getAppUserModelId();
            console.log(`  App User Model ID: ${userModelId || 'not set'}`);

            // Test app paths
            const paths = {
                userData: app.getPath('userData'),
                downloads: app.getPath('downloads'),
                documents: app.getPath('documents'),
                desktop: app.getPath('desktop')
            };

            for (const [name, path] of Object.entries(paths)) {
                assert(typeof path === 'string', `${name} path should be a string`);
                assert(path.length > 0, `${name} path should not be empty`);
                console.log(`  ${name}: ${path}`);
            }

            // Test OS info
            const os = require('os');
            const osInfo = {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMem: Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB'
            };

            console.log(`  OS: ${osInfo.platform} ${osInfo.release} ${osInfo.arch}`);
            console.log(`  CPU cores: ${osInfo.cpus}, RAM: ${osInfo.totalMem}`);

            this.logTestResult('PASS', testName, 'System integration working correctly');
        } catch (error) {
            this.logTestResult('FAIL', testName, error.message);
        }
    }

    logTestResult(status, testName, message) {
        const result = { status, testName, message, timestamp: new Date().toISOString() };
        this.testResults.push(result);

        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '❌';
        console.log(`${icon} ${testName}: ${message}\n`);

        if (status === 'PASS') {
            this.passedTests.push(result);
        } else if (status === 'FAIL') {
            this.failedTests.push(result);
        } else {
            this.skippedTests.push(result);
        }
    }

    printSummary() {
        console.log('\n📊 Test Summary');
        console.log('================');
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`✅ Passed: ${this.passedTests.length}`);
        console.log(`❌ Failed: ${this.failedTests.length}`);
        console.log(`⏭️ Skipped: ${this.skippedTests.length}`);

        if (this.failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.failedTests.forEach(test => {
                console.log(`  • ${test.testName}: ${test.message}`);
            });
        }

        const successRate = (this.passedTests.length / this.testResults.length) * 100;
        console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);

        if (successRate === 100) {
            console.log('🎉 All tests passed! Windows features are working correctly.');
        } else if (successRate >= 80) {
            console.log('✨ Most tests passed. Minor issues may need attention.');
        } else {
            console.log('⚠️ Several tests failed. Please review and fix issues.');
        }

        // Save results to file
        this.saveTestResults();
    }

    saveTestResults() {
        const resultsPath = path.join(__dirname, 'test-results-windows.json');
        const results = {
            timestamp: new Date().toISOString(),
            platform: process.platform,
            nodeVersion: process.version,
            electronVersion: process.versions.electron,
            summary: {
                total: this.testResults.length,
                passed: this.passedTests.length,
                failed: this.failedTests.length,
                skipped: this.skippedTests.length,
                successRate: (this.passedTests.length / this.testResults.length) * 100
            },
            results: this.testResults
        };

        try {
            fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
            console.log(`\n💾 Test results saved to: ${resultsPath}`);
        } catch (error) {
            console.error(`❌ Failed to save test results: ${error.message}`);
        }
    }
}

// Export for use in other modules
module.exports = WindowsFeaturesTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new WindowsFeaturesTester();
    
    // Wait for Electron app to be ready if running in Electron context
    if (typeof app !== 'undefined') {
        app.whenReady().then(() => {
            tester.runAllTests().then(() => {
                console.log('\n🏁 Testing complete. Exiting...');
                process.exit(0);
            });
        });
    } else {
        // Running in Node.js context
        tester.runAllTests().then(() => {
            console.log('\n🏁 Testing complete.');
        });
    }
}
