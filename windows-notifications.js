const { Notification, ipcMain, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Enhanced Windows Notifications Manager
class WindowsNotifications {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.notificationQueue = [];
        this.activeNotifications = new Map();
        this.notificationHistory = [];
        this.settings = {
            enabled: true,
            soundEnabled: true,
            showBadge: true,
            urgencyLevels: true,
            actionButtons: true,
            customSounds: true
        };
        this.setupNotificationSystem();
    }

    setupNotificationSystem() {
        if (process.platform !== 'win32') return;

        console.log('Setting up Windows notification system...');

        // Set app user model ID for proper Windows notifications
        app.setAppUserModelId('com.madeasy.browser');

        // Setup IPC handlers
        this.setupIpcHandlers();
        
        // Setup notification templates
        this.setupNotificationTemplates();
        
        // Setup notification center integration
        this.setupNotificationCenter();
        
        // Setup action handlers
        this.setupActionHandlers();
    }

    setupIpcHandlers() {
        // Show notification
        ipcMain.handle('notifications:show', async (event, options) => {
            return await this.showNotification(options);
        });

        // Show custom notification
        ipcMain.handle('notifications:show-custom', async (event, options) => {
            return await this.showCustomNotification(options);
        });

        // Show progress notification
        ipcMain.handle('notifications:show-progress', async (event, options) => {
            return await this.showProgressNotification(options);
        });

        // Update notification
        ipcMain.handle('notifications:update', async (event, { id, updates }) => {
            return await this.updateNotification(id, updates);
        });

        // Close notification
        ipcMain.handle('notifications:close', async (event, { id }) => {
            return await this.closeNotification(id);
        });

        // Get notification history
        ipcMain.handle('notifications:get-history', async () => {
            return this.getNotificationHistory();
        });

        // Clear notification history
        ipcMain.handle('notifications:clear-history', async () => {
            return this.clearNotificationHistory();
        });

        // Update settings
        ipcMain.handle('notifications:update-settings', async (event, newSettings) => {
            return this.updateSettings(newSettings);
        });

        // Get settings
        ipcMain.handle('notifications:get-settings', async () => {
            return this.settings;
        });
    }

    setupNotificationTemplates() {
        this.templates = {
            download: {
                icon: path.join(__dirname, 'attached_assets', 'download-icon.png'),
                urgency: 'normal',
                actions: [
                    { type: 'button', text: 'Open File' },
                    { type: 'button', text: 'Show in Folder' }
                ]
            },
            security: {
                icon: path.join(__dirname, 'attached_assets', 'security-icon.png'),
                urgency: 'critical',
                actions: [
                    { type: 'button', text: 'View Details' },
                    { type: 'button', text: 'Dismiss' }
                ]
            },
            update: {
                icon: path.join(__dirname, 'attached_assets', 'update-icon.png'),
                urgency: 'normal',
                actions: [
                    { type: 'button', text: 'Install Now' },
                    { type: 'button', text: 'Later' }
                ]
            },
            bookmark: {
                icon: path.join(__dirname, 'attached_assets', 'bookmark-icon.png'),
                urgency: 'low',
                actions: [
                    { type: 'button', text: 'Open' },
                    { type: 'button', text: 'Edit' }
                ]
            },
            ai: {
                icon: path.join(__dirname, 'attached_assets', 'ai-icon.png'),
                urgency: 'normal',
                actions: [
                    { type: 'button', text: 'View Response' },
                    { type: 'button', text: 'Continue Chat' }
                ]
            }
        };
    }

    setupNotificationCenter() {
        // Windows 10/11 notification center integration
        console.log('Setting up notification center integration...');

        // Register notification activation handler
        app.on('notification-action', (event, notificationId, actionType, actionValue) => {
            this.handleNotificationAction(notificationId, actionType, actionValue);
        });

        // Handle notification clicks
        app.on('notification-click', (event, notificationId) => {
            this.handleNotificationClick(notificationId);
        });
    }

    setupActionHandlers() {
        // Setup handlers for different notification actions
        this.actionHandlers = {
            'open-file': (data) => {
                if (data.filePath) {
                    shell.openPath(data.filePath);
                }
            },
            'show-in-folder': (data) => {
                if (data.filePath) {
                    shell.showItemInFolder(data.filePath);
                }
            },
            'open-url': (data) => {
                if (data.url) {
                    this.mainWindow.webContents.send('navigate-to', data.url);
                    this.mainWindow.show();
                }
            },
            'install-update': (data) => {
                this.mainWindow.webContents.send('install-update');
            },
            'open-security-center': (data) => {
                this.mainWindow.webContents.send('open-security-center');
                this.mainWindow.show();
            },
            'view-ai-response': (data) => {
                this.mainWindow.webContents.send('open-ai-chat', data);
                this.mainWindow.show();
            }
        };
    }

    async showNotification(options) {
        if (!this.settings.enabled || !Notification.isSupported()) {
            return { success: false, error: 'Notifications not supported or disabled' };
        }

        try {
            const notificationId = this.generateNotificationId();
            const template = this.templates[options.template] || {};
            
            const notificationOptions = {
                title: options.title || 'MadEasy Browser',
                body: options.body || '',
                icon: options.icon || template.icon || path.join(__dirname, 'attached_assets', 'icon.png'),
                urgency: options.urgency || template.urgency || 'normal',
                timeoutType: options.timeoutType || 'default',
                silent: options.silent || !this.settings.soundEnabled,
                ...options
            };

            const notification = new Notification(notificationOptions);
            
            // Store notification reference
            this.activeNotifications.set(notificationId, {
                notification,
                options: notificationOptions,
                data: options.data || {},
                createdAt: Date.now()
            });

            // Setup event handlers
            notification.on('show', () => {
                console.log(`Notification shown: ${notificationId}`);
                this.addToHistory(notificationId, notificationOptions, 'shown');
            });

            notification.on('click', () => {
                this.handleNotificationClick(notificationId);
            });

            notification.on('close', () => {
                this.activeNotifications.delete(notificationId);
                this.addToHistory(notificationId, notificationOptions, 'closed');
            });

            notification.on('action', (event, index) => {
                this.handleNotificationAction(notificationId, 'action', index);
            });

            // Show notification
            notification.show();

            // Auto-close after timeout if specified
            if (options.autoClose && options.autoCloseDelay) {
                setTimeout(() => {
                    this.closeNotification(notificationId);
                }, options.autoCloseDelay);
            }

            return { success: true, notificationId };

        } catch (error) {
            console.error('Error showing notification:', error);
            return { success: false, error: error.message };
        }
    }

    async showCustomNotification(options) {
        // Enhanced notification with custom styling and actions
        const customOptions = {
            ...options,
            hasReply: options.hasReply || false,
            replyPlaceholder: options.replyPlaceholder || 'Type a reply...',
            actions: options.actions || [],
            closeButtonText: options.closeButtonText || 'Close',
            toastXml: this.generateToastXml(options)
        };

        return await this.showNotification(customOptions);
    }

    async showProgressNotification(options) {
        // Progress notification for downloads, updates, etc.
        const progressOptions = {
            ...options,
            title: options.title || 'Progress',
            body: `${options.progress || 0}% complete`,
            progress: {
                value: options.progress || 0,
                max: options.maxProgress || 100,
                status: options.status || 'normal'
            },
            template: 'progress'
        };

        return await this.showNotification(progressOptions);
    }

    async updateNotification(id, updates) {
        const notificationData = this.activeNotifications.get(id);
        if (!notificationData) {
            return { success: false, error: 'Notification not found' };
        }

        try {
            // For progress updates, we need to create a new notification
            // as Windows doesn't support updating existing notifications
            if (updates.progress !== undefined) {
                await this.closeNotification(id);
                return await this.showProgressNotification({
                    ...notificationData.options,
                    ...updates
                });
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async closeNotification(id) {
        const notificationData = this.activeNotifications.get(id);
        if (!notificationData) {
            return { success: false, error: 'Notification not found' };
        }

        try {
            notificationData.notification.close();
            this.activeNotifications.delete(id);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    handleNotificationClick(notificationId) {
        const notificationData = this.activeNotifications.get(notificationId);
        if (!notificationData) return;

        console.log(`Notification clicked: ${notificationId}`);

        // Default click action - show main window
        this.mainWindow.show();
        this.mainWindow.focus();

        // Handle specific click actions based on notification data
        const { data, options } = notificationData;
        if (data.clickAction) {
            const handler = this.actionHandlers[data.clickAction];
            if (handler) {
                handler(data);
            }
        }

        // Add to history
        this.addToHistory(notificationId, options, 'clicked');
    }

    handleNotificationAction(notificationId, actionType, actionValue) {
        const notificationData = this.activeNotifications.get(notificationId);
        if (!notificationData) return;

        console.log(`Notification action: ${notificationId}, ${actionType}, ${actionValue}`);

        const { data, options } = notificationData;
        
        // Handle button actions
        if (actionType === 'action' && options.actions && options.actions[actionValue]) {
            const action = options.actions[actionValue];
            const handler = this.actionHandlers[action.action];
            if (handler) {
                handler(data);
            }
        }

        // Add to history
        this.addToHistory(notificationId, options, `action:${actionType}:${actionValue}`);
    }

    generateToastXml(options) {
        // Generate Windows Toast XML for custom notifications
        const xml = `
        <toast>
            <visual>
                <binding template="ToastGeneric">
                    <text>${options.title || 'MadEasy Browser'}</text>
                    <text>${options.body || ''}</text>
                    ${options.image ? `<image src="${options.image}"/>` : ''}
                    ${options.progress ? `
                    <progress
                        value="${options.progress.value || 0}"
                        max="${options.progress.max || 100}"
                        valueStringOverride="${options.progress.value || 0}%"
                        status="${options.progress.status || 'normal'}"
                    />
                    ` : ''}
                </binding>
            </visual>
            ${options.actions && options.actions.length ? `
            <actions>
                ${options.actions.map((action, index) => `
                <action
                    content="${action.text}"
                    arguments="action=${action.action || index}"
                    activationType="${action.activationType || 'foreground'}"
                />
                `).join('')}
            </actions>
            ` : ''}
            ${options.audio ? `
            <audio src="${options.audio}" loop="${options.audioLoop || false}"/>
            ` : ''}
        </toast>
        `;

        return xml.replace(/\s+/g, ' ').trim();
    }

    generateNotificationId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addToHistory(id, options, event) {
        this.notificationHistory.push({
            id,
            title: options.title,
            body: options.body,
            event,
            timestamp: Date.now()
        });

        // Keep only last 100 notifications in history
        if (this.notificationHistory.length > 100) {
            this.notificationHistory = this.notificationHistory.slice(-100);
        }
    }

    getNotificationHistory() {
        return this.notificationHistory.slice().reverse(); // Most recent first
    }

    clearNotificationHistory() {
        this.notificationHistory = [];
        return { success: true };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('Notification settings updated:', this.settings);
        return { success: true, settings: this.settings };
    }

    // Predefined notification methods for common scenarios
    showDownloadComplete(filename, filePath) {
        return this.showNotification({
            template: 'download',
            title: 'Download Complete',
            body: `${filename} has been downloaded`,
            data: {
                filePath,
                clickAction: 'open-file'
            },
            actions: [
                { text: 'Open File', action: 'open-file' },
                { text: 'Show in Folder', action: 'show-in-folder' }
            ]
        });
    }

    showSecurityAlert(title, message, severity = 'warning') {
        return this.showNotification({
            template: 'security',
            title: `Security Alert: ${title}`,
            body: message,
            urgency: severity === 'critical' ? 'critical' : 'normal',
            data: {
                clickAction: 'open-security-center'
            },
            actions: [
                { text: 'View Details', action: 'open-security-center' },
                { text: 'Dismiss', action: 'dismiss' }
            ]
        });
    }

    showUpdateAvailable(version) {
        return this.showNotification({
            template: 'update',
            title: 'Update Available',
            body: `MadEasy Browser ${version} is available`,
            data: {
                version,
                clickAction: 'install-update'
            },
            actions: [
                { text: 'Install Now', action: 'install-update' },
                { text: 'Later', action: 'dismiss' }
            ]
        });
    }

    showAIResponse(title, message, chatData) {
        return this.showNotification({
            template: 'ai',
            title: `AI Assistant: ${title}`,
            body: message,
            data: {
                ...chatData,
                clickAction: 'view-ai-response'
            },
            actions: [
                { text: 'View Response', action: 'view-ai-response' },
                { text: 'Continue Chat', action: 'view-ai-response' }
            ]
        });
    }

    showBookmarkReminder(title, url) {
        return this.showNotification({
            template: 'bookmark',
            title: 'Bookmark Reminder',
            body: `Remember to check: ${title}`,
            data: {
                url,
                clickAction: 'open-url'
            },
            actions: [
                { text: 'Open', action: 'open-url' },
                { text: 'Edit', action: 'edit-bookmark' }
            ]
        });
    }
}

module.exports = WindowsNotifications;
