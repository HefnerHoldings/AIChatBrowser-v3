const { contextBridge, ipcRenderer } = require('electron');

// Expose comprehensive APIs for MadEasy Browser V3.00
contextBridge.exposeInMainWorld('electronAPI', {
  // Core browser navigation
  browser: {
    navigate: (url, tabId) => ipcRenderer.invoke('browser:navigate', { url, tabId }),
    back: (tabId) => ipcRenderer.invoke('browser:back', { tabId }),
    forward: (tabId) => ipcRenderer.invoke('browser:forward', { tabId }),
    refresh: (tabId) => ipcRenderer.invoke('browser:refresh', { tabId }),
    stop: (tabId) => ipcRenderer.invoke('browser:stop', { tabId }),
    getInfo: (tabId) => ipcRenderer.invoke('browser:getInfo', { tabId }),
    executeJS: (code, tabId) => ipcRenderer.invoke('browser:executeJS', { code, tabId }),
    screenshot: (tabId, fullPage) => ipcRenderer.invoke('browser:screenshot', { tabId, fullPage })
  },

  // Tab management
  tabs: {
    create: (url) => ipcRenderer.invoke('tabs:create', { url }),
    close: (tabId) => ipcRenderer.invoke('tabs:close', { tabId }),
    switch: (tabId) => ipcRenderer.invoke('tabs:switch', { tabId }),
    getAll: () => ipcRenderer.invoke('tabs:getAll'),
    duplicate: (tabId) => ipcRenderer.invoke('tabs:duplicate', { tabId }),
    move: (tabId, index) => ipcRenderer.invoke('tabs:move', { tabId, index }),
    pin: (tabId) => ipcRenderer.invoke('tabs:pin', { tabId }),
    unpin: (tabId) => ipcRenderer.invoke('tabs:unpin', { tabId })
  },

  // Window management
  windows: {
    create: (options) => ipcRenderer.invoke('windows:create', options),
    close: (windowId) => ipcRenderer.invoke('windows:close', { windowId }),
    minimize: () => ipcRenderer.invoke('windows:minimize'),
    maximize: () => ipcRenderer.invoke('windows:maximize'),
    restore: () => ipcRenderer.invoke('windows:restore'),
    fullscreen: (enable) => ipcRenderer.invoke('windows:fullscreen', { enable }),
    focus: (windowId) => ipcRenderer.invoke('windows:focus', { windowId }),
    getAll: () => ipcRenderer.invoke('windows:getAll'),
    moveTabToWindow: (tabId, windowId) => ipcRenderer.invoke('windows:moveTabToWindow', { tabId, windowId })
  },

  // CORS-free fetch
  fetch: {
    withoutCORS: async (url, options = {}) => {
      return await ipcRenderer.invoke('fetch-without-cors', url, options);
    },
    proxy: async (url, options = {}) => {
      return await ipcRenderer.invoke('fetch-proxy', url, options);
    }
  },

  // Download management
  downloads: {
    start: (url, options) => ipcRenderer.invoke('downloads:start', { url, options }),
    pause: (downloadId) => ipcRenderer.invoke('downloads:pause', { downloadId }),
    resume: (downloadId) => ipcRenderer.invoke('downloads:resume', { downloadId }),
    cancel: (downloadId) => ipcRenderer.invoke('downloads:cancel', { downloadId }),
    getAll: () => ipcRenderer.invoke('downloads:getAll'),
    openFile: (downloadId) => ipcRenderer.invoke('downloads:openFile', { downloadId }),
    showInFolder: (downloadId) => ipcRenderer.invoke('downloads:showInFolder', { downloadId }),
    clear: () => ipcRenderer.invoke('downloads:clear'),
    onProgress: (callback) => {
      ipcRenderer.on('download-progress', callback);
      return () => ipcRenderer.removeListener('download-progress', callback);
    },
    onCompleted: (callback) => {
      ipcRenderer.on('download-completed', callback);
      return () => ipcRenderer.removeListener('download-completed', callback);
    }
  },

  // Bookmarks management
  bookmarks: {
    add: (bookmark) => ipcRenderer.invoke('bookmarks:add', bookmark),
    remove: (bookmarkId) => ipcRenderer.invoke('bookmarks:remove', { bookmarkId }),
    update: (bookmarkId, updates) => ipcRenderer.invoke('bookmarks:update', { bookmarkId, updates }),
    getAll: () => ipcRenderer.invoke('bookmarks:getAll'),
    search: (query) => ipcRenderer.invoke('bookmarks:search', { query }),
    importFromBrowser: (browser) => ipcRenderer.invoke('bookmarks:import', { browser }),
    export: (format) => ipcRenderer.invoke('bookmarks:export', { format })
  },

  // History management
  history: {
    add: (entry) => ipcRenderer.invoke('history:add', entry),
    remove: (historyId) => ipcRenderer.invoke('history:remove', { historyId }),
    clear: (options) => ipcRenderer.invoke('history:clear', options),
    getAll: (options) => ipcRenderer.invoke('history:getAll', options),
    search: (query) => ipcRenderer.invoke('history:search', { query }),
    getVisitCount: (url) => ipcRenderer.invoke('history:getVisitCount', { url })
  },

  // Password manager
  passwords: {
    save: (credentials) => ipcRenderer.invoke('passwords:save', credentials),
    get: (domain) => ipcRenderer.invoke('passwords:get', { domain }),
    remove: (passwordId) => ipcRenderer.invoke('passwords:remove', { passwordId }),
    getAll: () => ipcRenderer.invoke('passwords:getAll'),
    checkBreach: (password) => ipcRenderer.invoke('passwords:checkBreach', { password }),
    generatePassword: (options) => ipcRenderer.invoke('passwords:generatePassword', options),
    import: (data) => ipcRenderer.invoke('passwords:import', data),
    export: () => ipcRenderer.invoke('passwords:export')
  },

  // Extensions API
  extensions: {
    install: (extensionId) => ipcRenderer.invoke('extensions:install', { extensionId }),
    uninstall: (extensionId) => ipcRenderer.invoke('extensions:uninstall', { extensionId }),
    enable: (extensionId) => ipcRenderer.invoke('extensions:enable', { extensionId }),
    disable: (extensionId) => ipcRenderer.invoke('extensions:disable', { extensionId }),
    getAll: () => ipcRenderer.invoke('extensions:getAll'),
    getPermissions: (extensionId) => ipcRenderer.invoke('extensions:getPermissions', { extensionId }),
    loadFromFile: (path) => ipcRenderer.invoke('extensions:loadFromFile', { path })
  },

  // Automation API
  automation: {
    extractData: (selector, tabId) => ipcRenderer.invoke('automation:extractData', { selector, tabId }),
    fillForm: (formData, tabId) => ipcRenderer.invoke('automation:fillForm', { formData, tabId }),
    click: (selector, tabId) => ipcRenderer.invoke('automation:click', { selector, tabId }),
    waitForSelector: (selector, tabId, timeout) => ipcRenderer.invoke('automation:waitForSelector', { selector, tabId, timeout }),
    scrollTo: (x, y, tabId) => ipcRenderer.invoke('automation:scrollTo', { x, y, tabId }),
    type: (selector, text, tabId) => ipcRenderer.invoke('automation:type', { selector, text, tabId }),
    select: (selector, value, tabId) => ipcRenderer.invoke('automation:select', { selector, value, tabId }),
    recordActions: (start) => ipcRenderer.invoke('automation:recordActions', { start }),
    playbackActions: (actions, tabId) => ipcRenderer.invoke('automation:playbackActions', { actions, tabId })
  },

  // Vibecoding Platform API
  vibecoding: {
    saveProfile: (profile) => ipcRenderer.invoke('vibe:save-profile', profile),
    loadProfile: () => ipcRenderer.invoke('vibe:load-profile'),
    getTemplates: () => ipcRenderer.invoke('vibe:get-templates'),
    publishPlaybook: (playbook) => ipcRenderer.invoke('vibe:publish-playbook', playbook),
    syncWithCloud: () => ipcRenderer.invoke('vibe:sync-cloud'),
    getMetrics: () => ipcRenderer.invoke('vibe:get-metrics')
  },

  // Multi-Agent API
  agents: {
    send: (agentId, message) => ipcRenderer.invoke('agent:send-message', { agentId, message }),
    onMessage: (callback) => {
      ipcRenderer.on('agent:message', callback);
      return () => ipcRenderer.removeListener('agent:message', callback);
    },
    getStatus: (agentId) => ipcRenderer.invoke('agent:get-status', agentId),
    createTeam: (agents) => ipcRenderer.invoke('agent:create-team', agents),
    executeTask: (task) => ipcRenderer.invoke('agent:execute-task', task)
  },

  // Marketplace API
  marketplace: {
    searchPlaybooks: (query) => ipcRenderer.invoke('marketplace:search-playbooks', query),
    installPlaybook: (id) => ipcRenderer.invoke('marketplace:install-playbook', id),
    publishPlaybook: (playbook) => ipcRenderer.invoke('marketplace:publish-playbook', playbook),
    ratePlaybook: (id, rating) => ipcRenderer.invoke('marketplace:rate-playbook', { id, rating }),
    getCategories: () => ipcRenderer.invoke('marketplace:get-categories'),
    getTrending: () => ipcRenderer.invoke('marketplace:get-trending')
  },

  // System events
  events: {
    onMenuCommand: (callback) => {
      const events = [
        'new-tab', 'close-tab', 'new-window', 'close-window',
        'navigate-back', 'navigate-forward', 'navigate-home',
        'reload-page', 'force-reload', 'open-settings',
        'open-downloads', 'open-history', 'open-bookmarks',
        'open-passwords', 'open-extensions', 'open-workflow-builder',
        'open-ai-assistant', 'clear-browsing-data', 'bookmark-page',
        'find-in-page', 'save-page', 'zoom-in', 'zoom-out', 'zoom-reset',
        'focus-address-bar', 'next-tab', 'previous-tab',
        'checking-for-updates', 'update-available', 'update-downloaded',
        'system-suspend', 'system-resume', 'deep-link'
      ];
      
      events.forEach(event => {
        ipcRenderer.on(event, callback);
      });
      
      return () => {
        events.forEach(event => {
          ipcRenderer.removeListener(event, callback);
        });
      };
    },
    onDownload: (callback) => {
      const events = ['download-started', 'download-progress', 'download-completed'];
      events.forEach(event => {
        ipcRenderer.on(event, callback);
      });
      return () => {
        events.forEach(event => {
          ipcRenderer.removeListener(event, callback);
        });
      };
    }
  },

  // Settings API
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', { key }),
    set: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
    export: () => ipcRenderer.invoke('settings:export'),
    import: (data) => ipcRenderer.invoke('settings:import', data)
  },

  // File system API (limited)
  fs: {
    selectFile: (options) => ipcRenderer.invoke('fs:selectFile', options),
    selectFolder: (options) => ipcRenderer.invoke('fs:selectFolder', options),
    saveFile: (data, options) => ipcRenderer.invoke('fs:saveFile', { data, options }),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', { path }),
    exists: (path) => ipcRenderer.invoke('fs:exists', { path })
  },

  // Clipboard API
  clipboard: {
    writeText: (text) => ipcRenderer.invoke('clipboard:writeText', { text }),
    readText: () => ipcRenderer.invoke('clipboard:readText'),
    writeImage: (image) => ipcRenderer.invoke('clipboard:writeImage', { image }),
    readImage: () => ipcRenderer.invoke('clipboard:readImage'),
    clear: () => ipcRenderer.invoke('clipboard:clear')
  },

  // Native dialog API
  dialog: {
    showMessage: (options) => ipcRenderer.invoke('dialog:showMessage', options),
    showError: (title, content) => ipcRenderer.invoke('dialog:showError', { title, content }),
    showSaveDialog: (options) => ipcRenderer.invoke('dialog:showSaveDialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:showOpenDialog', options)
  },

  // Shell API
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', { url }),
    showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', { path }),
    openPath: (path) => ipcRenderer.invoke('shell:openPath', { path }),
    beep: () => ipcRenderer.invoke('shell:beep')
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPath: (name) => ipcRenderer.invoke('app:getPath', { name }),
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
    quit: () => ipcRenderer.invoke('app:quit'),
    relaunch: () => ipcRenderer.invoke('app:relaunch'),
    focus: () => ipcRenderer.invoke('app:focus'),
    hide: () => ipcRenderer.invoke('app:hide'),
    show: () => ipcRenderer.invoke('app:show')
  },

  // Platform info
  platform: process.platform,
  arch: process.arch,
  isElectron: true,
  version: '3.0.0',
  
  // Update API
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download'),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update-available', callback);
      return () => ipcRenderer.removeListener('update-available', callback);
    },
    onUpdateProgress: (callback) => {
      ipcRenderer.on('update-progress', callback);
      return () => ipcRenderer.removeListener('update-progress', callback);
    },
    onUpdateDownloaded: (callback) => {
      ipcRenderer.on('update-downloaded', callback);
      return () => ipcRenderer.removeListener('update-downloaded', callback);
    }
  }
});