// Plugin SDK for marketplace items
import { EventEmitter } from 'events';
import { sandboxRuntime } from './sandbox-runtime';

// Plugin manifest structure
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  dependencies?: Record<string, string>;
  main: string;
  scripts?: {
    install?: string;
    uninstall?: string;
    activate?: string;
    deactivate?: string;
  };
  config?: PluginConfig;
  ui?: {
    toolbar?: boolean;
    sidebar?: boolean;
    contextMenu?: boolean;
    settings?: boolean;
  };
}

// Plugin configuration schema
export interface PluginConfig {
  schema: Record<string, any>;
  defaults: Record<string, any>;
  ui?: {
    type: 'form' | 'custom';
    component?: string;
  };
}

// Plugin lifecycle events
export enum PluginEvent {
  INSTALL = 'install',
  UNINSTALL = 'uninstall',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  CONFIG_CHANGE = 'config_change',
  ERROR = 'error'
}

// Plugin API interface
export interface PluginAPI {
  // Browser automation
  browser: {
    getCurrentTab: () => Promise<any>;
    openTab: (url: string) => Promise<any>;
    closeTab: (tabId: string) => Promise<void>;
    executeScript: (script: string) => Promise<any>;
    captureScreenshot: () => Promise<string>;
    findElements: (selector: string) => Promise<any[]>;
    clickElement: (selector: string) => Promise<void>;
    typeText: (selector: string, text: string) => Promise<void>;
    waitForElement: (selector: string, timeout?: number) => Promise<void>;
    scrollTo: (x: number, y: number) => Promise<void>;
  };

  // Data extraction
  data: {
    extractTable: (selector: string) => Promise<any[][]>;
    extractText: (selector: string) => Promise<string>;
    extractLinks: (selector?: string) => Promise<string[]>;
    extractImages: (selector?: string) => Promise<string[]>;
    extractMetadata: () => Promise<Record<string, any>>;
    parseJSON: (text: string) => any;
    parseCSV: (text: string) => any[][];
  };

  // Storage
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAll: () => Promise<Record<string, any>>;
  };

  // Network
  network: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
    interceptRequest: (pattern: string, handler: Function) => void;
    blockRequest: (pattern: string) => void;
    modifyHeaders: (headers: Record<string, string>) => void;
  };

  // AI services
  ai: {
    complete: (prompt: string, options?: any) => Promise<string>;
    classify: (text: string, categories: string[]) => Promise<string>;
    extract: (text: string, schema: any) => Promise<any>;
    summarize: (text: string, maxLength?: number) => Promise<string>;
    translate: (text: string, targetLang: string) => Promise<string>;
  };

  // UI extensions
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showDialog: (options: any) => Promise<any>;
    addToolbarButton: (button: any) => void;
    addContextMenuItem: (item: any) => void;
    addSidebarPanel: (panel: any) => void;
    showProgress: (progress: number, message?: string) => void;
  };

  // Events
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit: (event: string, data?: any) => void;
    once: (event: string, handler: Function) => void;
  };

  // Utilities
  utils: {
    delay: (ms: number) => Promise<void>;
    random: (min: number, max: number) => number;
    uuid: () => string;
    hash: (text: string) => string;
    encode: (text: string) => string;
    decode: (text: string) => string;
    clipboard: {
      read: () => Promise<string>;
      write: (text: string) => Promise<void>;
    };
  };

  // Workflow
  workflow: {
    getCurrentStep: () => any;
    nextStep: () => Promise<void>;
    previousStep: () => Promise<void>;
    jumpToStep: (stepId: string) => Promise<void>;
    getStepData: (stepId: string) => any;
    setStepData: (stepId: string, data: any) => void;
    getWorkflowData: () => any;
    setWorkflowData: (data: any) => void;
  };

  // Debugging
  debug: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    table: (data: any) => void;
    time: (label: string) => void;
    timeEnd: (label: string) => void;
  };
}

// Plugin base class
export abstract class Plugin extends EventEmitter {
  protected manifest: PluginManifest;
  protected api: PluginAPI;
  protected config: Record<string, any>;
  protected isActive: boolean = false;

  constructor(manifest: PluginManifest, api: PluginAPI) {
    super();
    this.manifest = manifest;
    this.api = api;
    this.config = manifest.config?.defaults || {};
  }

  // Lifecycle methods
  abstract onInstall(): Promise<void>;
  abstract onUninstall(): Promise<void>;
  abstract onActivate(): Promise<void>;
  abstract onDeactivate(): Promise<void>;
  abstract onConfigChange(newConfig: Record<string, any>): Promise<void>;

