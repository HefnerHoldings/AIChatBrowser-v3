const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

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
  },
  
  // Windows API
  systemInfo: () => ipcRenderer.invoke('windows:systemInfo'),
  showNotification: (options) => ipcRenderer.invoke('windows:notification', options),
  getClipboard: () => ipcRenderer.invoke('windows:getClipboard'),
  setClipboard: (text) => ipcRenderer.invoke('windows:setClipboard', text),
  takeScreenshot: (outputPath) => ipcRenderer.invoke('windows:screenshot', outputPath),
  openFile: (filePath) => ipcRenderer.invoke('windows:openFile', filePath),
  getProcesses: () => ipcRenderer.invoke('windows:getProcesses'),
  killProcess: (pid) => ipcRenderer.invoke('windows:killProcess', pid),
  readRegistry: (keyPath, valueName) => ipcRenderer.invoke('windows:readRegistry', keyPath, valueName),
  writeRegistry: (keyPath, valueName, value, type) => ipcRenderer.invoke('windows:writeRegistry', keyPath, valueName, value, type),
  createShortcut: (options) => ipcRenderer.invoke('windows:createShortcut', options),
  
  // Platform info
  platform: os.platform(),
  isWindows: os.platform() === 'win32'
});