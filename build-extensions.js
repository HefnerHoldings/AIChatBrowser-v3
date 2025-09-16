const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🌐 Building MadEasy Browser Extensions...\n');

// Configuration for different browsers
const extensionConfigs = {
    chrome: {
        name: 'Chrome Extension',
        manifestVersion: 3,
        outputDir: 'dist-extensions/chrome',
        zipName: 'madeasy-browser-chrome.zip'
    },
    firefox: {
        name: 'Firefox Add-on',
        manifestVersion: 2,
        outputDir: 'dist-extensions/firefox',
        zipName: 'madeasy-browser-firefox.zip'
    },
    edge: {
        name: 'Edge Extension',
        manifestVersion: 3,
        outputDir: 'dist-extensions/edge',
        zipName: 'madeasy-browser-edge.zip'
    },
    safari: {
        name: 'Safari Extension',
        manifestVersion: 2,
        outputDir: 'dist-extensions/safari',
        zipName: 'madeasy-browser-safari.zip'
    }
};

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

// Create Firefox manifest (Manifest V2)
function createFirefoxManifest() {
    return {
        manifest_version: 2,
        name: "MadEasy Browser Extension",
        version: "3.0.0",
        description: "AI-powered web browsing assistant that enhances your browsing experience",
        author: "HefnerHoldings",
        
        permissions: [
            "activeTab",
            "storage",
            "tabs",
            "contextMenus",
            "notifications",
            "bookmarks",
            "history",
            "http://*/*",
            "https://*/*"
        ],
        
        background: {
            scripts: ["background.js"],
            persistent: false
        },
        
        content_scripts: [
            {
                matches: ["<all_urls>"],
                js: ["content.js"],
                css: ["content.css"],
                run_at: "document_end"
            }
        ],
        
        browser_action: {
            default_popup: "popup.html",
            default_title: "MadEasy Browser Assistant",
            default_icon: {
                "16": "icons/icon16.png",
                "32": "icons/icon32.png",
                "48": "icons/icon48.png",
                "128": "icons/icon128.png"
            }
        },
        
        icons: {
            "16": "icons/icon16.png",
            "32": "icons/icon32.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
        },
        
        options_ui: {
            page: "options.html",
            open_in_tab: true
        },
        
        web_accessible_resources: ["injected.js", "styles/*", "icons/*"],
        
        commands: {
            "toggle_assistant": {
                suggested_key: {
                    default: "Ctrl+Shift+A",
                    mac: "Command+Shift+A"
                },
                description: "Toggle MadEasy Assistant"
            },
            "quick_search": {
                suggested_key: {
                    default: "Ctrl+Shift+S",
                    mac: "Command+Shift+S"
                },
                description: "Quick AI Search"
            }
        }
    };
}

// Create Safari manifest
function createSafariManifest() {
    const firefoxManifest = createFirefoxManifest();
    // Safari uses similar structure to Firefox but with some differences
    return {
        ...firefoxManifest,
        browser_specific_settings: {
            safari: {
                strict_min_version: "14.0"
            }
        }
    };
}

