const { globalShortcut, dialog, app } = require('electron');

// Enhanced Windows Keyboard Shortcuts Manager
class WindowsShortcuts {
    constructor(mainWindow, tabManager) {
        this.mainWindow = mainWindow;
        this.tabManager = tabManager;
        this.shortcuts = new Map();
        this.setupWindowsShortcuts();
    }

    setupWindowsShortcuts() {
        console.log('Setting up Windows keyboard shortcuts...');

        // Navigation shortcuts
        this.registerShortcut('Ctrl+L', 'focus-address-bar', () => {
            this.mainWindow.webContents.send('focus-address-bar');
        });

        this.registerShortcut('Alt+D', 'focus-address-bar-alt', () => {
            this.mainWindow.webContents.send('focus-address-bar');
        });

        this.registerShortcut('Ctrl+E', 'focus-search', () => {
            this.mainWindow.webContents.send('focus-search');
        });

        // Tab management
        this.registerShortcut('Ctrl+T', 'new-tab', () => {
            const windowId = Array.from(this.tabManager.windows.keys())[0];
            if (windowId) {
                this.tabManager.createTab(windowId, 'about:blank', { active: true });
            }
        });

        this.registerShortcut('Ctrl+Shift+T', 'restore-tab', () => {
            this.mainWindow.webContents.send('restore-closed-tab');
        });

        this.registerShortcut('Ctrl+W', 'close-tab', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            if (activeTabId) {
                this.tabManager.closeTab(activeTabId);
            }
        });

        this.registerShortcut('Ctrl+Shift+W', 'close-window', () => {
            this.mainWindow.close();
        });

        // Tab navigation
        this.registerShortcut('Ctrl+Tab', 'next-tab', () => {
            const windowId = Array.from(this.tabManager.windows.keys())[0];
            if (windowId) {
                this.tabManager.nextTab(windowId);
            }
        });

        this.registerShortcut('Ctrl+Shift+Tab', 'previous-tab', () => {
            const windowId = Array.from(this.tabManager.windows.keys())[0];
            if (windowId) {
                this.tabManager.previousTab(windowId);
            }
        });

        // Numbered tab shortcuts (Ctrl+1-9)
        for (let i = 1; i <= 9; i++) {
            this.registerShortcut(`Ctrl+${i}`, `switch-to-tab-${i}`, () => {
                this.switchToTabByIndex(i - 1);
            });
        }

