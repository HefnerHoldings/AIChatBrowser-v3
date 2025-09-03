const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Browser control
  navigate: (url) => ipcRenderer.invoke('browser:navigate', url),
  goBack: () => ipcRenderer.invoke('browser:back'),
  goForward: () => ipcRenderer.invoke('browser:forward'),
  refresh: () => ipcRenderer.invoke('browser:refresh'),
  screenshot: () => ipcRenderer.invoke('browser:screenshot'),
  
  // Automation
  extractData: (selector) => ipcRenderer.invoke('automation:extractData', selector),
  fillForm: (formData) => ipcRenderer.invoke('automation:fillForm', formData),
  click: (selector) => ipcRenderer.invoke('automation:click', selector),
  waitForSelector: (selector, timeout) => ipcRenderer.invoke('automation:waitForSelector', selector, timeout),
  executeScript: (script) => ipcRenderer.invoke('automation:executeScript', script),
  
  // Workflow
  executeWorkflow: (workflow) => ipcRenderer.invoke('workflow:execute', workflow),
  
  // Events
  onNavigated: (callback) => {
    ipcRenderer.on('browser:navigated', (event, data) => callback(data));
  },
  
  onDataExtracted: (callback) => {
    ipcRenderer.on('automation:dataExtracted', (event, data) => callback(data));
  }
});