// Build extension for specific browser
async function buildExtension(browser) {
    const config = extensionConfigs[browser];
    log(`📦 Building ${config.name}...`, 'blue');
    
    try {
        // Create output directory
        const outputDir = path.join(__dirname, config.outputDir);
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true });
        }
        fs.mkdirSync(outputDir, { recursive: true });
        
        // Copy base files from Chrome extension
        const sourceDir = path.join(__dirname, 'browser-extensions', 'chrome');
        const filesToCopy = [
            'background.js',
            'content.js',
            'content.css',
            'popup.html',
            'popup.js',
            'options.html',
            'options.js',
            'injected.js'
        ];
        
        // Copy files
        filesToCopy.forEach(file => {
            const sourcePath = path.join(sourceDir, file);
            const destPath = path.join(outputDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
            } else {
                // Create placeholder file
                fs.writeFileSync(destPath, `// ${file} - Placeholder for ${browser}`);
            }
        });
        
        // Copy icons directory
        const iconsSourceDir = path.join(sourceDir, 'icons');
        const iconsDestDir = path.join(outputDir, 'icons');
        
        if (fs.existsSync(iconsSourceDir)) {
            fs.mkdirSync(iconsDestDir, { recursive: true });
            const iconFiles = fs.readdirSync(iconsSourceDir);
            iconFiles.forEach(iconFile => {
                fs.copyFileSync(
                    path.join(iconsSourceDir, iconFile),
                    path.join(iconsDestDir, iconFile)
                );
            });
        } else {
            // Create placeholder icons directory
            fs.mkdirSync(iconsDestDir, { recursive: true });
            const iconSizes = [16, 32, 48, 128];
            iconSizes.forEach(size => {
                fs.writeFileSync(
                    path.join(iconsDestDir, `icon${size}.png`),
                    `// Placeholder icon ${size}x${size}`
                );
            });
        }
        
        // Create browser-specific manifest
        let manifest;
        switch (browser) {
            case 'chrome':
            case 'edge':
                // Use existing Chrome manifest
                const chromeManifestPath = path.join(sourceDir, 'manifest.json');
                if (fs.existsSync(chromeManifestPath)) {
                    manifest = JSON.parse(fs.readFileSync(chromeManifestPath, 'utf8'));
                } else {
                    manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'browser-extensions', 'chrome', 'manifest.json'), 'utf8'));
                }
                break;
                
            case 'firefox':
                manifest = createFirefoxManifest();
                break;
                
            case 'safari':
                manifest = createSafariManifest();
                break;
        }
        
        // Write manifest
        fs.writeFileSync(
            path.join(outputDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Create ZIP package
        const zipPath = path.join(__dirname, 'dist-extensions', config.zipName);
        await createZipPackage(outputDir, zipPath);
        
        log(`✅ ${config.name} built successfully`, 'green');
        
        return {
            browser,
            success: true,
            outputDir,
            zipPath
        };
        
    } catch (error) {
        log(`❌ ${config.name} build failed: ${error.message}`, 'red');
        return {
            browser,
            success: false,
            error: error.message
        };
    }
}

// Create ZIP package
async function createZipPackage(sourceDir, zipPath) {
    try {
        // Use built-in zip functionality or external tool
        if (process.platform === 'win32') {
            // Windows: Use PowerShell
            const psCommand = `Compress-Archive -Path "${sourceDir}\\*" -DestinationPath "${zipPath}" -Force`;
            execSync(`powershell -Command "${psCommand}"`, { stdio: 'pipe' });
        } else {
            // Unix: Use zip command
            execSync(`cd "${path.dirname(sourceDir)}" && zip -r "${zipPath}" "${path.basename(sourceDir)}"`, { stdio: 'pipe' });
        }
    } catch (error) {
        // Fallback: Manual zip creation (simplified)
        log(`⚠️  ZIP creation failed, files available in directory`, 'yellow');
    }
}