  // Core methods
  async execute(input: any): Promise<any> {
    if (!this.isActive) {
      throw new Error('Plugin is not active');
    }
    // Override in subclass
    return null;
  }

  // Getters
  getId(): string {
    return this.manifest.id;
  }

  getName(): string {
    return this.manifest.name;
  }

  getVersion(): string {
    return this.manifest.version;
  }

  getPermissions(): string[] {
    return this.manifest.permissions;
  }

  getConfig(): Record<string, any> {
    return this.config;
  }

  isActivated(): boolean {
    return this.isActive;
  }

  // Config management
  async updateConfig(newConfig: Record<string, any>): Promise<void> {
    const oldConfig = this.config;
    this.config = { ...this.config, ...newConfig };
    
    try {
      await this.onConfigChange(this.config);
      this.emit(PluginEvent.CONFIG_CHANGE, { old: oldConfig, new: this.config });
    } catch (error) {
      this.config = oldConfig; // Rollback on error
      throw error;
    }
  }

  // Activation management
  async activate(): Promise<void> {
    if (this.isActive) return;
    
    try {
      await this.onActivate();
      this.isActive = true;
      this.emit(PluginEvent.ACTIVATE);
    } catch (error) {
      this.emit(PluginEvent.ERROR, error);
      throw error;
    }
  }

  async deactivate(): Promise<void> {
    if (!this.isActive) return;
    
    try {
      await this.onDeactivate();
      this.isActive = false;
      this.emit(PluginEvent.DEACTIVATE);
    } catch (error) {
      this.emit(PluginEvent.ERROR, error);
      throw error;
    }
  }
}

// Playbook class for workflow automation
export class Playbook {
  private id: string;
  private name: string;
  private description: string;
  private steps: PlaybookStep[];
  private variables: Record<string, any>;
  private currentStepIndex: number = 0;

  constructor(
    id: string,
    name: string,
    description: string,
    steps: PlaybookStep[]
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.steps = steps;
    this.variables = {};
  }

  // Execute playbook
  async execute(api: PluginAPI, input?: any): Promise<any> {
    this.variables = { ...input };
    const results: any[] = [];

    for (let i = 0; i < this.steps.length; i++) {
      this.currentStepIndex = i;
      const step = this.steps[i];
      
      try {
        const result = await this.executeStep(step, api);
        results.push(result);
        
        // Store result in variables for next steps
        if (step.outputVariable) {
          this.variables[step.outputVariable] = result;
        }
        
        // Check conditions for next step
        if (step.condition && !this.evaluateCondition(step.condition)) {
          continue;
        }
      } catch (error) {
        if (step.onError === 'continue') {
          continue;
        } else if (step.onError === 'retry') {
          i--; // Retry current step
          await api.utils.delay(1000);
        } else {
          throw error; // Default: stop on error
        }
      }
    }

    return {
      success: true,
      results,
      variables: this.variables
    };
  }

  // Execute single step
  private async executeStep(step: PlaybookStep, api: PluginAPI): Promise<any> {
    const action = step.action;
    const params = this.resolveVariables(step.parameters);

    switch (action) {
      case 'navigate':
        return await api.browser.openTab(params.url);
      
      case 'click':
        return await api.browser.clickElement(params.selector);
      
      case 'type':
        return await api.browser.typeText(params.selector, params.text);
      
      case 'extract':
        return await api.data.extractText(params.selector);
      
      case 'wait':
        return await api.utils.delay(params.duration);
      
      case 'screenshot':
        return await api.browser.captureScreenshot();
      
      case 'ai_complete':
        return await api.ai.complete(params.prompt);
      
      case 'store':
        return await api.storage.set(params.key, params.value);
      
      case 'fetch':
        const response = await api.network.fetch(params.url, params.options);
        return await response.json();
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // Resolve variables in parameters
  private resolveVariables(params: any): any {
    if (typeof params === 'string') {
      // Replace {{variable}} with actual values
      return params.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return this.variables[varName] || match;
      });
    } else if (typeof params === 'object' && params !== null) {
      const resolved: any = {};
      for (const key in params) {
        resolved[key] = this.resolveVariables(params[key]);
      }
      return resolved;
    }
    return params;
  }

  // Evaluate condition
  private evaluateCondition(condition: string): boolean {
    try {
      // Simple condition evaluation (in production, use safe-eval)
      // Format: "variable == value" or "variable > value"
      const [left, operator, right] = condition.split(/\s+/);
      const leftValue = this.variables[left];
      const rightValue = isNaN(Number(right)) ? right : Number(right);

      switch (operator) {
        case '==': return leftValue == rightValue;
        case '!=': return leftValue != rightValue;
        case '>': return leftValue > rightValue;
        case '<': return leftValue < rightValue;
        case '>=': return leftValue >= rightValue;
        case '<=': return leftValue <= rightValue;
        default: return true;
      }
    } catch {
      return true; // Continue on evaluation error
    }
  }
}