        // Navigation
        this.registerShortcut('Alt+Left', 'navigate-back', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab && tab.view.webContents.canGoBack()) {
                tab.view.webContents.goBack();
            }
        });

        this.registerShortcut('Alt+Right', 'navigate-forward', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab && tab.view.webContents.canGoForward()) {
                tab.view.webContents.goForward();
            }
        });

        this.registerShortcut('F5', 'refresh', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.reload();
            }
        });

        this.registerShortcut('Ctrl+F5', 'hard-refresh', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.reloadIgnoringCache();
            }
        });

        this.registerShortcut('Ctrl+R', 'refresh-ctrl', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.reload();
            }
        });

        this.registerShortcut('Escape', 'stop-loading', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.stop();
            }
        });

        // Home page
        this.registerShortcut('Alt+Home', 'navigate-home', () => {
            this.mainWindow.webContents.send('navigate-home');
        });

        // Bookmarks
        this.registerShortcut('Ctrl+D', 'bookmark-page', () => {
            this.mainWindow.webContents.send('bookmark-page');
        });

        this.registerShortcut('Ctrl+Shift+B', 'toggle-bookmarks-bar', () => {
            this.mainWindow.webContents.send('toggle-bookmarks-bar');
        });

        this.registerShortcut('Ctrl+Shift+O', 'open-bookmarks-manager', () => {
            this.mainWindow.webContents.send('open-bookmarks-manager');
        });

        // History
        this.registerShortcut('Ctrl+H', 'open-history', () => {
            this.mainWindow.webContents.send('open-history');
        });

        this.registerShortcut('Ctrl+Shift+Delete', 'clear-browsing-data', () => {
            this.mainWindow.webContents.send('clear-browsing-data');
        });

        // Downloads
        this.registerShortcut('Ctrl+J', 'open-downloads', () => {
            this.mainWindow.webContents.send('open-downloads');
        });

        // Find in page
        this.registerShortcut('Ctrl+F', 'find-in-page', () => {
            this.mainWindow.webContents.send('find-in-page');
        });

        this.registerShortcut('F3', 'find-next', () => {
            this.mainWindow.webContents.send('find-next');
        });

        this.registerShortcut('Shift+F3', 'find-previous', () => {
            this.mainWindow.webContents.send('find-previous');
        });

        // Zoom
        this.registerShortcut('Ctrl+Plus', 'zoom-in', () => {
            this.mainWindow.webContents.send('zoom-in');
        });

        this.registerShortcut('Ctrl+-', 'zoom-out', () => {
            this.mainWindow.webContents.send('zoom-out');
        });

        this.registerShortcut('Ctrl+0', 'zoom-reset', () => {
            this.mainWindow.webContents.send('zoom-reset');
        });

        // Full screen
        this.registerShortcut('F11', 'toggle-fullscreen', () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
        });

        // Developer tools
        this.registerShortcut('F12', 'toggle-devtools', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.toggleDevTools();
            }
        });

        this.registerShortcut('Ctrl+Shift+I', 'toggle-devtools-alt', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.toggleDevTools();
            }
        });

        this.registerShortcut('Ctrl+Shift+J', 'open-console', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.openDevTools({ mode: 'bottom' });
            }
        });

        // Window management
        this.registerShortcut('Ctrl+N', 'new-window', () => {
            this.tabManager.createWindow();
        });

        this.registerShortcut('Ctrl+Shift+N', 'new-incognito-window', () => {
            this.mainWindow.webContents.send('new-incognito-window');
        });

        this.registerShortcut('Alt+F4', 'close-window-alt', () => {
            this.mainWindow.close();
        });

        // Application shortcuts
        this.registerShortcut('Ctrl+,', 'open-settings', () => {
            this.mainWindow.webContents.send('open-settings');
        });

        this.registerShortcut('Ctrl+Shift+A', 'open-ai-assistant', () => {
            this.mainWindow.webContents.send('open-ai-assistant');
        });

        this.registerShortcut('Ctrl+Shift+E', 'open-extensions', () => {
            this.mainWindow.webContents.send('open-extensions');
        });

        this.registerShortcut('Ctrl+Shift+P', 'open-password-manager', () => {
            this.mainWindow.webContents.send('open-password-manager');
        });

        // Quick actions
        this.registerShortcut('Ctrl+K', 'quick-command', () => {
            this.mainWindow.webContents.send('open-quick-command');
        });

        this.registerShortcut('Ctrl+Shift+K', 'quick-search', () => {
            this.mainWindow.webContents.send('open-quick-search');
        });

        // Print
        this.registerShortcut('Ctrl+P', 'print-page', () => {
            const activeTabId = this.tabManager.activeTab.values().next().value;
            const tab = this.tabManager.tabs.get(activeTabId);
            if (tab) {
                tab.view.webContents.print();
            }
        });

        // Save page
        this.registerShortcut('Ctrl+S', 'save-page', () => {
            this.mainWindow.webContents.send('save-page');
        });

        // View source
        this.registerShortcut('Ctrl+U', 'view-source', () => {
            this.mainWindow.webContents.send('view-source');
        });

        // Task manager
        this.registerShortcut('Shift+Escape', 'open-task-manager', () => {
            this.mainWindow.webContents.send('open-task-manager');
        });

        // Windows-specific shortcuts
        this.registerShortcut('Ctrl+Shift+C', 'copy-url', () => {
            this.mainWindow.webContents.send('copy-current-url');
        });

        this.registerShortcut('Ctrl+Enter', 'open-in-new-tab', () => {
            this.mainWindow.webContents.send('open-address-in-new-tab');
        });

        this.registerShortcut('Ctrl+Shift+Enter', 'open-in-new-window', () => {
            this.mainWindow.webContents.send('open-address-in-new-window');
        });

        console.log(`Registered ${this.shortcuts.size} keyboard shortcuts`);
    }

    registerShortcut(accelerator, id, callback) {
        try {
            const success = globalShortcut.register(accelerator, callback);
            if (success) {
                this.shortcuts.set(id, { accelerator, callback });
                console.log(`✓ Registered shortcut: ${accelerator} (${id})`);
            } else {
                console.warn(`✗ Failed to register shortcut: ${accelerator} (${id})`);
            }
        } catch (error) {
            console.error(`Error registering shortcut ${accelerator}:`, error);
        }
    }

    switchToTabByIndex(index) {
        const windowId = Array.from(this.tabManager.windows.keys())[0];
        if (!windowId) return;

        const tabOrder = this.tabManager.tabOrder.get(windowId);
        if (tabOrder && tabOrder[index]) {
            this.tabManager.activateTab(tabOrder[index]);
        }
    }

    unregisterAllShortcuts() {
        console.log('Unregistering all keyboard shortcuts...');
        globalShortcut.unregisterAll();
        this.shortcuts.clear();
    }

    // Get list of all registered shortcuts
    getShortcutsList() {
        const shortcutsList = [];
        this.shortcuts.forEach((shortcut, id) => {
            shortcutsList.push({
                id,
                accelerator: shortcut.accelerator,
                description: this.getShortcutDescription(id)
            });
        });
        return shortcutsList;
    }

    getShortcutDescription(id) {
        const descriptions = {
            'focus-address-bar': 'Focus address bar',
            'focus-search': 'Focus search box',
            'new-tab': 'New tab',
            'restore-tab': 'Restore closed tab',
            'close-tab': 'Close current tab',
            'close-window': 'Close window',
            'next-tab': 'Switch to next tab',
            'previous-tab': 'Switch to previous tab',
            'navigate-back': 'Go back',
            'navigate-forward': 'Go forward',
            'refresh': 'Refresh page',
            'hard-refresh': 'Hard refresh (ignore cache)',
            'stop-loading': 'Stop loading',
            'navigate-home': 'Go to home page',
            'bookmark-page': 'Bookmark current page',
            'toggle-bookmarks-bar': 'Toggle bookmarks bar',
            'open-bookmarks-manager': 'Open bookmarks manager',
            'open-history': 'Open history',
            'clear-browsing-data': 'Clear browsing data',
            'open-downloads': 'Open downloads',
            'find-in-page': 'Find in page',
            'find-next': 'Find next',
            'find-previous': 'Find previous',
            'zoom-in': 'Zoom in',
            'zoom-out': 'Zoom out',
            'zoom-reset': 'Reset zoom',
            'toggle-fullscreen': 'Toggle fullscreen',
            'toggle-devtools': 'Toggle developer tools',
            'open-console': 'Open console',
            'new-window': 'New window',
            'new-incognito-window': 'New incognito window',
            'open-settings': 'Open settings',
            'open-ai-assistant': 'Open AI assistant',
            'open-extensions': 'Open extensions',
            'open-password-manager': 'Open password manager',
            'quick-command': 'Quick command',
            'quick-search': 'Quick search',
            'print-page': 'Print page',
            'save-page': 'Save page',
            'view-source': 'View page source',
            'open-task-manager': 'Open task manager',
            'copy-url': 'Copy current URL',
            'open-in-new-tab': 'Open in new tab',
            'open-in-new-window': 'Open in new window'
        };

        return descriptions[id] || id;
    }

    // Show shortcuts help dialog
    showShortcutsHelp() {
        const shortcuts = this.getShortcutsList();
        let helpText = 'MadEasy Browser - Keyboard Shortcuts\n\n';
        
        shortcuts.forEach(shortcut => {
            helpText += `${shortcut.accelerator.padEnd(20)} - ${shortcut.description}\n`;
        });

        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'MadEasy Browser Shortcuts',
            detail: helpText,
            buttons: ['OK']
        });
    }
}

module.exports = WindowsShortcuts;