// Create missing extension files
function createExtensionFiles() {
    const extensionsDir = path.join(__dirname, 'browser-extensions', 'chrome');
    
    // Create popup.html
    if (!fs.existsSync(path.join(extensionsDir, 'popup.html'))) {
        const popupHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { width: 350px; padding: 20px; font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 20px; }
        .logo { width: 48px; height: 48px; margin: 0 auto 10px; }
        .actions { display: flex; flex-direction: column; gap: 10px; }
        .btn { padding: 10px; border: none; border-radius: 5px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🤖</div>
        <h3>MadEasy Browser</h3>
    </div>
    <div class="actions">
        <button class="btn btn-primary" id="openAssistant">Open AI Assistant</button>
        <button class="btn btn-secondary" id="quickSearch">Quick Search</button>
        <button class="btn btn-secondary" id="summarizePage">Summarize Page</button>
        <button class="btn btn-secondary" id="openOptions">Settings</button>
    </div>
    <script src="popup.js"></script>
</body>
</html>`;
        fs.writeFileSync(path.join(extensionsDir, 'popup.html'), popupHtml);
    }
    
    // Create popup.js
    if (!fs.existsSync(path.join(extensionsDir, 'popup.js'))) {
        const popupJs = `// MadEasy Browser Extension - Popup Script
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('openAssistant').onclick = function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'OPEN_ASSISTANT'});
            window.close();
        });
    };
    
    document.getElementById('quickSearch').onclick = function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'QUICK_SEARCH'});
            window.close();
        });
    };
    
    document.getElementById('summarizePage').onclick = function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: 'SUMMARIZE_PAGE'});
            window.close();
        });
    };
    
    document.getElementById('openOptions').onclick = function() {
        chrome.runtime.openOptionsPage();
    };
});`;
        fs.writeFileSync(path.join(extensionsDir, 'popup.js'), popupJs);
    }
    
    // Create content.js
    if (!fs.existsSync(path.join(extensionsDir, 'content.js'))) {
        const contentJs = `// MadEasy Browser Extension - Content Script
console.log('MadEasy Browser Extension loaded');

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
        case 'OPEN_ASSISTANT':
            openAssistant();
            break;
        case 'QUICK_SEARCH':
            openQuickSearch();
            break;
        case 'SUMMARIZE_PAGE':
            summarizePage();
            break;
    }
});

function openAssistant() {
    // Implementation handled by background script injection
    console.log('Opening AI Assistant...');
}

function openQuickSearch() {
    const query = prompt('Enter your search query:');
    if (query) {
        chrome.runtime.sendMessage({
            type: 'AI_QUERY',
            data: { query: query, context: window.location.href }
        });
    }
}

function summarizePage() {
    const pageData = {
        title: document.title,
        content: document.body.innerText.substring(0, 5000),
        url: window.location.href
    };
    
    chrome.runtime.sendMessage({
        type: 'AI_QUERY',
        data: { action: 'summarize', ...pageData }
    });
}`;
        fs.writeFileSync(path.join(extensionsDir, 'content.js'), contentJs);
    }
    
    // Create content.css
    if (!fs.existsSync(path.join(extensionsDir, 'content.css'))) {
        const contentCss = `/* MadEasy Browser Extension - Content Styles */
.madeasy-highlight {
    background-color: #ffeb3b !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
}

