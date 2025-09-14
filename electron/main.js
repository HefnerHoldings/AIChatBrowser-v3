const { 
  app, 
  BrowserWindow, 
  session, 
  ipcMain, 
  Menu, 
  protocol, 
  net, 
  webContents,
  shell,
  dialog,
  Tray,
  nativeImage,
  globalShortcut,
  systemPreferences,
  powerMonitor,
  crashReporter,
  BrowserView,
  clipboard,
  screen,
  desktopCapturer,
  Notification
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const crypto = require('crypto');
const TabManager = require('./tab-manager');
const AutoUpdaterManager = require('./auto-updater');
const WindowsFeatures = require('../windows-features');
const WindowsShortcuts = require('../windows-shortcuts');
const WindowsPerformance = require('../windows-performance');
const WindowsSecurity = require('../windows-security');
const WindowsNotifications = require('../windows-notifications');

// Global references
let mainWindow;
let tray = null;
let windows = new Map();
let downloadItems = new Map();
let isDev = process.env.NODE_ENV === 'development';

// Initialize managers
const tabManager = new TabManager();
const autoUpdaterManager = new AutoUpdaterManager();
let windowsFeatures;
let windowsShortcuts;
let windowsPerformance;
let windowsSecurity;
let windowsNotifications;

// Security settings
const CORS_BYPASS_ENABLED = isDev; // Only enable in development by default
const corsEnabledSessions = new Set();

// Enable crash reporting
crashReporter.start({
  submitURL: 'https://madeasy.ai/crash-reports',
  productName: 'MadEasy Browser',
  uploadToServer: false
});

// Setup all IPC handlers
function setupIpcHandlers() {
  // Browser navigation handlers
  ipcMain.handle('browser:navigate', async (event, { url, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      await tab.view.webContents.loadURL(url);
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:back', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      if (tab.view.webContents.canGoBack()) {
        tab.view.webContents.goBack();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:forward', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      if (tab.view.webContents.canGoForward()) {
        tab.view.webContents.goForward();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:refresh', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      tab.view.webContents.reload();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:stop', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      tab.view.webContents.stop();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:getInfo', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      return {
        url: tab.view.webContents.getURL(),
        title: tab.view.webContents.getTitle(),
        canGoBack: tab.view.webContents.canGoBack(),
        canGoForward: tab.view.webContents.canGoForward(),
        isLoading: tab.view.webContents.isLoading()
      };
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle('browser:executeJS', async (event, { code, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      const result = await tab.view.webContents.executeJavaScript(code);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('browser:screenshot', async (event, { tabId, fullPage }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      const image = await tab.view.webContents.capturePage();
      const buffer = image.toPNG();
      return { success: true, data: buffer.toString('base64') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Tab management handlers
  ipcMain.handle('tabs:create', async (event, { url }) => {
    try {
      const windowId = Array.from(windows.keys())[0] || 'main';
      const tabId = tabManager.createTab(windowId, url || 'about:blank', { active: true });
      return { success: true, tabId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:close', async (event, { tabId }) => {
    try {
      tabManager.closeTab(tabId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:switch', async (event, { tabId }) => {
    try {
      tabManager.activateTab(tabId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:getAll', async () => {
    try {
      const tabs = [];
      tabManager.tabs.forEach((tab, id) => {
        tabs.push({
          id: id,
          windowId: tab.windowId,
          url: tab.url,
          title: tab.title,
          favicon: tab.favicon,
          isLoading: tab.isLoading,
          isPinned: tab.isPinned,
          isActive: tabManager.activeTab.get(tab.windowId) === id
        });
      });
      return tabs;
    } catch (error) {
      return [];
    }
  });

  ipcMain.handle('tabs:duplicate', async (event, { tabId }) => {
    try {
      const newTabId = tabManager.duplicateTab(tabId);
      return { success: true, tabId: newTabId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:move', async (event, { tabId, index }) => {
    try {
      tabManager.moveTab(tabId, index);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:pin', async (event, { tabId }) => {
    try {
      tabManager.pinTab(tabId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('tabs:unpin', async (event, { tabId }) => {
    try {
      tabManager.unpinTab(tabId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Window management handlers
  ipcMain.handle('windows:create', async (event, options) => {
    try {
      const { windowId, window } = tabManager.createWindow(options);
      windows.set(windowId, window);
      return { success: true, windowId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('windows:close', async (event, { windowId }) => {
    try {
      const window = windows.get(windowId);
      if (window) window.close();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('windows:minimize', async () => {
    if (mainWindow) mainWindow.minimize();
    return { success: true };
  });

  ipcMain.handle('windows:maximize', async () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    return { success: true };
  });

  ipcMain.handle('windows:restore', async () => {
    if (mainWindow) mainWindow.restore();
    return { success: true };
  });

  ipcMain.handle('windows:fullscreen', async (event, { enable }) => {
    if (mainWindow) mainWindow.setFullScreen(enable);
    return { success: true };
  });

  ipcMain.handle('windows:focus', async (event, { windowId }) => {
    const window = windows.get(windowId);
    if (window) window.focus();
    return { success: true };
  });

  ipcMain.handle('windows:getAll', async () => {
    const allWindows = [];
    windows.forEach((window, id) => {
      allWindows.push({
        id: id,
        title: window.getTitle(),
        isFocused: window.isFocused(),
        isMinimized: window.isMinimized(),
        isMaximized: window.isMaximized()
      });
    });
    return allWindows;
  });

  ipcMain.handle('windows:moveTabToWindow', async (event, { tabId, windowId }) => {
    try {
      tabManager.moveTabToWindow(tabId, windowId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // CORS-free fetch handlers
  ipcMain.handle('fetch-without-cors', async (event, url, options = {}) => {
    try {
      const response = await net.fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'User-Agent': 'MadEasy Browser/3.0'
        }
      });
      const data = await response.text();
      return {
        success: true,
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fetch-proxy', async (event, url, options = {}) => {
    // Same as fetch-without-cors for now
    return ipcMain._handlers.get('fetch-without-cors')(event, url, options);
  });

  // Download management handlers
  ipcMain.handle('downloads:start', async (event, { url, options }) => {
    try {
      const downloadId = crypto.randomBytes(8).toString('hex');
      session.defaultSession.downloadURL(url);
      return { success: true, downloadId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('downloads:pause', async (event, { downloadId }) => {
    const item = downloadItems.get(downloadId);
    if (item && item.canResume()) {
      item.pause();
      return { success: true };
    }
    return { success: false, error: 'Cannot pause download' };
  });

  ipcMain.handle('downloads:resume', async (event, { downloadId }) => {
    const item = downloadItems.get(downloadId);
    if (item && item.isPaused()) {
      item.resume();
      return { success: true };
    }
    return { success: false, error: 'Cannot resume download' };
  });

  ipcMain.handle('downloads:cancel', async (event, { downloadId }) => {
    const item = downloadItems.get(downloadId);
    if (item) {
      item.cancel();
      downloadItems.delete(downloadId);
      return { success: true };
    }
    return { success: false, error: 'Download not found' };
  });

  ipcMain.handle('downloads:getAll', async () => {
    const downloads = [];
    downloadItems.forEach((item, id) => {
      downloads.push({
        id: id,
        filename: item.getFilename(),
        url: item.getURL(),
        totalBytes: item.getTotalBytes(),
        receivedBytes: item.getReceivedBytes(),
        isPaused: item.isPaused(),
        canResume: item.canResume(),
        state: item.getState()
      });
    });
    return downloads;
  });

  ipcMain.handle('downloads:openFile', async (event, { downloadId }) => {
    const item = downloadItems.get(downloadId);
    if (item && item.getState() === 'completed') {
      shell.openPath(item.getSavePath());
      return { success: true };
    }
    return { success: false, error: 'File not found or download not complete' };
  });

  ipcMain.handle('downloads:showInFolder', async (event, { downloadId }) => {
    const item = downloadItems.get(downloadId);
    if (item) {
      shell.showItemInFolder(item.getSavePath());
      return { success: true };
    }
    return { success: false, error: 'Download not found' };
  });

  ipcMain.handle('downloads:clear', async () => {
    downloadItems.clear();
    return { success: true };
  });

  // Bookmarks handlers (simplified - store in memory for now)
  const bookmarks = new Map();
  
  ipcMain.handle('bookmarks:add', async (event, bookmark) => {
    const id = crypto.randomBytes(8).toString('hex');
    bookmarks.set(id, { ...bookmark, id, createdAt: Date.now() });
    return { success: true, id };
  });

  ipcMain.handle('bookmarks:remove', async (event, { bookmarkId }) => {
    bookmarks.delete(bookmarkId);
    return { success: true };
  });

  ipcMain.handle('bookmarks:update', async (event, { bookmarkId, updates }) => {
    const bookmark = bookmarks.get(bookmarkId);
    if (bookmark) {
      bookmarks.set(bookmarkId, { ...bookmark, ...updates });
      return { success: true };
    }
    return { success: false, error: 'Bookmark not found' };
  });

  ipcMain.handle('bookmarks:getAll', async () => {
    return Array.from(bookmarks.values());
  });

  ipcMain.handle('bookmarks:search', async (event, { query }) => {
    const results = [];
    bookmarks.forEach(bookmark => {
      if (bookmark.title?.includes(query) || bookmark.url?.includes(query)) {
        results.push(bookmark);
      }
    });
    return results;
  });

  ipcMain.handle('bookmarks:import', async (event, { browser }) => {
    // TODO: Implement bookmark import from other browsers
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('bookmarks:export', async (event, { format }) => {
    // TODO: Implement bookmark export
    return { success: false, error: 'Not implemented yet' };
  });

  // History handlers (simplified - store in memory for now)
  const history = [];
  
  ipcMain.handle('history:add', async (event, entry) => {
    history.push({ ...entry, id: crypto.randomBytes(8).toString('hex'), visitedAt: Date.now() });
    return { success: true };
  });

  ipcMain.handle('history:remove', async (event, { historyId }) => {
    const index = history.findIndex(item => item.id === historyId);
    if (index !== -1) {
      history.splice(index, 1);
      return { success: true };
    }
    return { success: false, error: 'History item not found' };
  });

  ipcMain.handle('history:clear', async (event, options) => {
    history.length = 0;
    return { success: true };
  });

  ipcMain.handle('history:getAll', async (event, options = {}) => {
    const { limit = 100, offset = 0 } = options;
    return history.slice(offset, offset + limit);
  });

  ipcMain.handle('history:search', async (event, { query }) => {
    return history.filter(item => 
      item.title?.includes(query) || item.url?.includes(query)
    );
  });

  ipcMain.handle('history:getVisitCount', async (event, { url }) => {
    return history.filter(item => item.url === url).length;
  });

  // Password manager handlers (simplified - DO NOT use in production)
  const passwords = new Map();
  
  ipcMain.handle('passwords:save', async (event, credentials) => {
    const id = crypto.randomBytes(8).toString('hex');
    passwords.set(id, { ...credentials, id });
    return { success: true, id };
  });

  ipcMain.handle('passwords:get', async (event, { domain }) => {
    const results = [];
    passwords.forEach(pwd => {
      if (pwd.domain === domain) results.push(pwd);
    });
    return results;
  });

  ipcMain.handle('passwords:remove', async (event, { passwordId }) => {
    passwords.delete(passwordId);
    return { success: true };
  });

  ipcMain.handle('passwords:getAll', async () => {
    return Array.from(passwords.values());
  });

  ipcMain.handle('passwords:checkBreach', async (event, { password }) => {
    // TODO: Implement password breach check
    return { breached: false };
  });

  ipcMain.handle('passwords:generatePassword', async (event, options = {}) => {
    const { length = 16, includeSymbols = true } = options;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const charset = includeSymbols ? chars + symbols : chars;
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
  });

  ipcMain.handle('passwords:import', async (event, data) => {
    // TODO: Implement password import
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('passwords:export', async () => {
    return Array.from(passwords.values());
  });

  // Extensions handlers (simplified)
  const extensions = new Map();
  
  ipcMain.handle('extensions:install', async (event, { extensionId }) => {
    // TODO: Implement extension installation
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('extensions:uninstall', async (event, { extensionId }) => {
    extensions.delete(extensionId);
    return { success: true };
  });

  ipcMain.handle('extensions:getAll', async () => {
    return Array.from(extensions.values());
  });

  ipcMain.handle('extensions:enable', async (event, { extensionId }) => {
    const ext = extensions.get(extensionId);
    if (ext) {
      ext.enabled = true;
      return { success: true };
    }
    return { success: false, error: 'Extension not found' };
  });

  ipcMain.handle('extensions:disable', async (event, { extensionId }) => {
    const ext = extensions.get(extensionId);
    if (ext) {
      ext.enabled = false;
      return { success: true };
    }
    return { success: false, error: 'Extension not found' };
  });

  ipcMain.handle('extensions:getPermissions', async (event, { extensionId }) => {
    const ext = extensions.get(extensionId);
    return ext ? ext.permissions || [] : [];
  });

  ipcMain.handle('extensions:loadFromFile', async (event, { path }) => {
    // TODO: Implement loading extension from file
    return { success: false, error: 'Not implemented yet' };
  });

  // Automation handlers
  ipcMain.handle('automation:extractData', async (event, { selectors, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const results = {};
      for (const [key, selector] of Object.entries(selectors)) {
        const code = `
          (() => {
            const elements = document.querySelectorAll('${selector}');
            return Array.from(elements).map(el => el.textContent?.trim() || '');
          })()
        `;
        results[key] = await tab.view.webContents.executeJavaScript(code);
      }
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:fillForm', async (event, { formData, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      for (const [selector, value] of Object.entries(formData)) {
        const code = `
          (() => {
            const element = document.querySelector('${selector}');
            if (element) {
              element.value = '${value}';
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          })()
        `;
        await tab.view.webContents.executeJavaScript(code);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:click', async (event, { selector, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const code = `
        (() => {
          const element = document.querySelector('${selector}');
          if (element) {
            element.click();
            return true;
          }
          return false;
        })()
      `;
      const result = await tab.view.webContents.executeJavaScript(code);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:waitForSelector', async (event, { selector, timeout = 5000, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const startTime = Date.now();
      while (Date.now() - startTime < timeout) {
        const code = `!!document.querySelector('${selector}')`;
        const exists = await tab.view.webContents.executeJavaScript(code);
        if (exists) return { success: true };
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { success: false, error: 'Timeout waiting for selector' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:scroll', async (event, { x = 0, y = 0, smooth = true, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const code = `
        window.scrollTo({
          left: ${x},
          top: ${y},
          behavior: '${smooth ? 'smooth' : 'auto'}'
        });
      `;
      await tab.view.webContents.executeJavaScript(code);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:hover', async (event, { selector, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const code = `
        (() => {
          const element = document.querySelector('${selector}');
          if (element) {
            const event = new MouseEvent('mouseover', {
              view: window,
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(event);
            return true;
          }
          return false;
        })()
      `;
      const result = await tab.view.webContents.executeJavaScript(code);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:type', async (event, { text, delay = 50, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      for (const char of text) {
        tab.view.webContents.sendInputEvent({
          type: 'char',
          keyCode: char
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:selectDropdown', async (event, { selector, value, tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const code = `
        (() => {
          const select = document.querySelector('${selector}');
          if (select) {
            select.value = '${value}';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
          return false;
        })()
      `;
      const result = await tab.view.webContents.executeJavaScript(code);
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('automation:executeWorkflow', async (event, { workflow }) => {
    // TODO: Implement workflow execution
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('automation:recordActions', async (event, { start }) => {
    // TODO: Implement action recording
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('automation:getPageMetrics', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      
      const metrics = await tab.view.webContents.executeJavaScript(`
        ({
          title: document.title,
          url: window.location.href,
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
          domNodes: document.getElementsByTagName('*').length,
          images: document.images.length,
          scripts: document.scripts.length
        })
      `);
      return { success: true, metrics };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Privacy handlers
  ipcMain.handle('privacy:clearBrowsingData', async (event, options = {}) => {
    try {
      await session.defaultSession.clearStorageData(options);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('privacy:toggleCorsMode', async (event, { enabled, sessionId }) => {
    try {
      const targetSession = sessionId ? session.fromPartition(sessionId) : session.defaultSession;
      
      if (enabled) {
        corsEnabledSessions.add(sessionId || 'default');
        configureCORSBypass(targetSession);
      } else {
        corsEnabledSessions.delete(sessionId || 'default');
        // Remove CORS bypass handlers
        targetSession.webRequest.onBeforeSendHeaders(null);
        targetSession.webRequest.onHeadersReceived(null);
      }
      
      return { success: true, corsEnabled: enabled };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('privacy:setDoNotTrack', async (event, { enabled }) => {
    // TODO: Implement Do Not Track
    return { success: true };
  });

  ipcMain.handle('privacy:blockThirdPartyCookies', async (event, { enabled }) => {
    // TODO: Implement third-party cookie blocking
    return { success: true };
  });

  // Settings handlers
  const settings = {
    corsMode: CORS_BYPASS_ENABLED,
    autoUpdate: true,
    darkMode: false
  };

  ipcMain.handle('settings:get', async () => {
    return settings;
  });

  ipcMain.handle('settings:update', async (event, updates) => {
    Object.assign(settings, updates);
    // Apply settings changes
    if ('corsMode' in updates) {
      ipcMain._handlers.get('privacy:toggleCorsMode')(event, { enabled: updates.corsMode });
    }
    return { success: true, settings };
  });

  // DevTools handlers
  ipcMain.handle('devtools:open', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      tab.view.webContents.openDevTools();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('devtools:close', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      tab.view.webContents.closeDevTools();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('devtools:toggle', async (event, { tabId }) => {
    try {
      const tab = tabManager.tabs.get(tabId) || tabManager.tabs.get(tabManager.activeTab.values().next().value);
      if (!tab) throw new Error('No active tab');
      tab.view.webContents.toggleDevTools();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('devtools:executeCommand', async (event, { command, tabId }) => {
    // TODO: Implement DevTools command execution
    return { success: false, error: 'Not implemented yet' };
  });

  // Auto-updater handlers
  ipcMain.handle('updater:check', () => autoUpdaterManager.checkForUpdates());
  ipcMain.handle('updater:download', () => autoUpdaterManager.downloadUpdate());
  ipcMain.handle('updater:install', () => autoUpdaterManager.installUpdate());
  ipcMain.handle('updater:getStatus', () => autoUpdaterManager.getStatus());

  // Analytics handlers
  ipcMain.handle('analytics:trackEvent', async (event, { category, action, label, value }) => {
    // TODO: Implement analytics tracking
    return { success: true };
  });

  ipcMain.handle('analytics:trackPageView', async (event, { page }) => {
    // TODO: Implement page view tracking
    return { success: true };
  });

  // System handlers
  ipcMain.handle('system:getInfo', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      appVersion: app.getVersion(),
      locale: app.getLocale()
    };
  });

  ipcMain.handle('system:openExternal', async (event, { url }) => {
    shell.openExternal(url);
    return { success: true };
  });

  ipcMain.handle('system:showItemInFolder', async (event, { path }) => {
    shell.showItemInFolder(path);
    return { success: true };
  });

  ipcMain.handle('system:beep', async () => {
    shell.beep();
    return { success: true };
  });
}

// Create main window
function createWindow() {
  // Create the browser window with optimized configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !CORS_BYPASS_ENABLED, // Only disable in dev mode
      allowRunningInsecureContent: isDev,
      experimentalFeatures: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../attached_assets/icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a1a',
    show: false
  });

  // Store window reference
  windows.set('main', mainWindow);
  
  // Create initial window in TabManager
  const { windowId } = tabManager.createWindow({ window: mainWindow });
  
  // Create initial tab
  tabManager.createTab(windowId, isDev ? 'http://localhost:5000' : 'about:home');

  // Only enable CORS bypass in development by default
  if (CORS_BYPASS_ENABLED) {
    configureCORSBypass(session.defaultSession);
  }

  // Setup download handling
  setupDownloadHandling(session.defaultSession);

  // Create system tray
  createSystemTray();

  // Register global shortcuts
  registerGlobalShortcuts();
  
  // Set main window for auto-updater
  autoUpdaterManager.setMainWindow(mainWindow);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize Windows-specific features
    if (process.platform === 'win32') {
      windowsFeatures = new WindowsFeatures(mainWindow);
      windowsFeatures.setupWindowsIPC();
      windowsFeatures.setupPerformanceMonitoring();
      windowsFeatures.setupThemeIntegration();
      
      // Initialize Windows shortcuts
      windowsShortcuts = new WindowsShortcuts(mainWindow, tabManager);
      
      // Initialize Windows performance optimization
      windowsPerformance = new WindowsPerformance(mainWindow);
      
      // Initialize Windows security
      windowsSecurity = new WindowsSecurity(mainWindow);
      
      // Initialize Windows notifications
      windowsNotifications = new WindowsNotifications(mainWindow);
    }
  });

  // Handle window events
  mainWindow.on('close', (event) => {
    if (tray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    windows.delete('main');
    mainWindow = null;
  });

  // Handle new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url, frameName, features }) => {
    // Handle popup windows
    if (features.includes('popup')) {
      createPopupWindow(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// Configure CORS bypass (scoped and toggleable)
function configureCORSBypass(ses) {
  const filter = { urls: ['*://*/*'] };

  // Only modify headers for CORS bypass, not remove security headers from requests
  ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Add CORS headers to outgoing requests
    if (details.url.includes('http')) {
      const urlObj = new url.URL(details.url);
      // Only modify Origin if needed for CORS
      if (!details.requestHeaders['Origin']) {
        details.requestHeaders['Origin'] = urlObj.origin;
      }
    }
    
    callback({ requestHeaders: details.requestHeaders });
  });

  // Modify response headers for CORS bypass
  ses.webRequest.onHeadersReceived(filter, (details, callback) => {
    // Only remove restrictive headers and add CORS headers if explicitly enabled
    if (corsEnabledSessions.has('default') || corsEnabledSessions.has(ses.partition)) {
      // Remove restrictive security headers
      const headersToRemove = [
        'X-Frame-Options',
        'x-frame-options',
        'Content-Security-Policy',
        'content-security-policy',
        'X-Content-Security-Policy'
      ];
      
      headersToRemove.forEach(header => {
        delete details.responseHeaders[header];
      });
      
      // Add permissive CORS headers
      details.responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      details.responseHeaders['Access-Control-Allow-Methods'] = ['GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH'];
      details.responseHeaders['Access-Control-Allow-Headers'] = ['*'];
      details.responseHeaders['Access-Control-Allow-Credentials'] = ['true'];
      details.responseHeaders['Access-Control-Max-Age'] = ['86400'];
      details.responseHeaders['Access-Control-Expose-Headers'] = ['*'];
    }
    
    callback({ 
      responseHeaders: details.responseHeaders,
      cancel: false 
    });
  });

  // Use permission prompts instead of auto-granting
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    // Auto-grant only safe permissions
    const safePermissions = ['fullscreen', 'pointerLock'];
    if (safePermissions.includes(permission)) {
      callback(true);
    } else {
      // Show permission dialog for other permissions
      const response = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Allow', 'Deny'],
        defaultId: 1,
        title: 'Permission Request',
        message: `The website wants to access: ${permission}`,
        detail: `URL: ${webContents.getURL()}`
      });
      callback(response === 0);
    }
  });

  // Only accept invalid certificates in development
  if (isDev) {
    ses.setCertificateVerifyProc((request, callback) => {
      callback(0); // Accept all certificates in dev
    });
  }
}

// Setup download handling
function setupDownloadHandling(ses) {
  ses.on('will-download', (event, item, webContents) => {
    const downloadId = crypto.randomBytes(8).toString('hex');
    downloadItems.set(downloadId, item);
    
    // Set save path
    const downloadsPath = app.getPath('downloads');
    const filename = item.getFilename();
    item.setSavePath(path.join(downloadsPath, filename));
    
    // Handle download events
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download interrupted');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download paused');
        } else {
          const progress = {
            downloadId,
            bytesReceived: item.getReceivedBytes(),
            totalBytes: item.getTotalBytes(),
            percent: (item.getReceivedBytes() / item.getTotalBytes()) * 100
          };
          mainWindow?.webContents.send('download-progress', progress);
        }
      }
    });
    
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download completed:', filename);
        mainWindow?.webContents.send('download-completed', {
          downloadId,
          filename,
          path: item.getSavePath()
        });
        
        // Show notification
        const notification = new Notification({
          title: 'Download Complete',
          body: `${filename} has been downloaded`,
          icon: path.join(__dirname, '../attached_assets/icon.png')
        });
        notification.show();
      } else {
        console.log('Download failed:', state);
        downloadItems.delete(downloadId);
      }
    });
  });
}

// Create system tray
function createSystemTray() {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, '../attached_assets/icon.png')
  ).resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show MadEasy Browser', click: () => {
      mainWindow.show();
    }},
    { label: 'New Tab', click: () => {
      mainWindow.webContents.send('new-tab');
    }},
    { type: 'separator' },
    { label: 'Downloads', click: () => {
      mainWindow.webContents.send('open-downloads');
    }},
    { label: 'History', click: () => {
      mainWindow.webContents.send('open-history');
    }},
    { label: 'Bookmarks', click: () => {
      mainWindow.webContents.send('open-bookmarks');
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);

  tray.setToolTip('MadEasy Browser V3.00');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// Register global shortcuts
function registerGlobalShortcuts() {
  // New tab
  globalShortcut.register('CommandOrControl+T', () => {
    const windowId = Array.from(windows.keys())[0];
    if (windowId) {
      tabManager.createTab(windowId, 'about:blank', { active: true });
    }
  });
  
  // Close tab
  globalShortcut.register('CommandOrControl+W', () => {
    const activeTabId = tabManager.activeTab.values().next().value;
    if (activeTabId) {
      tabManager.closeTab(activeTabId);
    }
  });
  
  // Reload
  globalShortcut.register('CommandOrControl+R', () => {
    const activeTabId = tabManager.activeTab.values().next().value;
    const tab = tabManager.tabs.get(activeTabId);
    if (tab) {
      tab.view.webContents.reload();
    }
  });
  
  // DevTools
  globalShortcut.register('F12', () => {
    const activeTabId = tabManager.activeTab.values().next().value;
    const tab = tabManager.tabs.get(activeTabId);
    if (tab) {
      tab.view.webContents.toggleDevTools();
    }
  });
  
  // Full screen
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
  
  // Navigation
  globalShortcut.register('Alt+Left', () => {
    const activeTabId = tabManager.activeTab.values().next().value;
    const tab = tabManager.tabs.get(activeTabId);
    if (tab && tab.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
    }
  });
  
  globalShortcut.register('Alt+Right', () => {
    const activeTabId = tabManager.activeTab.values().next().value;
    const tab = tabManager.tabs.get(activeTabId);
    if (tab && tab.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
    }
  });
}

// Create popup window
function createPopupWindow(targetUrl) {
  const popupWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !CORS_BYPASS_ENABLED
    }
  });

  popupWindow.loadURL(targetUrl);
  
  if (CORS_BYPASS_ENABLED) {
    configureCORSBypass(popupWindow.webContents.session);
  }
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'MadEasy Browser',
      submenu: [
        { label: 'About MadEasy Browser', role: 'about' },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => {
          mainWindow.webContents.send('open-settings');
        }},
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => {
          app.isQuitting = true;
          app.quit();
        }}
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: () => {
          mainWindow.webContents.send('new-tab');
        }},
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => {
          createWindow();
        }},
        { label: 'New Incognito Window', accelerator: 'CmdOrCtrl+Shift+N', click: () => {
          createIncognitoWindow();
        }},
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => {
          mainWindow.webContents.send('close-tab');
        }},
        { label: 'Close Window', accelerator: 'CmdOrCtrl+Shift+W', click: () => {
          mainWindow.close();
        }}
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => {
          mainWindow.webContents.send('find-in-page');
        }}
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => {
          mainWindow.webContents.send('reload-page');
        }},
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => {
          mainWindow.webContents.send('force-reload');
        }},
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => {
          mainWindow.webContents.send('zoom-in');
        }},
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => {
          mainWindow.webContents.send('zoom-out');
        }},
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => {
          mainWindow.webContents.send('zoom-reset');
        }},
        { type: 'separator' },
        { label: 'Full Screen', accelerator: 'F11', click: () => {
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }},
        { type: 'separator' },
        { label: 'Developer Tools', accelerator: 'F12', click: () => {
          mainWindow.webContents.toggleDevTools();
        }}
      ]
    },
    {
      label: 'History',
      submenu: [
        { label: 'Back', accelerator: 'Alt+Left', click: () => {
          mainWindow.webContents.send('navigate-back');
        }},
        { label: 'Forward', accelerator: 'Alt+Right', click: () => {
          mainWindow.webContents.send('navigate-forward');
        }},
        { label: 'Home', accelerator: 'Alt+Home', click: () => {
          mainWindow.webContents.send('navigate-home');
        }},
        { type: 'separator' },
        { label: 'Show All History', accelerator: 'CmdOrCtrl+H', click: () => {
          mainWindow.webContents.send('open-history');
        }},
        { label: 'Clear Browsing Data...', accelerator: 'CmdOrCtrl+Shift+Delete', click: () => {
          mainWindow.webContents.send('clear-browsing-data');
        }}
      ]
    },
    {
      label: 'Bookmarks',
      submenu: [
        { label: 'Bookmark This Page', accelerator: 'CmdOrCtrl+D', click: () => {
          mainWindow.webContents.send('bookmark-page');
        }},
        { label: 'Show All Bookmarks', accelerator: 'CmdOrCtrl+Shift+B', click: () => {
          mainWindow.webContents.send('open-bookmarks');
        }},
        { type: 'separator' },
        { label: 'Manage Bookmarks', click: () => {
          mainWindow.webContents.send('manage-bookmarks');
        }}
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Downloads', accelerator: 'CmdOrCtrl+J', click: () => {
          mainWindow.webContents.send('open-downloads');
        }},
        { label: 'Password Manager', click: () => {
          mainWindow.webContents.send('open-passwords');
        }},
        { label: 'Extensions', click: () => {
          mainWindow.webContents.send('open-extensions');
        }},
        { type: 'separator' },
        { label: 'Workflow Builder', accelerator: 'CmdOrCtrl+Shift+W', click: () => {
          mainWindow.webContents.send('open-workflow-builder');
        }},
        { label: 'AI Assistant', accelerator: 'CmdOrCtrl+Shift+A', click: () => {
          mainWindow.webContents.send('open-ai-assistant');
        }},
        { type: 'separator' },
        { label: 'Task Manager', click: () => {
          mainWindow.webContents.send('open-task-manager');
        }}
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'MadEasy Browser Help', click: () => {
          shell.openExternal('https://madeasy.ai/help');
        }},
        { label: 'Report an Issue', click: () => {
          shell.openExternal('https://madeasy.ai/feedback');
        }},
        { type: 'separator' },
        { label: 'Check for Updates', click: () => {
          autoUpdaterManager.checkForUpdates();
        }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Create incognito window
function createIncognitoWindow() {
  const incognitoWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !CORS_BYPASS_ENABLED,
      partition: 'persist:incognito'
    },
    icon: path.join(__dirname, '../attached_assets/icon.png'),
    backgroundColor: '#2a2a2a'
  });

  if (CORS_BYPASS_ENABLED) {
    configureCORSBypass(incognitoWindow.webContents.session);
  }
  
  if (isDev) {
    incognitoWindow.loadURL('http://localhost:5000?mode=incognito');
  } else {
    incognitoWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mode: 'incognito' }
    });
  }
}

// App event handlers
app.whenReady().then(() => {
  // Setup IPC handlers before creating window
  setupIpcHandlers();
  
  createWindow();
  createMenu();

  // Handle protocol for deep linking
  protocol.registerHttpProtocol('madeasy', (request, callback) => {
    const url = request.url.substr(8);
    mainWindow.webContents.send('deep-link', url);
  });

  // Power monitor events
  powerMonitor.on('suspend', () => {
    mainWindow.webContents.send('system-suspend');
  });

  powerMonitor.on('resume', () => {
    mainWindow.webContents.send('system-resume');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Cleanup
  globalShortcut.unregisterAll();
  if (windowsShortcuts) {
    windowsShortcuts.unregisterAllShortcuts();
  }
  if (tray) {
    tray.destroy();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// Certificate error handling - only in dev
if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}

// Disable CORS only in development
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
if (isDev) {
  app.commandLine.appendSwitch('disable-web-security');
}