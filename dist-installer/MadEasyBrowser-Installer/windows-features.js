const { app, BrowserWindow, Menu, shell, dialog, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

class WindowsFeatures {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.setupWindowsSpecificFeatures();
    }

    setupWindowsSpecificFeatures() {
        // Windows-specific optimizations
        this.enableWindowsAcceleration();
        this.setupWindowsNotifications();
        this.setupWindowsFileAssociations();
        this.setupWindowsJumpList();
        this.setupWindowsTaskbar();
        this.setupWindowsContextMenu();
        this.setupWindowsRegistry();
        this.setupUACIntegration();
        this.setupDefenderIntegration();
        this.setupWindowsSearch();
    }

    enableWindowsAcceleration() {
        if (process.platform === 'win32') {
            // Enable hardware acceleration for better performance
            app.commandLine.appendSwitch('enable-gpu-rasterization');
            app.commandLine.appendSwitch('enable-zero-copy');
            app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
            
            // Optimize for Windows 10/11
            if (os.release().startsWith('10.')) {
                app.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion');
            }
        }
    }

    setupWindowsNotifications() {
        if (process.platform === 'win32') {
            // Set up Windows notifications
            app.setAppUserModelId('com.madeasy.browser');
            
            // Handle notification clicks
            ipcMain.handle('show-notification', (event, { title, body, icon }) => {
                if (Notification.isSupported()) {
                    const notification = new Notification({
                        title: title || 'MadEasy Browser',
                        body: body || 'Notification from browser',
                        icon: icon || path.join(__dirname, 'attached_assets/icon.png'),
                        urgency: 'normal'
                    });
                    
                    notification.on('click', () => {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    });
                    
                    notification.show();
                    return { success: true };
                }
                return { success: false, error: 'Notifications not supported' };
            });
        }
    }

    setupWindowsFileAssociations() {
        if (process.platform === 'win32' && !app.isPackaged) {
            // Set default protocol handler for development
            app.setAsDefaultProtocolClient('madeasy-browser');
        }

        // Handle protocol URLs
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, focus our window
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.focus();
                
                // Handle protocol URL if present
                const url = commandLine.find(arg => arg.startsWith('madeasy-browser://'));
                if (url) {
                    this.handleProtocolUrl(url);
                }
            }
        });
    }

    setupWindowsJumpList() {
        if (process.platform === 'win32') {
            const jumpList = [
                {
                    type: 'custom',
                    name: 'Quick Actions',
                    items: [
                        {
                            type: 'task',
                            title: 'New Window',
                            description: 'Open a new browser window',
                            program: process.execPath,
                            args: '--new-window',
                            iconPath: process.execPath,
                            iconIndex: 0
                        },
                        {
                            type: 'task',
                            title: 'Incognito Window',
                            description: 'Open a new incognito window',
                            program: process.execPath,
                            args: '--incognito',
                            iconPath: process.execPath,
                            iconIndex: 0
                        },
                        {
                            type: 'task',
                            title: 'AI Chat',
                            description: 'Open AI Chat directly',
                            program: process.execPath,
                            args: '--ai-chat',
                            iconPath: process.execPath,
                            iconIndex: 0
                        }
                    ]
                },
                {
                    type: 'recent',
                    items: [
                        {
                            type: 'file',
                            path: 'https://google.com',
                            title: 'Google'
                        },
                        {
                            type: 'file',
                            path: 'https://github.com',
                            title: 'GitHub'
                        }
                    ]
                }
            ];
            
            app.setJumpList(jumpList);
        }
    }

    setupWindowsTaskbar() {
        if (process.platform === 'win32') {
            // Set taskbar progress
            ipcMain.handle('set-taskbar-progress', (event, progress) => {
                if (progress === -1) {
                    this.mainWindow.setProgressBar(-1); // Remove progress
                } else {
                    this.mainWindow.setProgressBar(Math.min(Math.max(progress, 0), 1));
                }
                return { success: true };
            });

            // Set taskbar overlay icon
            ipcMain.handle('set-taskbar-overlay', (event, { iconPath, description }) => {
                if (iconPath) {
                    this.mainWindow.setOverlayIcon(iconPath, description || '');
                } else {
                    this.mainWindow.setOverlayIcon(null, '');
                }
                return { success: true };
            });

            // Flash window frame
            ipcMain.handle('flash-window', (event, { flash }) => {
                this.mainWindow.flashFrame(flash);
                return { success: true };
            });
        }
    }

    setupWindowsContextMenu() {
        if (process.platform === 'win32') {
            // Set up Windows context menu
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: 'Open MadEasy Browser',
                    click: () => {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    }
                },
                {
                    label: 'New Window',
                    click: () => {
                        this.createNewWindow();
                    }
                },
                {
                    label: 'Incognito Window',
                    click: () => {
                        this.createIncognitoWindow();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Downloads',
                    click: () => {
                        shell.openPath(app.getPath('downloads'));
                    }
                },
                {
                    label: 'Settings',
                    click: () => {
                        this.mainWindow.webContents.send('open-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    click: () => {
                        app.quit();
                    }
                }
            ]);

            // Set app context menu
            this.mainWindow.on('show', () => {
                Menu.setApplicationMenu(contextMenu);
            });
        }
    }

    handleProtocolUrl(url) {
        // Handle madeasy-browser:// URLs
        const urlParts = url.replace('madeasy-browser://', '');
        this.mainWindow.webContents.send('handle-protocol', urlParts);
    }

    createNewWindow() {
        const newWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: true,
                preload: path.join(__dirname, 'electron/preload.js')
            },
            icon: path.join(__dirname, 'attached_assets/icon.png')
        });

        newWindow.loadURL('http://localhost:5000');
        return newWindow;
    }

    createIncognitoWindow() {
        const incognitoWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: true,
                partition: 'persist:incognito',
                preload: path.join(__dirname, 'electron/preload.js')
            },
            icon: path.join(__dirname, 'attached_assets/icon.png'),
            backgroundColor: '#2a2a2a'
        });

        incognitoWindow.loadURL('http://localhost:5000?mode=incognito');
        return incognitoWindow;
    }

    // Windows-specific IPC handlers
    setupWindowsIPC() {
        // Windows registry operations
        ipcMain.handle('windows:set-as-default-browser', async () => {
            if (process.platform === 'win32') {
                try {
                    app.setAsDefaultProtocolClient('http');
                    app.setAsDefaultProtocolClient('https');
                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'Not on Windows' };
        });

        // Windows shell integration
        ipcMain.handle('windows:add-to-startup', async () => {
            if (process.platform === 'win32') {
                try {
                    app.setLoginItemSettings({
                        openAtLogin: true,
                        path: process.execPath,
                        args: ['--startup']
                    });
                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'Not on Windows' };
        });

        // Windows file operations
        ipcMain.handle('windows:show-in-explorer', async (event, { path }) => {
            if (process.platform === 'win32') {
                shell.showItemInFolder(path);
                return { success: true };
            }
            return { success: false, error: 'Not on Windows' };
        });

        // Windows power management
        ipcMain.handle('windows:prevent-sleep', async (event, { prevent }) => {
            if (process.platform === 'win32') {
                if (prevent) {
                    require('powerSaveBlocker').start('prevent-display-sleep');
                } else {
                    require('powerSaveBlocker').stop();
                }
                return { success: true };
            }
            return { success: false, error: 'Not on Windows' };
        });
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        if (process.platform === 'win32') {
            setInterval(() => {
                const memoryUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();
                
                // Send performance data to renderer
                this.mainWindow.webContents.send('performance-update', {
                    memory: {
                        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
                    },
                    cpu: {
                        user: cpuUsage.user,
                        system: cpuUsage.system
                    }
                });
            }, 5000); // Every 5 seconds
        }
    }

    // Windows theme integration
    setupThemeIntegration() {
        if (process.platform === 'win32') {
            const { nativeTheme } = require('electron');
            
            // Listen for theme changes
            nativeTheme.on('updated', () => {
                const isDark = nativeTheme.shouldUseDarkColors;
                this.mainWindow.webContents.send('theme-changed', { 
                    isDark,
                    theme: isDark ? 'dark' : 'light',
                    accentColor: this.getWindowsAccentColor()
                });
            });

            // Send initial theme
            this.mainWindow.webContents.once('dom-ready', () => {
                const isDark = nativeTheme.shouldUseDarkColors;
                this.mainWindow.webContents.send('theme-changed', { 
                    isDark,
                    theme: isDark ? 'dark' : 'light',
                    accentColor: this.getWindowsAccentColor()
                });
            });
        }
    }

    // Get Windows accent color
    getWindowsAccentColor() {
        if (process.platform === 'win32') {
            try {
                const { systemPreferences } = require('electron');
                return systemPreferences.getAccentColor();
            } catch (error) {
                return '#0078d4'; // Default Windows blue
            }
        }
        return '#0078d4';
    }

    // Enhanced Windows registry integration
    setupWindowsRegistry() {
        if (process.platform === 'win32') {
            try {
                const Registry = require('winreg');
                
                // Create registry key for browser
                const regKey = new Registry({
                    hive: Registry.HKCU,
                    key: '\\Software\\MadEasy\\Browser'
                });

                // Set default values
                regKey.set('Version', Registry.REG_SZ, '3.0.0', (err) => {
                    if (!err) console.log('Registry entry created');
                });

                // Set as default browser handler
                const protocolKey = new Registry({
                    hive: Registry.HKCU,
                    key: '\\Software\\Classes\\http\\shell\\open\\command'
                });

            } catch (error) {
                console.log('Registry operations require elevated permissions');
            }
        }
    }

    // Windows UAC integration
    setupUACIntegration() {
        if (process.platform === 'win32') {
            // Handle UAC prompts for browser operations
            ipcMain.handle('windows:request-admin', async (event, { operation }) => {
                try {
                    const { spawn } = require('child_process');
                    const path = require('path');
                    
                    // Create elevated process for admin operations
                    const elevatedProcess = spawn('powershell', [
                        '-Command', 
                        'Start-Process', 
                        'powershell', 
                        '-Verb', 'runAs', 
                        '-ArgumentList', `"${operation}"`
                    ]);

                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
        }
    }

    // Windows Defender integration
    setupDefenderIntegration() {
        if (process.platform === 'win32') {
            // Add browser to Windows Defender exclusions if needed
            ipcMain.handle('windows:add-defender-exclusion', async () => {
                try {
                    const { spawn } = require('child_process');
                    const appPath = process.execPath;
                    
                    const powerShellCommand = `Add-MpPreference -ExclusionPath "${appPath}"`;
                    
                    const result = spawn('powershell', ['-Command', powerShellCommand], {
                        stdio: 'inherit'
                    });

                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
        }
    }

    // Windows search integration
    setupWindowsSearch() {
        if (process.platform === 'win32') {
            // Register browser for Windows search
            ipcMain.handle('windows:register-search', async () => {
                try {
                    // Add browser to Windows search index
                    const searchProtocol = 'madeasy-search';
                    app.setAsDefaultProtocolClient(searchProtocol);
                    
                    return { success: true };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
        }
    }
}

module.exports = WindowsFeatures;
