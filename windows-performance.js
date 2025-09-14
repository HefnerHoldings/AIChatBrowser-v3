const { app, powerMonitor, systemPreferences } = require('electron');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Windows Performance Optimizer for MadEasy Browser
class WindowsPerformance {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.performanceSettings = {
            gpuAcceleration: true,
            hardwareDecoding: true,
            memoryOptimization: true,
            diskCaching: true,
            networkOptimization: true
        };
        this.systemInfo = this.getSystemInfo();
        this.setupPerformanceOptimizations();
    }

    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            osRelease: os.release(),
            osVersion: os.version(),
            userInfo: os.userInfo(),
            networkInterfaces: os.networkInterfaces()
        };
    }

    setupPerformanceOptimizations() {
        if (process.platform !== 'win32') return;

        console.log('Setting up Windows performance optimizations...');
        
        // GPU and hardware acceleration
        this.optimizeGPU();
        
        // Memory management
        this.optimizeMemory();
        
        // Disk and I/O optimization
        this.optimizeDiskIO();
        
        // Network optimization
        this.optimizeNetwork();
        
        // Power management
        this.optimizePowerManagement();
        
        // Monitor system performance
        this.startPerformanceMonitoring();
    }

    optimizeGPU() {
        if (!this.performanceSettings.gpuAcceleration) return;

        console.log('Optimizing GPU acceleration...');

        // Enable GPU acceleration
        app.commandLine.appendSwitch('enable-gpu-rasterization');
        app.commandLine.appendSwitch('enable-gpu-memory-buffer-video-frames');
        app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
        app.commandLine.appendSwitch('enable-gpu-sandbox');

        // Hardware video decoding
        if (this.performanceSettings.hardwareDecoding) {
            app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
            app.commandLine.appendSwitch('enable-accelerated-video-decode');
            app.commandLine.appendSwitch('enable-accelerated-mjpeg-decode');
        }

        // DirectWrite for better text rendering on Windows
        app.commandLine.appendSwitch('enable-directwrite');

        // Windows-specific GPU optimizations
        const windowsVersion = this.getWindowsVersion();
        if (windowsVersion >= 10) {
            // Windows 10/11 optimizations
            app.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion');
            app.commandLine.appendSwitch('enable-win32k-lockdown');
        }

        // Detect dedicated GPU
        this.detectAndOptimizeGPU();
    }

    optimizeMemory() {
        if (!this.performanceSettings.memoryOptimization) return;

        console.log('Optimizing memory usage...');

        // Memory pressure handling
        app.commandLine.appendSwitch('memory-pressure-off');
        
        // Garbage collection optimization
        app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
        app.commandLine.appendSwitch('js-flags', '--optimize-for-size');

        // V8 optimizations
        if (this.systemInfo.totalMemory > 8 * 1024 * 1024 * 1024) { // > 8GB RAM
            app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
        }

        // Memory monitoring
        setInterval(() => {
            this.monitorMemoryUsage();
        }, 30000); // Check every 30 seconds
    }

    optimizeDiskIO() {
        if (!this.performanceSettings.diskCaching) return;

        console.log('Optimizing disk I/O...');

        // Disk cache optimization
        app.commandLine.appendSwitch('disk-cache-size', '1073741824'); // 1GB cache
        app.commandLine.appendSwitch('media-cache-size', '268435456'); // 256MB media cache

        // Enable async disk operations
        app.commandLine.appendSwitch('enable-async-disk-task-scheduler');

        // Preload resources
        app.commandLine.appendSwitch('enable-resource-prefetch');

        // Setup cache directory on fastest drive
        this.setupOptimalCacheLocation();
    }

    optimizeNetwork() {
        if (!this.performanceSettings.networkOptimization) return;

        console.log('Optimizing network performance...');

        // HTTP/2 and QUIC
        app.commandLine.appendSwitch('enable-quic');
        app.commandLine.appendSwitch('enable-features', 'NetworkService');

        // DNS optimization
        app.commandLine.appendSwitch('enable-async-dns');
        app.commandLine.appendSwitch('enable-features', 'AsyncDns');

        // Connection optimization
        app.commandLine.appendSwitch('max-connections-per-host', '16');
        app.commandLine.appendSwitch('enable-tcp-fast-open');

        // Prefetching
        app.commandLine.appendSwitch('enable-features', 'PrefetchPrivacyChanges');
    }

    optimizePowerManagement() {
        console.log('Setting up power management...');

        // Monitor power state
        powerMonitor.on('suspend', () => {
            console.log('System is going to sleep - reducing activity');
            this.reduceBrowserActivity();
        });

        powerMonitor.on('resume', () => {
            console.log('System resumed - restoring activity');
            this.restoreBrowserActivity();
        });

        powerMonitor.on('on-ac', () => {
            console.log('Plugged in - enabling high performance');
            this.enableHighPerformanceMode();
        });

        powerMonitor.on('on-battery', () => {
            console.log('On battery - enabling power saving');
            this.enablePowerSavingMode();
        });
    }

    startPerformanceMonitoring() {
        console.log('Starting performance monitoring...');

        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 10000); // Collect metrics every 10 seconds

        // CPU usage monitoring
        setInterval(() => {
            this.monitorCPUUsage();
        }, 5000);

        // GPU monitoring (if available)
        this.startGPUMonitoring();
    }

    detectAndOptimizeGPU() {
        try {
            // Try to detect GPU information
            const gpuInfo = app.getGPUFeatureStatus();
            console.log('GPU Feature Status:', gpuInfo);

            // Optimize based on GPU capabilities
            if (gpuInfo.gpu_compositing === 'enabled') {
                app.commandLine.appendSwitch('enable-gpu-compositing');
            }

            if (gpuInfo.webgl === 'enabled') {
                app.commandLine.appendSwitch('enable-webgl');
                app.commandLine.appendSwitch('enable-webgl2-compute-context');
            }
        } catch (error) {
            console.log('Could not detect GPU features:', error.message);
        }
    }

    setupOptimalCacheLocation() {
        try {
            // Find the fastest drive (usually C: drive on Windows)
            const drives = this.getAvailableDrives();
            const fastestDrive = drives.find(drive => drive.type === 'SSD') || drives[0];
            
            if (fastestDrive) {
                const cacheDir = path.join(fastestDrive.root, 'MadEasyBrowser', 'Cache');
                app.commandLine.appendSwitch('disk-cache-dir', cacheDir);
                
                // Ensure cache directory exists
                if (!fs.existsSync(cacheDir)) {
                    fs.mkdirSync(cacheDir, { recursive: true });
                }
            }
        } catch (error) {
            console.log('Could not setup optimal cache location:', error.message);
        }
    }

    getAvailableDrives() {
        // Simplified drive detection - in real implementation, use Windows APIs
        return [
            { root: 'C:', type: 'SSD' },
            { root: 'D:', type: 'HDD' }
        ];
    }

    monitorMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
            total: this.systemInfo.totalMemory,
            free: os.freemem(),
            used: this.systemInfo.totalMemory - os.freemem()
        };

        const memoryPercentage = (systemMemory.used / systemMemory.total) * 100;

        if (memoryPercentage > 85) {
            console.warn('High memory usage detected:', memoryPercentage + '%');
            this.triggerMemoryCleanup();
        }

        // Send to renderer for display
        this.mainWindow.webContents.send('performance-memory-update', {
            process: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024),
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                external: Math.round(memoryUsage.external / 1024 / 1024)
            },
            system: {
                total: Math.round(systemMemory.total / 1024 / 1024),
                free: Math.round(systemMemory.free / 1024 / 1024),
                used: Math.round(systemMemory.used / 1024 / 1024),
                percentage: Math.round(memoryPercentage)
            }
        });
    }

    monitorCPUUsage() {
        const cpuUsage = process.cpuUsage();
        
        // Simple CPU monitoring - in production, use more sophisticated methods
        this.mainWindow.webContents.send('performance-cpu-update', {
            user: cpuUsage.user,
            system: cpuUsage.system,
            cores: this.systemInfo.cpus
        });
    }

    startGPUMonitoring() {
        // GPU monitoring would require additional native modules
        // For now, we'll use basic GPU info
        try {
            const gpuInfo = app.getGPUInfo('complete');
            gpuInfo.then(info => {
                this.mainWindow.webContents.send('performance-gpu-update', info);
            }).catch(error => {
                console.log('GPU monitoring not available:', error.message);
            });
        } catch (error) {
            console.log('GPU monitoring not supported:', error.message);
        }
    }

    collectPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            system: {
                loadavg: os.loadavg(),
                uptime: os.uptime(),
                freemem: os.freemem(),
                totalmem: os.totalmem()
            }
        };

        // Send to renderer for performance dashboard
        this.mainWindow.webContents.send('performance-metrics-update', metrics);
    }

    triggerMemoryCleanup() {
        console.log('Triggering memory cleanup...');
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        // Clear caches
        this.mainWindow.webContents.session.clearCache();
        
        // Notify renderer to clean up
        this.mainWindow.webContents.send('memory-cleanup-required');
    }

    reduceBrowserActivity() {
        // Reduce activity when system is going to sleep
        console.log('Reducing browser activity for power saving');
        
        // Pause timers, reduce refresh rates, etc.
        this.mainWindow.webContents.send('reduce-activity');
    }

    restoreBrowserActivity() {
        // Restore full activity when system resumes
        console.log('Restoring full browser activity');
        
        this.mainWindow.webContents.send('restore-activity');
    }

    enableHighPerformanceMode() {
        console.log('Enabling high performance mode');
        
        // Enable all performance features
        this.performanceSettings.gpuAcceleration = true;
        this.performanceSettings.hardwareDecoding = true;
        
        this.mainWindow.webContents.send('performance-mode-changed', { mode: 'high-performance' });
    }

    enablePowerSavingMode() {
        console.log('Enabling power saving mode');
        
        // Reduce performance for battery saving
        this.mainWindow.webContents.send('performance-mode-changed', { mode: 'power-saving' });
    }

    getWindowsVersion() {
        try {
            const version = os.release();
            const major = parseInt(version.split('.')[0]);
            return major;
        } catch (error) {
            return 10; // Default to Windows 10
        }
    }

    // Get performance statistics
    getPerformanceStats() {
        return {
            systemInfo: this.systemInfo,
            performanceSettings: this.performanceSettings,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
    }

    // Update performance settings
    updatePerformanceSettings(newSettings) {
        this.performanceSettings = { ...this.performanceSettings, ...newSettings };
        console.log('Performance settings updated:', this.performanceSettings);
        
        // Apply changes that can be changed at runtime
        if (newSettings.hasOwnProperty('memoryOptimization')) {
            // Restart memory monitoring with new settings
            this.optimizeMemory();
        }
    }
}

module.exports = WindowsPerformance;
