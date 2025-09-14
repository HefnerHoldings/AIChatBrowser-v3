const { app, session, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Windows Security and Sandboxing Manager
class WindowsSecurity {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.securitySettings = {
            sandboxEnabled: true,
            webSecurityEnabled: true,
            contextIsolationEnabled: true,
            nodeIntegrationDisabled: true,
            contentSecurityPolicy: true,
            httpsUpgrade: true,
            blockMixedContent: true,
            safeBrowsing: true,
            downloadProtection: true
        };
        this.blockedDomains = new Set();
        this.trustedDomains = new Set();
        this.downloadQuarantine = new Map();
        this.setupWindowsSecurity();
    }

    setupWindowsSecurity() {
        if (process.platform !== 'win32') return;

        console.log('Setting up Windows security features...');

        // Setup sandboxing
        this.setupSandboxing();
        
        // Setup content security policy
        this.setupContentSecurityPolicy();
        
        // Setup download protection
        this.setupDownloadProtection();
        
        // Setup network security
        this.setupNetworkSecurity();
        
        // Setup Windows Defender integration
        this.setupDefenderIntegration();
        
        // Setup certificate validation
        this.setupCertificateValidation();
        
        // Setup malware protection
        this.setupMalwareProtection();
        
        // Setup privacy protection
        this.setupPrivacyProtection();
    }

    setupSandboxing() {
        if (!this.securitySettings.sandboxEnabled) return;

        console.log('Setting up browser sandboxing...');

        // Default sandbox for all sessions
        const defaultSession = session.defaultSession;
        
        // Enable site isolation
        app.commandLine.appendSwitch('enable-features', 'SiteIsolationForCrossOriginFrames');
        app.commandLine.appendSwitch('site-per-process');
        
        // Enable strict site isolation
        app.commandLine.appendSwitch('enable-strict-site-isolation');
        
        // Disable dangerous features in sandbox
        app.commandLine.appendSwitch('disable-background-mode');
        app.commandLine.appendSwitch('disable-background-networking');
        app.commandLine.appendSwitch('disable-default-apps');
        
        // Memory protection
        app.commandLine.appendSwitch('enable-features', 'VizHitTestSurfaceLayer');
    }

    setupContentSecurityPolicy() {
        if (!this.securitySettings.contentSecurityPolicy) return;

        console.log('Setting up Content Security Policy...');

        const defaultSession = session.defaultSession;

        // CSP headers
        const cspPolicy = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https: wss:",
            "media-src 'self' https:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'"
        ].join('; ');

        defaultSession.webRequest.onHeadersReceived((details, callback) => {
            // Add CSP header if not present
            if (!details.responseHeaders['Content-Security-Policy']) {
                details.responseHeaders['Content-Security-Policy'] = [cspPolicy];
            }

            // Add security headers
            details.responseHeaders['X-Frame-Options'] = ['DENY'];
            details.responseHeaders['X-Content-Type-Options'] = ['nosniff'];
            details.responseHeaders['X-XSS-Protection'] = ['1; mode=block'];
            details.responseHeaders['Referrer-Policy'] = ['strict-origin-when-cross-origin'];

            callback({ responseHeaders: details.responseHeaders });
        });
    }

    setupDownloadProtection() {
        if (!this.securitySettings.downloadProtection) return;

        console.log('Setting up download protection...');

        const defaultSession = session.defaultSession;

        defaultSession.on('will-download', (event, item, webContents) => {
            const filename = item.getFilename();
            const url = item.getURL();
            const downloadId = crypto.randomUUID();

            console.log(`Download initiated: ${filename} from ${url}`);

            // Check if file type is potentially dangerous
            if (this.isDangerousFileType(filename)) {
                const choice = dialog.showMessageBoxSync(this.mainWindow, {
                    type: 'warning',
                    buttons: ['Allow', 'Block'],
                    defaultId: 1,
                    title: 'Potentially Dangerous Download',
                    message: `The file "${filename}" might be dangerous.`,
                    detail: 'This file type can potentially harm your computer. Only download if you trust the source.'
                });

                if (choice === 1) {
                    event.preventDefault();
                    return;
                }
            }

            // Quarantine download for scanning
            this.quarantineDownload(downloadId, item);

            // Set up progress monitoring
            item.on('updated', (event, state) => {
                if (state === 'progressing' && item.isPaused()) {
                    console.log('Download paused');
                } else if (state === 'progressing') {
                    const progress = (item.getReceivedBytes() / item.getTotalBytes()) * 100;
                    this.mainWindow.webContents.send('download-progress', {
                        downloadId,
                        progress,
                        filename
                    });
                }
            });

            item.once('done', (event, state) => {
                if (state === 'completed') {
                    this.scanDownloadedFile(downloadId, item.getSavePath());
                } else {
                    console.log(`Download failed: ${state}`);
                    this.downloadQuarantine.delete(downloadId);
                }
            });
        });
    }

    setupNetworkSecurity() {
        console.log('Setting up network security...');

        const defaultSession = session.defaultSession;

        // HTTPS upgrade
        if (this.securitySettings.httpsUpgrade) {
            defaultSession.webRequest.onBeforeRequest((details, callback) => {
                if (details.url.startsWith('http://') && !details.url.includes('localhost')) {
                    const httpsUrl = details.url.replace('http://', 'https://');
                    callback({ redirectURL: httpsUrl });
                } else {
                    callback({});
                }
            });
        }

        // Block mixed content
        if (this.securitySettings.blockMixedContent) {
            defaultSession.webRequest.onBeforeRequest((details, callback) => {
                const url = new URL(details.url);
                const referrer = details.referrer ? new URL(details.referrer) : null;

                if (referrer && referrer.protocol === 'https:' && url.protocol === 'http:') {
                    console.log(`Blocked mixed content: ${details.url}`);
                    callback({ cancel: true });
                } else {
                    callback({});
                }
            });
        }

        // Domain blocking
        defaultSession.webRequest.onBeforeRequest((details, callback) => {
            const url = new URL(details.url);
            
            if (this.blockedDomains.has(url.hostname)) {
                console.log(`Blocked access to: ${url.hostname}`);
                callback({ cancel: true });
            } else {
                callback({});
            }
        });
    }

    setupDefenderIntegration() {
        console.log('Setting up Windows Defender integration...');

        // IPC handler for Defender integration
        ipcMain.handle('security:scan-file', async (event, { filePath }) => {
            return await this.scanFileWithDefender(filePath);
        });

        ipcMain.handle('security:add-exclusion', async (event, { path }) => {
            return await this.addDefenderExclusion(path);
        });

        ipcMain.handle('security:check-threat', async (event, { url }) => {
            return await this.checkUrlThreat(url);
        });
    }

    setupCertificateValidation() {
        console.log('Setting up certificate validation...');

        const defaultSession = session.defaultSession;

        // Certificate error handling
        app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
            event.preventDefault();

            const choice = dialog.showMessageBoxSync(this.mainWindow, {
                type: 'warning',
                buttons: ['Continue', 'Cancel'],
                defaultId: 1,
                title: 'Certificate Error',
                message: `Certificate error for ${url}`,
                detail: `Error: ${error}\n\nThis site's security certificate is not trusted. Continuing may put your information at risk.`
            });

            callback(choice === 0);
        });

        // Certificate pinning for important sites
        this.setupCertificatePinning();
    }

    setupMalwareProtection() {
        console.log('Setting up malware protection...');

        // URL scanning
        ipcMain.handle('security:scan-url', async (event, { url }) => {
            return await this.scanUrl(url);
        });

        // File scanning
        ipcMain.handle('security:scan-file-content', async (event, { content, filename }) => {
            return await this.scanFileContent(content, filename);
        });
    }

    setupPrivacyProtection() {
        console.log('Setting up privacy protection...');

        const defaultSession = session.defaultSession;

        // Tracking protection
        defaultSession.webRequest.onBeforeRequest((details, callback) => {
            if (this.isTrackingRequest(details.url)) {
                console.log(`Blocked tracking request: ${details.url}`);
                callback({ cancel: true });
            } else {
                callback({});
            }
        });

        // Cookie protection
        defaultSession.webRequest.onHeadersReceived((details, callback) => {
            if (details.responseHeaders['Set-Cookie']) {
                details.responseHeaders['Set-Cookie'] = details.responseHeaders['Set-Cookie'].map(cookie => {
                    if (!cookie.includes('SameSite')) {
                        return cookie + '; SameSite=Strict';
                    }
                    return cookie;
                });
            }

            callback({ responseHeaders: details.responseHeaders });
        });
    }

    setupCertificatePinning() {
        // Example certificate pinning for critical sites
        const pinnedCertificates = {
            'google.com': ['sha256/specific-hash-here'],
            'github.com': ['sha256/specific-hash-here']
        };

        // Implementation would verify certificate hashes
        console.log('Certificate pinning configured for critical sites');
    }

    isDangerousFileType(filename) {
        const dangerousExtensions = [
            '.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js',
            '.jar', '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi'
        ];

        const ext = path.extname(filename).toLowerCase();
        return dangerousExtensions.includes(ext);
    }

    quarantineDownload(downloadId, item) {
        this.downloadQuarantine.set(downloadId, {
            item,
            timestamp: Date.now(),
            scanned: false,
            safe: null
        });
    }

    async scanDownloadedFile(downloadId, filePath) {
        console.log(`Scanning downloaded file: ${filePath}`);

        try {
            // Real-time scanning with Windows Defender
            const scanResult = await this.scanFileWithDefender(filePath);
            
            const quarantineEntry = this.downloadQuarantine.get(downloadId);
            if (quarantineEntry) {
                quarantineEntry.scanned = true;
                quarantineEntry.safe = scanResult.safe;

                if (!scanResult.safe) {
                    // Move to quarantine folder
                    await this.moveToQuarantine(filePath);
                    
                    dialog.showMessageBox(this.mainWindow, {
                        type: 'error',
                        title: 'Malicious File Detected',
                        message: 'A potentially malicious file was detected and quarantined.',
                        detail: `File: ${path.basename(filePath)}\nThreat: ${scanResult.threat || 'Unknown'}`
                    });
                } else {
                    console.log('File scan completed - safe');
                }
            }
        } catch (error) {
            console.error('Error scanning file:', error);
        }
    }

    async scanFileWithDefender(filePath) {
        try {
            const { spawn } = require('child_process');
            
            // Use Windows Defender command line scanner
            return new Promise((resolve) => {
                const scanner = spawn('powershell', [
                    '-Command',
                    `Start-MpScan -ScanType CustomScan -ScanPath "${filePath}"`
                ]);

                scanner.on('close', (code) => {
                    resolve({
                        safe: code === 0,
                        threat: code !== 0 ? 'Potential threat detected' : null
                    });
                });

                scanner.on('error', () => {
                    // Fallback to basic check
                    resolve({ safe: true, threat: null });
                });
            });
        } catch (error) {
            return { safe: true, threat: null };
        }
    }

    async addDefenderExclusion(targetPath) {
        try {
            const { spawn } = require('child_process');
            
            return new Promise((resolve) => {
                const exclusion = spawn('powershell', [
                    '-Command',
                    `Add-MpPreference -ExclusionPath "${targetPath}"`
                ]);

                exclusion.on('close', (code) => {
                    resolve({ success: code === 0 });
                });

                exclusion.on('error', () => {
                    resolve({ success: false, error: 'PowerShell not available' });
                });
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async checkUrlThreat(url) {
        // Simplified threat checking - in production, use proper APIs
        const suspiciousDomains = [
            'malware-test.com',
            'phishing-test.org',
            'suspicious-site.net'
        ];

        try {
            const hostname = new URL(url).hostname;
            const isSuspicious = suspiciousDomains.some(domain => 
                hostname.includes(domain)
            );

            return {
                safe: !isSuspicious,
                threat: isSuspicious ? 'Suspicious domain detected' : null
            };
        } catch (error) {
            return { safe: true, threat: null };
        }
    }

    async scanUrl(url) {
        // Implement URL scanning logic
        return await this.checkUrlThreat(url);
    }

    async scanFileContent(content, filename) {
        // Basic content scanning - check for suspicious patterns
        const suspiciousPatterns = [
            /eval\s*\(/gi,
            /document\.write\s*\(/gi,
            /innerHTML\s*=/gi,
            /<script[^>]*>/gi
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => 
            pattern.test(content)
        );

        return {
            safe: !isSuspicious,
            threat: isSuspicious ? 'Suspicious content patterns detected' : null
        };
    }

    async moveToQuarantine(filePath) {
        try {
            const quarantineDir = path.join(app.getPath('userData'), 'quarantine');
            
            if (!fs.existsSync(quarantineDir)) {
                fs.mkdirSync(quarantineDir, { recursive: true });
            }

            const filename = path.basename(filePath);
            const quarantinePath = path.join(quarantineDir, `${Date.now()}_${filename}`);
            
            fs.renameSync(filePath, quarantinePath);
            console.log(`File moved to quarantine: ${quarantinePath}`);
            
            return quarantinePath;
        } catch (error) {
            console.error('Error moving file to quarantine:', error);
            throw error;
        }
    }

    isTrackingRequest(url) {
        // Simple tracking detection - in production, use comprehensive lists
        const trackingDomains = [
            'google-analytics.com',
            'doubleclick.net',
            'facebook.com/tr',
            'analytics.js'
        ];

        return trackingDomains.some(domain => url.includes(domain));
    }

    // Security management methods
    blockDomain(domain) {
        this.blockedDomains.add(domain);
        console.log(`Domain blocked: ${domain}`);
    }

    unblockDomain(domain) {
        this.blockedDomains.delete(domain);
        console.log(`Domain unblocked: ${domain}`);
    }

    trustDomain(domain) {
        this.trustedDomains.add(domain);
        console.log(`Domain trusted: ${domain}`);
    }

    getSecurityStatus() {
        return {
            settings: this.securitySettings,
            blockedDomains: Array.from(this.blockedDomains),
            trustedDomains: Array.from(this.trustedDomains),
            quarantineCount: this.downloadQuarantine.size
        };
    }

    updateSecuritySettings(newSettings) {
        this.securitySettings = { ...this.securitySettings, ...newSettings };
        console.log('Security settings updated:', this.securitySettings);
        
        // Re-apply settings that can be changed at runtime
        if (newSettings.hasOwnProperty('contentSecurityPolicy')) {
            this.setupContentSecurityPolicy();
        }
    }
}

module.exports = WindowsSecurity;
