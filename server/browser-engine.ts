import { EventEmitter } from 'events';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Protocol } from 'puppeteer';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Browser engine types
export enum BrowserEngineType {
  CHROMIUM = 'chromium',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
  WEBVIEW2 = 'webview2',
  ELECTRON = 'electron'
}

// Browser capabilities
export interface BrowserCapabilities {
  javascript: boolean;
  cookies: boolean;
  localStorage: boolean;
  webGL: boolean;
  webRTC: boolean;
  canvas: boolean;
  audio: boolean;
  video: boolean;
  plugins: boolean;
}

// Browser context options
export interface BrowserContextOptions {
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
  timezone?: string;
  geolocation?: { latitude: number; longitude: number };
  permissions?: string[];
  extraHTTPHeaders?: Record<string, string>;
  httpCredentials?: { username: string; password: string };
  offline?: boolean;
  cacheEnabled?: boolean;
  javaScriptEnabled?: boolean;
  bypassCSP?: boolean;
  ignoreHTTPSErrors?: boolean;
  deviceScaleFactor?: number;
  userDataDir?: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
    bypass?: string[];
  };
}

// Browser tab interface
export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  processId?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// Simulated tab for fallback mode
class SimulatedTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean = false;
  canGoBack: boolean = false;
  canGoForward: boolean = false;
  history: string[] = [];
  historyIndex: number = 0;

  constructor(id: string, url: string = 'about:blank') {
    this.id = id;
    this.url = url;
    this.title = url === 'about:home' ? 'Ny fane' : 'Loading...';
  }

  async goto(url: string): Promise<void> {
    this.url = url;
    this.title = url === 'about:home' ? 'Ny fane' : url;
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.canGoBack = this.historyIndex > 0;
    this.canGoForward = false;
  }

  goBack(): boolean {
    if (this.canGoBack && this.historyIndex > 0) {
      this.historyIndex--;
      this.url = this.history[this.historyIndex];
      this.title = this.url === 'about:home' ? 'Ny fane' : this.url;
      this.canGoBack = this.historyIndex > 0;
      this.canGoForward = true;
      return true;
    }
    return false;
  }

  goForward(): boolean {
    if (this.canGoForward && this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.url = this.history[this.historyIndex];
      this.title = this.url === 'about:home' ? 'Ny fane' : this.url;
      this.canGoBack = true;
      this.canGoForward = this.historyIndex < this.history.length - 1;
      return true;
    }
    return false;
  }
}

// Native browser engine implementation
export class NativeBrowserEngine extends EventEmitter {
  private engineType: BrowserEngineType;
  private browser?: Browser;
  private pages: Map<string, Page> = new Map();
  private simulatedTabs: Map<string, SimulatedTab> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private contexts: Map<string, any> = new Map();
  private performance: Map<string, any> = new Map();
  private isSimulated: boolean = false;
  
  constructor(engineType: BrowserEngineType = BrowserEngineType.CHROMIUM) {
    super();
    this.engineType = engineType;
  }

  // Initialize browser engine
  async initialize(options: BrowserContextOptions = {}): Promise<void> {
    switch (this.engineType) {
      case BrowserEngineType.CHROMIUM:
        await this.initializeChromium(options);
        break;
      case BrowserEngineType.FIREFOX:
        await this.initializeFirefox(options);
        break;
      case BrowserEngineType.WEBKIT:
        await this.initializeWebKit(options);
        break;
      case BrowserEngineType.WEBVIEW2:
        await this.initializeWebView2(options);
        break;
      case BrowserEngineType.ELECTRON:
        await this.initializeElectron(options);
        break;
    }
  }

  // Initialize Chromium engine with real Puppeteer
  private async initializeChromium(options: BrowserContextOptions): Promise<void> {
    try {
      // Try to launch real Puppeteer browser
      console.log('Attempting to launch real Chromium browser...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          ...(options.ignoreHTTPSErrors ? ['--ignore-certificate-errors'] : [])
        ]
      });
      
