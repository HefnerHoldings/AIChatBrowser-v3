const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Auto-updater starting...');

class AutoUpdaterManager {
  constructor() {
    this.mainWindow = null;
    this.updateAvailable = false;
    this.updateInfo = null;
    this.downloadProgress = 0;
    this.isDownloading = false;
    
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    this.setupEventHandlers();
    this.setupIpcHandlers();
  }

  // Set main window reference
  setMainWindow(window) {
    this.mainWindow = window;
  }

  // Setup auto-updater event handlers
  setupEventHandlers() {
    // Checking for update
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      this.sendStatusToWindow('checking-for-update');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.updateAvailable = true;
      this.updateInfo = info;
      
      this.sendStatusToWindow('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
        updateSize: this.formatBytes(info.files.reduce((sum, file) => sum + file.size, 0))
      });

      // Show update dialog
      this.showUpdateDialog(info);
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available');
      this.updateAvailable = false;
      this.sendStatusToWindow('update-not-available');
    });

    // Error occurred
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
      this.isDownloading = false;
      this.sendStatusToWindow('update-error', err.message);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${this.formatBytes(progressObj.bytesPerSecond)}/s`;
      logMessage += ` - Downloaded ${progressObj.percent.toFixed(2)}%`;
      logMessage += ` (${this.formatBytes(progressObj.transferred)} / ${this.formatBytes(progressObj.total)})`;
      
      log.info(logMessage);
      this.downloadProgress = progressObj.percent;
      
      this.sendStatusToWindow('download-progress', {
        bytesPerSecond: progressObj.bytesPerSecond,
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        transferredFormatted: this.formatBytes(progressObj.transferred),
        totalFormatted: this.formatBytes(progressObj.total),
        speedFormatted: this.formatBytes(progressObj.bytesPerSecond) + '/s'
      });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded');
      this.isDownloading = false;
      this.sendStatusToWindow('update-downloaded', info);
      
      // Show restart dialog
      this.showRestartDialog(info);
    });
  }

  // Setup IPC handlers
  setupIpcHandlers() {
    // Check for updates
    ipcMain.handle('updater:check', async () => {
      try {
        const result = await autoUpdater.checkForUpdatesAndNotify();
        return {
          success: true,
          updateAvailable: this.updateAvailable,
          updateInfo: this.updateInfo
        };
      } catch (error) {
        log.error('Check for updates failed:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Download update
    ipcMain.handle('updater:download', async () => {
      if (!this.updateAvailable || this.isDownloading) {
        return {
          success: false,
          error: 'No update available or already downloading'
        };
      }

      try {
        this.isDownloading = true;
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        this.isDownloading = false;
        log.error('Download update failed:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Install update
    ipcMain.handle('updater:install', () => {
      try {
        autoUpdater.quitAndInstall(false, true);
        return { success: true };
      } catch (error) {
        log.error('Install update failed:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Get update status
    ipcMain.handle('updater:getStatus', () => {
      return {
        updateAvailable: this.updateAvailable,
        updateInfo: this.updateInfo,
        downloadProgress: this.downloadProgress,
        isDownloading: this.isDownloading
      };
    });

    // Set auto-download
    ipcMain.handle('updater:setAutoDownload', (event, enabled) => {
      autoUpdater.autoDownload = enabled;
      return { success: true };
    });

    // Set auto-install
    ipcMain.handle('updater:setAutoInstall', (event, enabled) => {
      autoUpdater.autoInstallOnAppQuit = enabled;
      return { success: true };
    });
  }

  // Send status to window
  sendStatusToWindow(event, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(event, data);
    }
  }

  // Show update dialog
  showUpdateDialog(info) {
    const dialogOpts = {
      type: 'info',
      buttons: ['Last ned', 'Senere'],
      title: 'Oppdatering tilgjengelig',
      message: `MadEasy Browser ${info.version} er tilgjengelig`,
      detail: `En ny versjon av MadEasy Browser er tilgjengelig for nedlasting.\n\nDin versjon: ${autoUpdater.currentVersion}\nNy versjon: ${info.version}\n\nVil du laste ned oppdateringen nå?`,
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        this.downloadUpdate();
      }
    });
  }

  // Show restart dialog
  showRestartDialog(info) {
    const dialogOpts = {
      type: 'info',
      buttons: ['Start på nytt', 'Senere'],
      title: 'Oppdatering lastet ned',
      message: 'Oppdateringen er klar til å installeres',
      detail: `MadEasy Browser ${info.version} er lastet ned og klar til å installeres.\n\nApplikasjonen må startes på nytt for å fullføre installasjonen.\n\nVil du starte på nytt nå?`,
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(this.mainWindow, dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  }

  // Check for updates
  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      log.error('Failed to check for updates:', error);
    }
  }

  // Download update
  async downloadUpdate() {
    if (this.updateAvailable && !this.isDownloading) {
      this.isDownloading = true;
      try {
        await autoUpdater.downloadUpdate();
      } catch (error) {
        this.isDownloading = false;
        log.error('Failed to download update:', error);
      }
    }
  }

  // Check for updates on startup
  checkForUpdatesOnStartup() {
    // Check for updates 3 seconds after startup
    setTimeout(() => {
      this.checkForUpdates();
    }, 3000);

    // Check for updates every 4 hours
    setInterval(() => {
      this.checkForUpdates();
    }, 4 * 60 * 60 * 1000);
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Set update feed URL
  setFeedURL(url) {
    if (url) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: url
      });
    }
  }

  // Get current version
  getCurrentVersion() {
    return autoUpdater.currentVersion.toString();
  }

  // Check if update is available
  isUpdateAvailable() {
    return this.updateAvailable;
  }

  // Get update info
  getUpdateInfo() {
    return this.updateInfo;
  }

  // Install update
  installUpdate() {
    try {
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      log.error('Install update failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get status
  getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      updateInfo: this.updateInfo,
      downloadProgress: this.downloadProgress,
      isDownloading: this.isDownloading
    };
  }
}

module.exports = AutoUpdaterManager;