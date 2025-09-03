const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const url = require('url');
const puppeteer = require('puppeteer');

let mainWindow;
let puppeteerBrowser;
let activePage;
let expressServer;

// Enable remote module
require('@electron/remote/main').initialize();

// Start Express server
async function startExpressServer() {
  const { createServer } = await import('./server/index.js');
  expressServer = await createServer();
  console.log('Express server started on port 5000');
}

// Create Electron window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true
    },
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'attached_assets', 'icon.png')
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist', 'index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Initialize Puppeteer
  try {
    puppeteerBrowser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const pages = await puppeteerBrowser.pages();
    activePage = pages[0] || await puppeteerBrowser.newPage();
    
    console.log('Puppeteer browser launched');
  } catch (error) {
    console.error('Failed to launch Puppeteer:', error);
  }
}

// IPC handlers for browser control
ipcMain.handle('browser:navigate', async (event, url) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.goto(url, { waitUntil: 'networkidle2' });
    const title = await activePage.title();
    const currentUrl = activePage.url();
    
    // Take screenshot
    const screenshot = await activePage.screenshot({ encoding: 'base64' });
    
    return { 
      success: true, 
      url: currentUrl, 
      title,
      screenshot: `data:image/png;base64,${screenshot}`
    };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('browser:back', async () => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.goBack();
    return { success: true, url: activePage.url() };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('browser:forward', async () => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.goForward();
    return { success: true, url: activePage.url() };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('browser:refresh', async () => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.reload();
    return { success: true, url: activePage.url() };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('browser:screenshot', async () => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    const screenshot = await activePage.screenshot({ encoding: 'base64' });
    return { 
      success: true, 
      screenshot: `data:image/png;base64,${screenshot}` 
    };
  } catch (error) {
    return { error: error.message };
  }
});

// Automation handlers
ipcMain.handle('automation:extractData', async (event, selector) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    const data = await activePage.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map(el => ({
        text: el.textContent,
        href: el.href || null,
        src: el.src || null,
        value: el.value || null
      }));
    }, selector);
    
    return { success: true, data };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('automation:fillForm', async (event, formData) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    for (const [selector, value] of Object.entries(formData)) {
      await activePage.type(selector, value);
    }
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('automation:click', async (event, selector) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.click(selector);
    await activePage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    return { success: true, url: activePage.url() };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('automation:waitForSelector', async (event, selector, timeout = 5000) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    await activePage.waitForSelector(selector, { timeout });
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('automation:executeScript', async (event, script) => {
  if (!activePage) return { error: 'No active page' };
  
  try {
    const result = await activePage.evaluate(script);
    return { success: true, result };
  } catch (error) {
    return { error: error.message };
  }
});

// Workflow automation
ipcMain.handle('workflow:execute', async (event, workflow) => {
  if (!activePage) return { error: 'No active page' };
  
  const results = [];
  
  try {
    for (const step of workflow.steps) {
      let stepResult;
      
      switch (step.type) {
        case 'navigate':
          await activePage.goto(step.url, { waitUntil: 'networkidle2' });
          stepResult = { success: true, url: activePage.url() };
          break;
          
        case 'click':
          await activePage.click(step.selector);
          stepResult = { success: true };
          break;
          
        case 'type':
          await activePage.type(step.selector, step.value);
          stepResult = { success: true };
          break;
          
        case 'extract':
          const data = await activePage.evaluate((sel) => {
            const elements = document.querySelectorAll(sel);
            return Array.from(elements).map(el => el.textContent);
          }, step.selector);
          stepResult = { success: true, data };
          break;
          
        case 'wait':
          await activePage.waitForTimeout(step.duration || 1000);
          stepResult = { success: true };
          break;
          
        case 'screenshot':
          const screenshot = await activePage.screenshot({ encoding: 'base64' });
          stepResult = { 
            success: true, 
            screenshot: `data:image/png;base64,${screenshot}` 
          };
          break;
          
        default:
          stepResult = { error: `Unknown step type: ${step.type}` };
      }
      
      results.push({ step: step.name || step.type, ...stepResult });
      
      if (stepResult.error) break;
    }
    
    return { success: true, results };
  } catch (error) {
    return { error: error.message, results };
  }
});

// App event handlers
app.whenReady().then(async () => {
  await startExpressServer();
  await createWindow();
});

app.on('window-all-closed', async () => {
  if (puppeteerBrowser) {
    await puppeteerBrowser.close();
  }
  if (expressServer) {
    expressServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});

// Security settings
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5000' && parsedUrl.origin !== 'file://') {
      // Allow navigation for development
      console.log('Navigating to:', navigationUrl);
    }
  });
});