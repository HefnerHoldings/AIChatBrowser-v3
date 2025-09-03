import { EventEmitter } from 'events';
import { NativeBrowserEngine, BrowserEngineType, BrowserTab, BrowserContextOptions } from './browser-engine';
import { randomUUID } from 'crypto';

// Browser instance configuration
export interface BrowserInstance {
  id: string;
  engine: NativeBrowserEngine;
  type: BrowserEngineType;
  tabs: Map<string, BrowserTab>;
  profile?: string;
  isIncognito: boolean;
  createdAt: Date;
  lastActiveAt: Date;
}

// Browser profile configuration
export interface BrowserProfile {
  id: string;
  name: string;
  userAgent?: string;
  viewport?: { width: number; height: number };
  cookies?: any[];
  extensions?: string[];
  proxy?: any;
  customHeaders?: Record<string, string>;
}

// Browser manager for handling multiple browser instances
export class BrowserManager extends EventEmitter {
  private instances: Map<string, BrowserInstance> = new Map();
  private profiles: Map<string, BrowserProfile> = new Map();
  private activeInstanceId?: string;
  private maxInstances: number = 10;
  private processIsolation: boolean = true;

  constructor(options?: { maxInstances?: number; processIsolation?: boolean }) {
    super();
    if (options?.maxInstances) {
      this.maxInstances = options.maxInstances;
    }
    if (options?.processIsolation !== undefined) {
      this.processIsolation = options.processIsolation;
    }
  }

  // Create new browser instance
  async createInstance(options?: {
    type?: BrowserEngineType;
    profile?: string;
    isIncognito?: boolean;
    contextOptions?: BrowserContextOptions;
  }): Promise<string> {
    if (this.instances.size >= this.maxInstances) {
      throw new Error(`Maximum number of browser instances (${this.maxInstances}) reached`);
    }

    const instanceId = randomUUID();
    const engineType = options?.type || BrowserEngineType.CHROMIUM;
    const engine = new NativeBrowserEngine(engineType);

    // Apply profile if specified
    let contextOptions = options?.contextOptions || {};
    if (options?.profile) {
      const profile = this.profiles.get(options.profile);
      if (profile) {
        contextOptions = {
          ...contextOptions,
          userAgent: profile.userAgent,
          viewport: profile.viewport,
          extraHTTPHeaders: profile.customHeaders,
          proxy: profile.proxy
        };
      }
    }

    // Initialize browser engine
    await engine.initialize(contextOptions);

    // Set up engine event listeners
    engine.on('performance', (data) => {
      this.emit('performance', { instanceId, ...data });
    });

    engine.on('network', (data) => {
      this.emit('network', { instanceId, ...data });
    });

    engine.on('console', (data) => {
      this.emit('console', { instanceId, ...data });
    });

    engine.on('exception', (data) => {
      this.emit('exception', { instanceId, ...data });
    });

    engine.on('disconnected', () => {
      this.emit('disconnected', { instanceId });
      this.instances.delete(instanceId);
    });

    // Create browser instance
    const instance: BrowserInstance = {
      id: instanceId,
      engine,
      type: engineType,
      tabs: new Map(),
      profile: options?.profile,
      isIncognito: options?.isIncognito || false,
      createdAt: new Date(),
      lastActiveAt: new Date()
    };

    this.instances.set(instanceId, instance);
    this.activeInstanceId = instanceId;

    this.emit('instanceCreated', { instanceId, type: engineType });

    return instanceId;
  }

  // Close browser instance
  async closeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.close();
      this.instances.delete(instanceId);
      
      if (this.activeInstanceId === instanceId) {
        // Set another instance as active
        const remainingInstances = Array.from(this.instances.keys());
        this.activeInstanceId = remainingInstances[0];
      }

