const { contextBridge, ipcRenderer } = require('electron');

// Eksponerer sikre API-er til renderer-prosessen for MadEasy V3.00
contextBridge.exposeInMainWorld('electronAPI', {
  // Fetch any URL without CORS restrictions - utvidet med options
  fetchWithoutCORS: async (url, options = {}) => {
    return await ipcRenderer.invoke('fetch-without-cors', url, options);
  },

  // Execute JavaScript code
  executeJS: async (code) => {
    return await ipcRenderer.invoke('execute-javascript', code);
  },

  // Browser navigasjon
  navigate: (url) => ipcRenderer.invoke('browser:navigate', { url }),
  back: () => ipcRenderer.invoke('browser:back'),
  forward: () => ipcRenderer.invoke('browser:forward'),
  reload: () => ipcRenderer.invoke('browser:reload'),
  stop: () => ipcRenderer.invoke('browser:stop'),

  // Listen for menu commands - forbedret
  onMenuCommand: (callback) => {
    ipcRenderer.on('new-tab', callback);
    ipcRenderer.on('close-tab', callback);
    ipcRenderer.on('new-workflow', callback);
    ipcRenderer.on('reload-page', callback);
    ipcRenderer.on('navigate-back', callback);
    ipcRenderer.on('navigate-forward', callback);
    ipcRenderer.on('navigate-home', callback);
    ipcRenderer.on('open-settings', callback);
  },

  // Vibecoding Platform API
  vibeProfiler: {
    save: (profile) => ipcRenderer.invoke('vibe:save-profile', profile),
    load: () => ipcRenderer.invoke('vibe:load-profile'),
    getTemplates: () => ipcRenderer.invoke('vibe:get-templates')
  },

  // Multi-Agent kommunikasjon
  agentMessage: {
    send: (agentId, message) => ipcRenderer.invoke('agent:send-message', { agentId, message }),
    onMessage: (callback) => ipcRenderer.on('agent:message', callback),
    getAgentStatus: (agentId) => ipcRenderer.invoke('agent:get-status', agentId)
  },

  // Marketplace API
  marketplace: {
    searchPlaybooks: (query) => ipcRenderer.invoke('marketplace:search-playbooks', query),
    installPlaybook: (id) => ipcRenderer.invoke('marketplace:install-playbook', id),
    publishPlaybook: (playbook) => ipcRenderer.invoke('marketplace:publish-playbook', playbook)
  },

  // System info
  platform: process.platform,
  isElectron: true,
  
  // App version
  version: '3.0.0'
});