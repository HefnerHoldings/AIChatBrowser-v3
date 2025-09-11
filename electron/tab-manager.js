const { BrowserWindow, BrowserView, ipcMain } = require('electron');
const { EventEmitter } = require('events');
const path = require('path');

// Tab manager for handling multiple tabs and windows
class TabManager extends EventEmitter {
  constructor() {
    super();
    this.windows = new Map();
    this.tabs = new Map();
    this.tabOrder = new Map(); // window ID -> array of tab IDs
    this.activeTab = new Map(); // window ID -> active tab ID
    this.pinnedTabs = new Set();
    this.tabHistory = new Map(); // tab ID -> navigation history
  }

  // Create new window
  createWindow(options = {}) {
    const windowId = `window-${Date.now()}`;
    
    const window = new BrowserWindow({
      width: options.width || 1200,
      height: options.height || 800,
      minWidth: 600,
      minHeight: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        preload: path.join(__dirname, 'preload.js')
      },
      frame: options.frame !== false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      backgroundColor: '#1a1a1a',
      ...options
    });

    this.windows.set(windowId, window);
    this.tabOrder.set(windowId, []);

    // Handle window events
    window.on('closed', () => {
      const tabs = this.tabOrder.get(windowId) || [];
      tabs.forEach(tabId => this.closeTab(tabId));
      this.windows.delete(windowId);
      this.tabOrder.delete(windowId);
      this.activeTab.delete(windowId);
    });

    window.on('focus', () => {
      this.emit('window-focused', { windowId });
    });

    // Enable tab dragging
    this.enableTabDragging(window, windowId);