      console.log('Real Chromium browser launched successfully');
      this.emit('connected');
      this.contexts.set('default', options);
    } catch (error) {
      console.log('Failed to launch real browser, falling back to simulation:', error);
      // Fallback to simulation
      console.log('Initializing simulated browser with options:', options);
      this.isSimulated = true;
      this.emit('connected');
      this.contexts.set('default', options);
    }
  }

  // Initialize Firefox engine (simulated for web environment)
  private async initializeFirefox(options: BrowserContextOptions): Promise<void> {
    // Simulate Firefox initialization
    console.log('Initializing simulated Firefox with options:', options);
    this.emit('connected');
    this.contexts.set('default', options);
  }

  // Initialize WebKit engine
  private async initializeWebKit(options: BrowserContextOptions): Promise<void> {
    // WebKit support would require playwright or similar
    // For now, fallback to Chromium
    await this.initializeChromium(options);
  }

  // Initialize WebView2 engine (Windows only)
  private async initializeWebView2(options: BrowserContextOptions): Promise<void> {
    // WebView2 requires native Windows integration
    // This would use Edge WebView2 runtime
    if (process.platform === 'win32') {
      // Spawn WebView2 process
      const webview2Path = 'C:\\Program Files (x86)\\Microsoft\\EdgeWebView\\Application\\msedgewebview2.exe';
      const webview2Process = spawn(webview2Path, [
        '--user-data-dir=' + (options.userDataDir || path.join(process.env.TEMP || '', 'webview2')),
        '--enable-features=NetworkService'
      ]);
      
      this.processes.set('webview2-main', webview2Process);
      
      // Fallback to Chromium for now
      await this.initializeChromium(options);
    } else {
      // Fallback to Chromium on non-Windows
      await this.initializeChromium(options);
    }
  }

  // Initialize Electron engine
  private async initializeElectron(options: BrowserContextOptions): Promise<void> {
    // Electron requires special initialization
    // For now, fallback to Chromium
    await this.initializeChromium(options);
  }

  // Setup page with options
  private async setupPage(page: Page, options: BrowserContextOptions): Promise<void> {
    // Set user agent
    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    // Set viewport
    if (options.viewport) {
      await page.setViewport(options.viewport);
    }

    // Set geolocation
    if (options.geolocation) {
      await page.setGeolocation(options.geolocation);
    }

    // Set extra headers
    if (options.extraHTTPHeaders) {
      await page.setExtraHTTPHeaders(options.extraHTTPHeaders);
    }

    // Set JavaScript enabled
    if (options.javaScriptEnabled !== undefined) {
      await page.setJavaScriptEnabled(options.javaScriptEnabled);
    }

    // Set offline mode
    if (options.offline) {
      await page.setOfflineMode(true);
    }

    // Set cache enabled
    if (options.cacheEnabled !== undefined) {
      await page.setCacheEnabled(options.cacheEnabled);
    }

    // Set bypass CSP
    if (options.bypassCSP) {
      await page.setBypassCSP(true);
    }

    // Set up performance monitoring
    await this.setupPerformanceMonitoring(page);

    // Set up request interception
    await this.setupRequestInterception(page);
  }

  // Setup performance monitoring
  private async setupPerformanceMonitoring(page: Page): Promise<void> {
    const client = await page.target().createCDPSession();
    
    // Enable performance monitoring
    await client.send('Performance.enable');
    
    // Monitor performance metrics
    client.on('Performance.metrics', (data) => {
      const pageUrl = page.url();
      this.performance.set(pageUrl, data.metrics);
      this.emit('performance', { url: pageUrl, metrics: data.metrics });
    });

    // Enable network monitoring
    await client.send('Network.enable');
    
    // Monitor network activity
    client.on('Network.loadingFinished', (data) => {
      this.emit('network', { type: 'finished', data });
    });

    client.on('Network.loadingFailed', (data) => {
      this.emit('network', { type: 'failed', data });
    });

    // Enable runtime monitoring
    await client.send('Runtime.enable');
    
    // Monitor console messages
    client.on('Runtime.consoleAPICalled', (data) => {
      this.emit('console', data);
    });

    // Monitor JavaScript exceptions
    client.on('Runtime.exceptionThrown', (data) => {
      this.emit('exception', data);
    });
  }

  // Setup request interception
  private async setupRequestInterception(page: Page): Promise<void> {
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      // Emit request event
      this.emit('request', {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });

      // Allow customization of requests
      if (this.listenerCount('intercept') > 0) {
        this.emit('intercept', request, (action: string, options?: any) => {
          if (action === 'abort') {
            request.abort();
          } else if (action === 'respond') {
            request.respond(options);
          } else {
            request.continue(options);
          }
        });
      } else {
        request.continue();
      }
    });

    page.on('response', (response) => {
      this.emit('response', {
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    });
  }

  // Create new tab
  async createTab(url?: string, options?: BrowserContextOptions): Promise<BrowserTab> {
    const tabId = `tab-${Date.now()}`;
    
    if (this.isSimulated) {
      // Create simulated tab
      const tab = new SimulatedTab(tabId, url || 'about:home');
      this.simulatedTabs.set(tabId, tab);
      
      if (url) {
        await tab.goto(url);
      }
      
      return {
        id: tabId,
        url: tab.url,
        title: tab.title,
        isLoading: tab.isLoading,
        canGoBack: tab.canGoBack,
        canGoForward: tab.canGoForward
      };
    }
    
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    this.pages.set(tabId, page);
    
    if (options) {
      await this.setupPage(page, options);
    }

    if (url) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    return {
      id: tabId,
      url: page.url(),
      title: await page.title(),
      isLoading: false,
      canGoBack: false,
      canGoForward: false
    };
  }

  // Close tab
  async closeTab(tabId: string): Promise<void> {
    if (this.isSimulated) {
      this.simulatedTabs.delete(tabId);
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.close();
      this.pages.delete(tabId);
    }
  }

  // Navigate to URL
  async navigate(tabId: string, url: string): Promise<void> {
    if (this.isSimulated) {
      const tab = this.simulatedTabs.get(tabId);
      if (tab) {
        await tab.goto(url);
      }
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
    }
  }

  // Go back
  async goBack(tabId: string): Promise<void> {
    if (this.isSimulated) {
      const tab = this.simulatedTabs.get(tabId);
      if (tab) {
        tab.goBack();
      }
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.goBack();
    }
  }

  // Go forward
  async goForward(tabId: string): Promise<void> {
    if (this.isSimulated) {
      const tab = this.simulatedTabs.get(tabId);
      if (tab) {
        tab.goForward();
      }
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.goForward();
    }
  }

  // Refresh page
  async refresh(tabId: string): Promise<void> {
    if (this.isSimulated) {
      // Simulated refresh - just emit event
      const tab = this.simulatedTabs.get(tabId);
      if (tab) {
        this.emit('refresh', { tabId, url: tab.url });
      }
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.reload();
    }
  }

  // Execute JavaScript
  async executeScript(tabId: string, script: string): Promise<any> {
    if (this.isSimulated) {
      // Return mock response for simulated mode
      return null;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      return await page.evaluate(script);
    }
  }

  // Take screenshot
  async screenshot(tabId: string, options?: any): Promise<Buffer> {
    if (this.isSimulated) {
      // Return a placeholder screenshot for simulated mode
      return Buffer.from('');
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      const screenshot = await page.screenshot(options);
      return Buffer.isBuffer(screenshot) ? screenshot : Buffer.from(screenshot);
    }
    throw new Error('Tab not found');
  }

  // Get page metrics
  async getMetrics(tabId: string): Promise<any> {
    if (this.isSimulated) {
      // Return mock metrics for simulated mode
      return {
        Timestamp: Date.now(),
        Documents: 1,
        Frames: 1,
        JSEventListeners: 0,
        Nodes: 100,
        LayoutCount: 1,
        RecalcStyleCount: 1,
        LayoutDuration: 0.01,
        RecalcStyleDuration: 0.01,
        ScriptDuration: 0.01,
        TaskDuration: 0.01,
        JSHeapUsedSize: 1000000,
        JSHeapTotalSize: 2000000
      };
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      return await page.metrics();
    }
    return null;
  }

  // Get browser capabilities
  async getCapabilities(): Promise<BrowserCapabilities> {
    return {
      javascript: true,
      cookies: true,
      localStorage: true,
      webGL: true,
      webRTC: true,
      canvas: true,
      audio: true,
      video: true,
      plugins: true
    };
  }

  // Set cookies
  async setCookies(tabId: string, cookies: any[]): Promise<void> {
    if (this.isSimulated) {
      // Store cookies in simulation mode (no-op for now)
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      await page.setCookie(...cookies);
    }
  }

  // Get cookies
  async getCookies(tabId: string): Promise<any[]> {
    if (this.isSimulated) {
      // Return empty array for simulated mode
      return [];
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      return await page.cookies();
    }
    return [];
  }

  // Clear cookies
  async clearCookies(tabId: string): Promise<void> {
    if (this.isSimulated) {
      // Clear cookies in simulation mode (no-op for now)
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
    }
  }

  // Clear cache
  async clearCache(tabId: string): Promise<void> {
    if (this.isSimulated) {
      // Clear cache in simulation mode (no-op for now)
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCache');
    }
  }

  // Get performance stats
  getPerformanceStats(url: string): any {
    return this.performance.get(url);
  }

  // Enable extensions
  async enableExtensions(extensions: string[]): Promise<void> {
    // Extension support would require browser restart with extension flags
    // This is a placeholder for extension management
    console.log('Extension support enabled for:', extensions);
  }

  // Set download behavior
  async setDownloadBehavior(tabId: string, downloadPath: string): Promise<void> {
    if (this.isSimulated) {
      // Set download behavior in simulation mode (no-op for now)
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      const client = await page.target().createCDPSession();
      await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath
      });
    }
  }

  // Emulate device
  async emulateDevice(tabId: string, deviceName: string): Promise<void> {
    if (this.isSimulated) {
      // Device emulation in simulation mode (no-op for now)
      return;
    }
    
    const page = this.pages.get(tabId);
    if (page) {
      // Device emulation - would need to import KnownDevices from puppeteer
      // For now, just set viewport and user agent based on device name
      const devicePresets: any = {
        'iPhone 12': { width: 390, height: 844, isMobile: true, hasTouch: true },
        'iPad': { width: 768, height: 1024, isMobile: true, hasTouch: true },
        'Desktop': { width: 1920, height: 1080, isMobile: false, hasTouch: false }
      };
      
      const preset = devicePresets[deviceName];
      if (preset) {
        await page.setViewport(preset);
      }
    }
  }

  // Close browser
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
    
    // Close any spawned processes
    for (const [, process] of Array.from(this.processes.entries())) {
      process.kill();
    }
    
    this.pages.clear();
    this.simulatedTabs.clear();
    this.processes.clear();
    this.contexts.clear();
    this.performance.clear();
  }
}

// Export singleton instance
export const browserEngine = new NativeBrowserEngine();