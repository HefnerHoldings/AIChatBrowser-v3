const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Fetch any URL without CORS restrictions
  fetchWithoutCORS: async (url) => {
    return await ipcRenderer.invoke('fetch-without-cors', url);
  },

  // Execute JavaScript code
  executeJS: async (code) => {
    return await ipcRenderer.invoke('execute-javascript', code);
  },

  // Listen for menu commands
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

  // Platform information
  platform: process.platform,
  
  // App version
  version: '3.0.0'
});