      this.emit('instanceClosed', { instanceId });
    }
  }

  // Get active instance
  getActiveInstance(): BrowserInstance | undefined {
    if (this.activeInstanceId) {
      return this.instances.get(this.activeInstanceId);
    }
    return undefined;
  }

  // Set active instance
  setActiveInstance(instanceId: string): void {
    if (this.instances.has(instanceId)) {
      this.activeInstanceId = instanceId;
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.lastActiveAt = new Date();
      }
      this.emit('instanceActivated', { instanceId });
    }
  }

  // Get all instances
  getAllInstances(): BrowserInstance[] {
    return Array.from(this.instances.values());
  }

  // Create new tab in instance
  async createTab(instanceId: string, url?: string, options?: BrowserContextOptions): Promise<BrowserTab> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Browser instance not found');
    }

    const tab = await instance.engine.createTab(url, options);
    instance.tabs.set(tab.id, tab);
    instance.lastActiveAt = new Date();

    this.emit('tabCreated', { instanceId, tab });

    return tab;
  }

  // Close tab
  async closeTab(instanceId: string, tabId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.closeTab(tabId);
      instance.tabs.delete(tabId);
      
      this.emit('tabClosed', { instanceId, tabId });
    }
  }

  // Navigate in tab
  async navigate(instanceId: string, tabId: string, url: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.navigate(tabId, url);
      const tab = instance.tabs.get(tabId);
      if (tab) {
        tab.url = url;
      }
      
      this.emit('navigation', { instanceId, tabId, url });
    }
  }

  // Execute script in tab
  async executeScript(instanceId: string, tabId: string, script: string): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      return await instance.engine.executeScript(tabId, script);
    }
    return null;
  }

  // Take screenshot of tab
  async screenshot(instanceId: string, tabId: string, options?: any): Promise<Buffer> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      return await instance.engine.screenshot(tabId, options);
    }
    throw new Error('Instance not found');
  }

  // Create browser profile
  createProfile(profile: BrowserProfile): void {
    this.profiles.set(profile.id, profile);
    this.emit('profileCreated', { profile });
  }

  // Update browser profile
  updateProfile(profileId: string, updates: Partial<BrowserProfile>): void {
    const profile = this.profiles.get(profileId);
    if (profile) {
      Object.assign(profile, updates);
      this.emit('profileUpdated', { profileId, updates });
    }
  }

  // Delete browser profile
  deleteProfile(profileId: string): void {
    this.profiles.delete(profileId);
    this.emit('profileDeleted', { profileId });
  }

  // Get all profiles
  getAllProfiles(): BrowserProfile[] {
    return Array.from(this.profiles.values());
  }

  // Get instance performance metrics
  async getPerformanceMetrics(instanceId: string, tabId: string): Promise<any> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      return await instance.engine.getMetrics(tabId);
    }
    return null;
  }

  // Clear browser data
  async clearBrowserData(instanceId: string, tabId: string, options?: {
    cookies?: boolean;
    cache?: boolean;
    localStorage?: boolean;
    sessionStorage?: boolean;
  }): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      if (options?.cookies) {
        await instance.engine.clearCookies(tabId);
      }
      if (options?.cache) {
        await instance.engine.clearCache(tabId);
      }
      // Additional clearing operations would go here
    }
  }

  // Set download behavior
  async setDownloadBehavior(instanceId: string, tabId: string, downloadPath: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.setDownloadBehavior(tabId, downloadPath);
    }
  }

  // Emulate device
  async emulateDevice(instanceId: string, tabId: string, deviceName: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.emulateDevice(tabId, deviceName);
    }
  }

  // Enable extensions for instance
  async enableExtensions(instanceId: string, extensions: string[]): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (instance) {
      await instance.engine.enableExtensions(extensions);
    }
  }

  // Clean up old instances
  async cleanup(maxAge: number = 3600000): Promise<void> {
    const now = Date.now();
    const instancesToClose: string[] = [];

    for (const [id, instance] of Array.from(this.instances.entries())) {
      const age = now - instance.lastActiveAt.getTime();
      if (age > maxAge) {
        instancesToClose.push(id);
      }
    }

    for (const id of instancesToClose) {
      await this.closeInstance(id);
    }

    this.emit('cleanup', { closed: instancesToClose.length });
  }

  // Get memory usage
  getMemoryUsage(): { instances: number; profiles: number; tabs: number } {
    let totalTabs = 0;
    for (const instance of Array.from(this.instances.values())) {
      totalTabs += instance.tabs.size;
    }

    return {
      instances: this.instances.size,
      profiles: this.profiles.size,
      tabs: totalTabs
    };
  }

  // Shutdown all instances
  async shutdown(): Promise<void> {
    const instanceIds = Array.from(this.instances.keys());
    
    for (const id of instanceIds) {
      await this.closeInstance(id);
    }

    this.emit('shutdown');
  }
}

// Export singleton instance
export const browserManager = new BrowserManager({
  maxInstances: 10,
  processIsolation: true
});