// Playbook step interface
export interface PlaybookStep {
  id: string;
  name: string;
  action: string;
  parameters: Record<string, any>;
  outputVariable?: string;
  condition?: string;
  onError?: 'stop' | 'continue' | 'retry';
  retryCount?: number;
  timeout?: number;
}

// Plugin loader/manager
export class PluginLoader {
  private plugins: Map<string, Plugin> = new Map();
  private playbooks: Map<string, Playbook> = new Map();

  // Load plugin from code
  async loadPlugin(manifest: PluginManifest, code: string): Promise<Plugin> {
    try {
      // Create sandboxed API
      const api = this.createSandboxedAPI(manifest.permissions);
      
      // Evaluate plugin code in sandbox (simplified - use vm2 in production)
      const PluginClass = eval(`(${code})`);
      
      // Create plugin instance
      const plugin = new PluginClass(manifest, api);
      
      // Store plugin
      this.plugins.set(manifest.id, plugin);
      
      // Call install hook
      await plugin.onInstall();
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin: ${error}`);
    }
  }

  // Load playbook
  loadPlaybook(id: string, name: string, description: string, steps: PlaybookStep[]): Playbook {
    const playbook = new Playbook(id, name, description, steps);
    this.playbooks.set(id, playbook);
    return playbook;
  }

  // Create sandboxed API based on permissions
  private createSandboxedAPI(permissions: string[]): PluginAPI {
    const permSet = new Set(permissions);
    
    // Return API with permission checks
    return {
      browser: this.createBrowserAPI(permSet),
      data: this.createDataAPI(permSet),
      storage: this.createStorageAPI(permSet),
      network: this.createNetworkAPI(permSet),
      ai: this.createAIAPI(permSet),
      ui: this.createUIAPI(permSet),
      events: this.createEventsAPI(),
      utils: this.createUtilsAPI(permSet),
      workflow: this.createWorkflowAPI(permSet),
      debug: this.createDebugAPI()
    };
  }

  // Create browser API
  private createBrowserAPI(permissions: Set<string>): PluginAPI['browser'] {
    const checkPermission = (perm: string) => {
      if (!permissions.has(perm)) {
        throw new Error(`Permission denied: ${perm}`);
      }
    };

    return {
      getCurrentTab: async () => {
        checkPermission('browser_automation');
        return { id: 'tab-1', url: 'https://example.com' };
      },
      openTab: async (url: string) => {
        checkPermission('browser_automation');
        return { id: 'tab-2', url };
      },
      closeTab: async (tabId: string) => {
        checkPermission('browser_automation');
      },
      executeScript: async (script: string) => {
        checkPermission('browser_automation');
        return null;
      },
      captureScreenshot: async () => {
        checkPermission('browser_automation');
        return 'data:image/png;base64,mock';
      },
      findElements: async (selector: string) => {
        checkPermission('read_dom');
        return [];
      },
      clickElement: async (selector: string) => {
        checkPermission('write_dom');
      },
      typeText: async (selector: string, text: string) => {
        checkPermission('write_dom');
      },
      waitForElement: async (selector: string, timeout?: number) => {
        checkPermission('read_dom');
      },
      scrollTo: async (x: number, y: number) => {
        checkPermission('write_dom');
      }
    };
  }

  // Create data API
  private createDataAPI(permissions: Set<string>): PluginAPI['data'] {
    return {
      extractTable: async (selector: string) => [],
      extractText: async (selector: string) => '',
      extractLinks: async (selector?: string) => [],
      extractImages: async (selector?: string) => [],
      extractMetadata: async () => ({}),
      parseJSON: (text: string) => JSON.parse(text),
      parseCSV: (text: string) => [[]]
    };
  }

  // Create storage API
  private createStorageAPI(permissions: Set<string>): PluginAPI['storage'] {
    const checkPermission = () => {
      if (!permissions.has('storage')) {
        throw new Error('Permission denied: storage');
      }
    };

    const storage = new Map<string, any>();

    return {
      get: async (key: string) => {
        checkPermission();
        return storage.get(key);
      },
      set: async (key: string, value: any) => {
        checkPermission();
        storage.set(key, value);
      },
      remove: async (key: string) => {
        checkPermission();
        storage.delete(key);
      },
      clear: async () => {
        checkPermission();
        storage.clear();
      },
      getAll: async () => {
        checkPermission();
        return Object.fromEntries(storage);
      }
    };
  }

  // Create network API
  private createNetworkAPI(permissions: Set<string>): PluginAPI['network'] {
    const checkPermission = () => {
      if (!permissions.has('network')) {
        throw new Error('Permission denied: network');
      }
    };

    return {
      fetch: async (url: string, options?: RequestInit) => {
        checkPermission();
        // Mock response
        return new Response('{}', { status: 200 });
      },
      interceptRequest: (pattern: string, handler: Function) => {
        checkPermission();
      },
      blockRequest: (pattern: string) => {
        checkPermission();
      },
      modifyHeaders: (headers: Record<string, string>) => {
        checkPermission();
      }
    };
  }

  // Create AI API
  private createAIAPI(permissions: Set<string>): PluginAPI['ai'] {
    const checkPermission = () => {
      if (!permissions.has('ai_services')) {
        throw new Error('Permission denied: ai_services');
      }
    };

    return {
      complete: async (prompt: string, options?: any) => {
        checkPermission();
        return `AI response to: ${prompt}`;
      },
      classify: async (text: string, categories: string[]) => {
        checkPermission();
        return categories[0];
      },
      extract: async (text: string, schema: any) => {
        checkPermission();
        return {};
      },
      summarize: async (text: string, maxLength?: number) => {
        checkPermission();
        return text.substring(0, maxLength || 100);
      },
      translate: async (text: string, targetLang: string) => {
        checkPermission();
        return `Translated: ${text}`;
      }
    };
  }

  // Create UI API
  private createUIAPI(permissions: Set<string>): PluginAPI['ui'] {
    return {
      showNotification: (message: string, type?: string) => {
        console.log(`[${type || 'info'}] ${message}`);
      },
      showDialog: async (options: any) => ({}),
      addToolbarButton: (button: any) => {},
      addContextMenuItem: (item: any) => {},
      addSidebarPanel: (panel: any) => {},
      showProgress: (progress: number, message?: string) => {}
    };
  }

  // Create events API
  private createEventsAPI(): PluginAPI['events'] {
    const emitter = new EventEmitter();
    return {
      on: (event: string, handler: Function) => emitter.on(event, handler as any),
      off: (event: string, handler: Function) => emitter.off(event, handler as any),
      emit: (event: string, data?: any) => emitter.emit(event, data),
      once: (event: string, handler: Function) => emitter.once(event, handler as any)
    };
  }

  // Create utils API
  private createUtilsAPI(permissions: Set<string>): PluginAPI['utils'] {
    return {
      delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
      random: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
      uuid: () => crypto.randomUUID(),
      hash: (text: string) => crypto.createHash('sha256').update(text).digest('hex'),
      encode: (text: string) => Buffer.from(text).toString('base64'),
      decode: (text: string) => Buffer.from(text, 'base64').toString(),
      clipboard: {
        read: async () => {
          if (!permissions.has('clipboard')) {
            throw new Error('Permission denied: clipboard');
          }
          return '';
        },
        write: async (text: string) => {
          if (!permissions.has('clipboard')) {
            throw new Error('Permission denied: clipboard');
          }
        }
      }
    };
  }

  // Create workflow API
  private createWorkflowAPI(permissions: Set<string>): PluginAPI['workflow'] {
    return {
      getCurrentStep: () => ({}),
      nextStep: async () => {},
      previousStep: async () => {},
      jumpToStep: async (stepId: string) => {},
      getStepData: (stepId: string) => ({}),
      setStepData: (stepId: string, data: any) => {},
      getWorkflowData: () => ({}),
      setWorkflowData: (data: any) => {}
    };
  }

  // Create debug API
  private createDebugAPI(): PluginAPI['debug'] {
    return {
      log: (...args: any[]) => console.log('[Plugin]', ...args),
      error: (...args: any[]) => console.error('[Plugin]', ...args),
      warn: (...args: any[]) => console.warn('[Plugin]', ...args),
      table: (data: any) => console.table(data),
      time: (label: string) => console.time(label),
      timeEnd: (label: string) => console.timeEnd(label)
    };
  }

  // Get loaded plugin
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  // Get loaded playbook
  getPlaybook(id: string): Playbook | undefined {
    return this.playbooks.get(id);
  }

  // Unload plugin
  async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (plugin) {
      await plugin.deactivate();
      await plugin.onUninstall();
      this.plugins.delete(id);
    }
  }
}

export const pluginLoader = new PluginLoader();