    return { windowId, window };
  }

  // Create new tab
  createTab(windowId, url = 'about:blank', options = {}) {
    const window = this.windows.get(windowId);
    if (!window) throw new Error('Window not found');

    const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create BrowserView for the tab
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: false,
        partition: options.incognito ? 'persist:incognito' : 'persist:main'
      }
    });

    // Set bounds relative to window
    const bounds = window.getContentBounds();
    view.setBounds({
      x: 0,
      y: 60, // Leave space for tab bar
      width: bounds.width,
      height: bounds.height - 60
    });

    view.setAutoResize({
      width: true,
      height: true,
      horizontal: false,
      vertical: false
    });

    // Store tab info
    this.tabs.set(tabId, {
      id: tabId,
      windowId,
      view,
      url,
      title: 'Ny fane',
      favicon: null,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isPinned: false,
      createdAt: Date.now()
    });

    // Initialize tab history
    this.tabHistory.set(tabId, {
      entries: [url],
      currentIndex: 0
    });

    // Add to window's tab order
    const tabOrder = this.tabOrder.get(windowId);
    if (options.index !== undefined && options.index >= 0 && options.index < tabOrder.length) {
      tabOrder.splice(options.index, 0, tabId);
    } else {
      tabOrder.push(tabId);
    }

    // Set up view event handlers
    this.setupViewEvents(view, tabId);

    // Load URL
    if (url && url !== 'about:blank') {
      view.webContents.loadURL(url);
    }

    // Set as active tab if it's the first one or requested
    if (tabOrder.length === 1 || options.active) {
      this.activateTab(tabId);
    }

    this.emit('tab-created', { tabId, windowId, url });

    return tabId;
  }

  // Set up view event handlers
  setupViewEvents(view, tabId) {
    const tab = this.tabs.get(tabId);
    
    // Navigation events
    view.webContents.on('did-start-loading', () => {
      tab.isLoading = true;
      this.emit('tab-loading', { tabId, isLoading: true });
    });

    view.webContents.on('did-stop-loading', () => {
      tab.isLoading = false;
      this.emit('tab-loading', { tabId, isLoading: false });
    });

    view.webContents.on('did-navigate', (event, url) => {
      tab.url = url;
      tab.canGoBack = view.webContents.canGoBack();
      tab.canGoForward = view.webContents.canGoForward();
      
      // Update history
      const history = this.tabHistory.get(tabId);
      if (history) {
        history.entries = history.entries.slice(0, history.currentIndex + 1);
        history.entries.push(url);
        history.currentIndex++;
      }
      
      this.emit('tab-navigated', { tabId, url });
    });

    view.webContents.on('page-title-updated', (event, title) => {
      tab.title = title;
      this.emit('tab-title-updated', { tabId, title });
    });

    view.webContents.on('page-favicon-updated', (event, favicons) => {
      tab.favicon = favicons[0];
      this.emit('tab-favicon-updated', { tabId, favicon: favicons[0] });
    });

    // Handle new window requests
    view.webContents.setWindowOpenHandler(({ url, frameName, features }) => {
      const windowId = tab.windowId;
      this.createTab(windowId, url, { active: true });
      return { action: 'deny' };
    });

    // Handle downloads
    view.webContents.session.on('will-download', (event, item, webContents) => {
      this.emit('download-started', {
        tabId,
        filename: item.getFilename(),
        url: item.getURL(),
        totalBytes: item.getTotalBytes()
      });
    });
  }

  // Activate tab
  activateTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const window = this.windows.get(tab.windowId);
    if (!window) return;

    // Hide current active tab's view
    const currentActiveTabId = this.activeTab.get(tab.windowId);
    if (currentActiveTabId && currentActiveTabId !== tabId) {
      const currentTab = this.tabs.get(currentActiveTabId);
      if (currentTab && currentTab.view) {
        window.removeBrowserView(currentTab.view);
      }
    }

    // Show new active tab's view
    window.addBrowserView(tab.view);
    
    // Update active tab
    this.activeTab.set(tab.windowId, tabId);
    
    this.emit('tab-activated', { tabId, windowId: tab.windowId });
  }

  // Close tab
  closeTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const window = this.windows.get(tab.windowId);
    const tabOrder = this.tabOrder.get(tab.windowId);
    
    if (window && tab.view) {
      window.removeBrowserView(tab.view);
      tab.view.webContents.destroy();
    }

    // Remove from tab order
    if (tabOrder) {
      const index = tabOrder.indexOf(tabId);
      if (index > -1) {
        tabOrder.splice(index, 1);
      }

      // Activate another tab if this was active
      if (this.activeTab.get(tab.windowId) === tabId && tabOrder.length > 0) {
        const newActiveIndex = Math.min(index, tabOrder.length - 1);
        this.activateTab(tabOrder[newActiveIndex]);
      }
    }

    // Clean up
    this.tabs.delete(tabId);
    this.tabHistory.delete(tabId);
    this.pinnedTabs.delete(tabId);

    this.emit('tab-closed', { tabId, windowId: tab.windowId });
  }

  // Move tab to different window
  moveTabToWindow(tabId, targetWindowId, index) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const sourceWindow = this.windows.get(tab.windowId);
    const targetWindow = this.windows.get(targetWindowId);
    if (!sourceWindow || !targetWindow) return;

    // Remove from source window
    const sourceTabOrder = this.tabOrder.get(tab.windowId);
    const tabIndex = sourceTabOrder.indexOf(tabId);
    if (tabIndex > -1) {
      sourceTabOrder.splice(tabIndex, 1);
    }
    sourceWindow.removeBrowserView(tab.view);

    // Add to target window
    tab.windowId = targetWindowId;
    const targetTabOrder = this.tabOrder.get(targetWindowId);
    if (index !== undefined && index >= 0 && index <= targetTabOrder.length) {
      targetTabOrder.splice(index, 0, tabId);
    } else {
      targetTabOrder.push(tabId);
    }

    // Activate in new window
    this.activateTab(tabId);

    this.emit('tab-moved', { tabId, fromWindow: tab.windowId, toWindow: targetWindowId });
  }

  // Duplicate tab
  duplicateTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    const tabOrder = this.tabOrder.get(tab.windowId);
    const index = tabOrder.indexOf(tabId);
    
    return this.createTab(tab.windowId, tab.url, {
      index: index + 1,
      active: false
    });
  }

  // Pin/unpin tab
  pinTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.isPinned = true;
    this.pinnedTabs.add(tabId);
    
    // Move to beginning of tab order
    const tabOrder = this.tabOrder.get(tab.windowId);
    const index = tabOrder.indexOf(tabId);
    if (index > 0) {
      tabOrder.splice(index, 1);
      tabOrder.unshift(tabId);
    }

    this.emit('tab-pinned', { tabId });
  }

  unpinTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return;

    tab.isPinned = false;
    this.pinnedTabs.delete(tabId);

    this.emit('tab-unpinned', { tabId });
  }

  // Navigate tab
  navigateTab(tabId, url) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view) return;

    tab.view.webContents.loadURL(url);
  }

  // Go back
  goBack(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view || !tab.view.webContents.canGoBack()) return;

    tab.view.webContents.goBack();
  }

  // Go forward
  goForward(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view || !tab.view.webContents.canGoForward()) return;

    tab.view.webContents.goForward();
  }

  // Reload tab
  reloadTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view) return;

    tab.view.webContents.reload();
  }

  // Stop loading
  stopLoading(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view) return;

    tab.view.webContents.stop();
  }

  // Enable tab dragging
  enableTabDragging(window, windowId) {
    // Listen for drag events from renderer
    ipcMain.on('tab-drag-start', (event, { tabId, mouseX, mouseY }) => {
      if (event.sender !== window.webContents) return;
      
      const tab = this.tabs.get(tabId);
      if (!tab || tab.windowId !== windowId) return;

      this.draggedTab = {
        tabId,
        sourceWindow: windowId,
        startX: mouseX,
        startY: mouseY
      };
    });

    ipcMain.on('tab-drag-end', (event, { mouseX, mouseY, screenX, screenY }) => {
      if (!this.draggedTab || event.sender !== window.webContents) return;

      // Find target window under cursor
      let targetWindow = null;
      let targetWindowId = null;

      for (const [winId, win] of this.windows.entries()) {
        const bounds = win.getBounds();
        if (screenX >= bounds.x && screenX <= bounds.x + bounds.width &&
            screenY >= bounds.y && screenY <= bounds.y + bounds.height) {
          targetWindow = win;
          targetWindowId = winId;
          break;
        }
      }

      // If dropped outside any window, create new window
      if (!targetWindow) {
        const newWindow = this.createWindow({
          x: screenX - 100,
          y: screenY - 30
        });
        targetWindowId = newWindow.windowId;
      }

      // Move tab if target is different from source
      if (targetWindowId && targetWindowId !== this.draggedTab.sourceWindow) {
        this.moveTabToWindow(this.draggedTab.tabId, targetWindowId);
      }

      this.draggedTab = null;
    });
  }

  // Get all tabs for a window
  getWindowTabs(windowId) {
    const tabOrder = this.tabOrder.get(windowId) || [];
    return tabOrder.map(tabId => this.tabs.get(tabId)).filter(Boolean);
  }

  // Get all tabs
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  // Get active tab for window
  getActiveTab(windowId) {
    const activeTabId = this.activeTab.get(windowId);
    return activeTabId ? this.tabs.get(activeTabId) : null;
  }

  // Switch to next tab
  nextTab(windowId) {
    const tabOrder = this.tabOrder.get(windowId);
    if (!tabOrder || tabOrder.length === 0) return;

    const currentTabId = this.activeTab.get(windowId);
    const currentIndex = tabOrder.indexOf(currentTabId);
    const nextIndex = (currentIndex + 1) % tabOrder.length;
    
    this.activateTab(tabOrder[nextIndex]);
  }

  // Switch to previous tab
  previousTab(windowId) {
    const tabOrder = this.tabOrder.get(windowId);
    if (!tabOrder || tabOrder.length === 0) return;

    const currentTabId = this.activeTab.get(windowId);
    const currentIndex = tabOrder.indexOf(currentTabId);
    const prevIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
    
    this.activateTab(tabOrder[prevIndex]);
  }

  // Execute JavaScript in tab
  executeJavaScript(tabId, code) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view) return Promise.reject('Tab not found');

    return tab.view.webContents.executeJavaScript(code);
  }

  // Take screenshot of tab
  async captureTab(tabId, options = {}) {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.view) throw new Error('Tab not found');

    const image = await tab.view.webContents.capturePage();
    return image.toDataURL();
  }

  // Get tab info
  getTabInfo(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return null;

    return {
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title,
      favicon: tab.favicon,
      isLoading: tab.isLoading,
      canGoBack: tab.canGoBack,
      canGoForward: tab.canGoForward,
      isPinned: tab.isPinned
    };
  }
}

module.exports = TabManager;