.madeasy-assistant-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: rgba(0, 0, 0, 0.5) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}`;
        fs.writeFileSync(path.join(extensionsDir, 'content.css'), contentCss);
    }
    
    // Create options.html
    if (!fs.existsSync(path.join(extensionsDir, 'options.html'))) {
        const optionsHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MadEasy Browser Extension - Settings</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .setting { margin-bottom: 20px; }
        .setting label { display: block; margin-bottom: 5px; font-weight: bold; }
        .setting input, .setting select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MadEasy Browser Extension Settings</h1>
    </div>
    
    <div class="setting">
        <label for="enabled">Enable Extension</label>
        <input type="checkbox" id="enabled" checked>
    </div>
    
    <div class="setting">
        <label for="aiAssistant">AI Assistant</label>
        <input type="checkbox" id="aiAssistant" checked>
    </div>
    
    <div class="setting">
        <label for="quickSearch">Quick Search</label>
        <input type="checkbox" id="quickSearch" checked>
    </div>
    
    <div class="setting">
        <label for="theme">Theme</label>
        <select id="theme">
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </div>
    
    <button class="btn" id="save">Save Settings</button>
    
    <script src="options.js"></script>
</body>
</html>`;
        fs.writeFileSync(path.join(extensionsDir, 'options.html'), optionsHtml);
    }
    
    // Create options.js
    if (!fs.existsSync(path.join(extensionsDir, 'options.js'))) {
        const optionsJs = `// MadEasy Browser Extension - Options Script
document.addEventListener('DOMContentLoaded', function() {
    // Load saved settings
    chrome.storage.sync.get({
        enabled: true,
        aiAssistant: true,
        quickSearch: true,
        theme: 'auto'
    }, function(items) {
        document.getElementById('enabled').checked = items.enabled;
        document.getElementById('aiAssistant').checked = items.aiAssistant;
        document.getElementById('quickSearch').checked = items.quickSearch;
        document.getElementById('theme').value = items.theme;
    });
    
    // Save settings
    document.getElementById('save').onclick = function() {
        const settings = {
            enabled: document.getElementById('enabled').checked,
            aiAssistant: document.getElementById('aiAssistant').checked,
            quickSearch: document.getElementById('quickSearch').checked,
            theme: document.getElementById('theme').value
        };
        
        chrome.storage.sync.set(settings, function() {
            // Show saved message
            const btn = document.getElementById('save');
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.background = '#28a745';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#007bff';
            }, 2000);
        });
    };
});`;
        fs.writeFileSync(path.join(extensionsDir, 'options.js'), optionsJs);
    }
    
    // Create injected.js
    if (!fs.existsSync(path.join(extensionsDir, 'injected.js'))) {
        const injectedJs = `// MadEasy Browser Extension - Injected Script
(function() {
    'use strict';
    
    console.log('MadEasy Browser Extension injected script loaded');
    
    // Add extension functionality to page
    window.MadEasyBrowser = {
        version: '3.0.0',
        openAssistant: function() {
            window.postMessage({ type: 'MADEASY_OPEN_ASSISTANT' }, '*');
        },
        quickSearch: function(query) {
            window.postMessage({ type: 'MADEASY_QUICK_SEARCH', query: query }, '*');
        }
    };
    
    // Listen for messages from content script
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;
        
        switch(event.data.type) {
            case 'MADEASY_OPEN_ASSISTANT':
                // Handle assistant opening
                break;
            case 'MADEASY_QUICK_SEARCH':
                // Handle quick search
                break;
        }
    });
})();`;
        fs.writeFileSync(path.join(extensionsDir, 'injected.js'), injectedJs);
    }
}

// Main build process
async function buildAllExtensions() {
    try {
        log('🚀 Starting browser extensions build process...', 'blue');
        console.log('');
        
        // Create missing extension files
        createExtensionFiles();
        
        // Create output directory
        const distDir = path.join(__dirname, 'dist-extensions');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Build extensions for each browser
        const results = [];
        for (const browser of Object.keys(extensionConfigs)) {
            const result = await buildExtension(browser);
            results.push(result);
        }
        
        // Display summary
        console.log('');
        log('🎉 Browser Extensions Build Summary', 'green');
        log('====================================', 'green');
        
        results.forEach(result => {
            const config = extensionConfigs[result.browser];
            if (result.success) {
                log(`✅ ${config.name}: Built successfully`, 'green');
                if (result.zipPath && fs.existsSync(result.zipPath)) {
                    const stats = fs.statSync(result.zipPath);
                    const size = (stats.size / 1024).toFixed(1);
                    console.log(`   📦 Package: ${result.zipPath} (${size} KB)`);
                }
            } else {
                log(`❌ ${config.name}: ${result.error}`, 'red');
            }
        });
        
        console.log('');
        log('📋 Distribution Instructions:', 'blue');
        log('   • Chrome: Upload to Chrome Web Store', 'blue');
        log('   • Firefox: Upload to Firefox Add-ons', 'blue');
        log('   • Edge: Upload to Microsoft Edge Add-ons', 'blue');
        log('   • Safari: Convert to Safari App Extension', 'blue');
        
        console.log('');
        log('✅ Browser extensions build completed!', 'green');
        
    } catch (error) {
        log('❌ Browser extensions build failed:', 'red');
        console.error(error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    buildAllExtensions();
}

module.exports = { buildAllExtensions, buildExtension };
