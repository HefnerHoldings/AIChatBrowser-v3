const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object
let mainWindow;
let isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Create the browser window with custom configuration
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable CORS - this is what makes Electron special!
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../attached_assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a1a',
    show: false // Don't show until ready
  });

  // Remove CORS restrictions completely
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // Remove restrictive headers
    delete details.requestHeaders['X-Frame-Options'];
    delete details.requestHeaders['Content-Security-Policy'];
    callback({ requestHeaders: details.requestHeaders });
  });

  // Allow all permissions (notifications, media, etc)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true); // Grant all permissions
  });

  // Intercept new window requests and open them in the same window or new tab
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // You can handle new windows here
    return { action: 'allow' };
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '../dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create app menu
function createMenu() {
  const template = [
    {
      label: 'MadEasy Browser',
      submenu: [
        { label: 'Om MadEasy Browser', role: 'about' },
        { type: 'separator' },
        { label: 'Innstillinger', accelerator: 'CmdOrCtrl+,', click: () => {
          mainWindow.webContents.send('open-settings');
        }},
        { type: 'separator' },
        { label: 'Avslutt', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: 'Fil',
      submenu: [
        { label: 'Ny fane', accelerator: 'CmdOrCtrl+T', click: () => {
          mainWindow.webContents.send('new-tab');
        }},
        { label: 'Lukk fane', accelerator: 'CmdOrCtrl+W', click: () => {
          mainWindow.webContents.send('close-tab');
        }},
        { type: 'separator' },
        { label: 'Ny workflow', accelerator: 'CmdOrCtrl+N', click: () => {
          mainWindow.webContents.send('new-workflow');
        }}
      ]
    },
    {
      label: 'Rediger',
      submenu: [
        { label: 'Angre', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Gjør om', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Klipp ut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Lim inn', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Vis',
      submenu: [
        { label: 'Last inn på nytt', accelerator: 'CmdOrCtrl+R', click: () => {
          mainWindow.webContents.send('reload-page');
        }},
        { label: 'Fullskjerm', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Utviklerverktøy', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Navigasjon',
      submenu: [
        { label: 'Tilbake', accelerator: 'Alt+Left', click: () => {
          mainWindow.webContents.send('navigate-back');
        }},
        { label: 'Frem', accelerator: 'Alt+Right', click: () => {
          mainWindow.webContents.send('navigate-forward');
        }},
        { label: 'Hjem', accelerator: 'CmdOrCtrl+Home', click: () => {
          mainWindow.webContents.send('navigate-home');
        }}
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for advanced browser features
ipcMain.handle('fetch-without-cors', async (event, url) => {
  // This can fetch ANY URL without CORS restrictions
  try {
    const response = await fetch(url);
    const text = await response.text();
    return { success: true, data: text };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('execute-javascript', async (event, code) => {
  // Execute JavaScript in the main window
  try {
    const result = await mainWindow.webContents.executeJavaScript(code);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handle certificate errors (accept all for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true); // Accept the certificate
});