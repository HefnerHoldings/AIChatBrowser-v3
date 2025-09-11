import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'path';
import { storage } from '../storage';
import { 
  type MarketplaceItem,
  type MarketplaceInstallation,
  type MarketplaceExecutionLog
} from '@shared/schema';
import { randomUUID } from 'crypto';

// Sandbox execution context
export interface SandboxContext {
  itemId: string;
  installationId: string;
  userId: string;
  permissions: string[];
  config: Record<string, any>;
  input: any;
  timeout: number;
  maxMemory: number;
  maxCpuTime: number;
}

// Sandbox execution result
export interface SandboxResult {
  success: boolean;
  output: any;
  error?: string;
  logs: string[];
  resourceUsage: {
    cpuTime: number;
    memoryUsed: number;
    networkRequests: number;
  };
  permissionsUsed: string[];
  violations: string[];
}

// Resource limits
export const RESOURCE_LIMITS = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  MAX_TIMEOUT: 300000, // 5 minutes
  DEFAULT_MEMORY: 128 * 1024 * 1024, // 128MB
  MAX_MEMORY: 512 * 1024 * 1024, // 512MB
  MAX_CPU_TIME: 10000, // 10 seconds CPU time
  MAX_NETWORK_REQUESTS: 100,
  MAX_LOG_SIZE: 10000, // characters
  MAX_OUTPUT_SIZE: 1024 * 1024 // 1MB
};

// Permission enforcement
export class PermissionManager {
  private grantedPermissions: Set<string>;
  private usedPermissions: Set<string>;
  private violations: string[];

  constructor(permissions: string[]) {
    this.grantedPermissions = new Set(permissions);
    this.usedPermissions = new Set();
    this.violations = [];
  }

  checkPermission(permission: string): boolean {
    if (!this.grantedPermissions.has(permission)) {
      this.violations.push(`Unauthorized permission requested: ${permission}`);
      return false;
    }
    this.usedPermissions.add(permission);
    return true;
  }

  getUsedPermissions(): string[] {
    return Array.from(this.usedPermissions);
  }

  getViolations(): string[] {
    return this.violations;
  }
}

// Sandbox runtime environment
export class SandboxRuntime extends EventEmitter {
  private static instance: SandboxRuntime;
  private workerPool: Worker[] = [];
  private activeExecutions: Map<string, Worker> = new Map();
  private executionQueue: Array<() => void> = [];
  private maxWorkers: number = 4;

  private constructor() {
    super();
    this.initializeWorkerPool();
  }

  static getInstance(): SandboxRuntime {
    if (!SandboxRuntime.instance) {
      SandboxRuntime.instance = new SandboxRuntime();
    }
    return SandboxRuntime.instance;
  }

  private initializeWorkerPool() {
    // Worker pool will be initialized on demand
    console.log('Sandbox runtime initialized');
  }

  // Execute plugin/playbook in sandbox
  async execute(context: SandboxContext): Promise<SandboxResult> {
    const executionId = randomUUID();
    const sandboxId = `sandbox-${executionId}`;
    
    // Record execution start
    await storage.recordMarketplaceExecution({
      itemId: context.itemId,
      installationId: context.installationId,
      userId: context.userId,
      executionId,
      sandboxId,
      status: 'started',
      input: context.input
    });

    try {
      // Get item code
      const item = await storage.getMarketplaceItem(context.itemId);
      if (!item) {
        throw new Error('Item not found');
      }

      // Get installation
      const installation = await storage.getMarketplaceInstallation(
        context.itemId,
        context.userId
      );
      if (!installation || installation.status !== 'active') {
        throw new Error('Item not installed or inactive');
      }

      // Create isolated execution environment
      const result = await this.runInSandbox(
        sandboxId,
        item,
        context
      );

      // Record execution completion
      await storage.recordMarketplaceExecution({
        itemId: context.itemId,
        installationId: context.installationId,
        userId: context.userId,
        executionId,
        sandboxId,
        status: result.success ? 'completed' : 'failed',
        endTime: new Date(),
        output: result.output,
        error: result.error,
        resourceUsage: result.resourceUsage,
        permissionsUsed: result.permissionsUsed,
        violations: result.violations
      });

      return result;
    } catch (error: any) {
      // Record execution failure
      await storage.recordMarketplaceExecution({
        itemId: context.itemId,
        installationId: context.installationId,
        userId: context.userId,
        executionId,
        sandboxId,
        status: 'failed',
        endTime: new Date(),
        error: error.message
      });

      return {
        success: false,
        output: null,
        error: error.message,
        logs: [],
        resourceUsage: {
          cpuTime: 0,
          memoryUsed: 0,
          networkRequests: 0
        },
        permissionsUsed: [],
        violations: []
      };
    }
  }

  // Run code in isolated sandbox
  private async runInSandbox(
    sandboxId: string,
    item: MarketplaceItem,
    context: SandboxContext
  ): Promise<SandboxResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = Math.min(
        context.timeout || RESOURCE_LIMITS.DEFAULT_TIMEOUT,
        RESOURCE_LIMITS.MAX_TIMEOUT
      );

      // Create permission manager
      const permissionManager = new PermissionManager(context.permissions);
      
      // Sandbox API available to plugins
      const sandboxAPI = this.createSandboxAPI(permissionManager);
      
      // Logs collector
      const logs: string[] = [];
      const logCollector = (message: string) => {
        if (logs.join('\n').length < RESOURCE_LIMITS.MAX_LOG_SIZE) {
          logs.push(message);
        }
      };

      // Resource usage tracker
      let cpuTimeUsed = 0;
      let memoryUsed = 0;
      let networkRequests = 0;

      // Create sandbox timeout
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        // Mock execution for now (in production, use vm2 or isolated-vm)
        // This is a simplified implementation - real implementation would use
        // actual VM isolation
        
        const mockExecute = () => {
          // Simulate plugin execution
          logCollector(`Executing ${item.type}: ${item.name}`);
          
          // Check permissions for various operations
          if (item.type === 'plugin') {
            // Plugin execution logic
            if (permissionManager.checkPermission('read_dom')) {
              logCollector('Reading DOM elements');
            }
            if (permissionManager.checkPermission('network')) {
              logCollector('Making network request');
              networkRequests++;
            }
          } else if (item.type === 'playbook') {
            // Playbook execution logic
            logCollector('Running playbook steps');
            
            // Simulate step execution
            const steps = context.input?.steps || [];
            steps.forEach((step: any, index: number) => {
              logCollector(`Step ${index + 1}: ${step.action || 'unknown'}`);
              cpuTimeUsed += 100; // Mock CPU time
            });
          }
          
          // Mock resource usage
          cpuTimeUsed = Date.now() - startTime;
          memoryUsed = process.memoryUsage().heapUsed;
          
          // Return mock result
          return {
            data: `Processed ${item.name} successfully`,
            timestamp: new Date().toISOString()
          };
        };

        // Execute in mock sandbox
        const output = mockExecute();
        
        clearTimeout(timeoutHandle);
        
        resolve({
          success: true,
          output,
          logs,
          resourceUsage: {
            cpuTime: cpuTimeUsed,
            memoryUsed,
            networkRequests
          },
          permissionsUsed: permissionManager.getUsedPermissions(),
          violations: permissionManager.getViolations()
        });
      } catch (error: any) {
        clearTimeout(timeoutHandle);
        
        resolve({
          success: false,
          output: null,
          error: error.message,
          logs,
          resourceUsage: {
            cpuTime: cpuTimeUsed,
            memoryUsed,
            networkRequests
          },
          permissionsUsed: permissionManager.getUsedPermissions(),
          violations: permissionManager.getViolations()
        });
      }
    });
  }

  // Create sandboxed API for plugins
  private createSandboxAPI(permissionManager: PermissionManager) {
    return {
      // DOM manipulation
      dom: {
        querySelector: (selector: string) => {
          if (!permissionManager.checkPermission('read_dom')) {
            throw new Error('Permission denied: read_dom');
          }
          // Return mock element
          return { id: 'mock-element', textContent: 'Mock content' };
        },
        
        setTextContent: (selector: string, text: string) => {
          if (!permissionManager.checkPermission('write_dom')) {
            throw new Error('Permission denied: write_dom');
          }
          return true;
        },
        
        click: (selector: string) => {
          if (!permissionManager.checkPermission('write_dom')) {
            throw new Error('Permission denied: write_dom');
          }
          return true;
        }
      },

      // Network requests (filtered)
      network: {
        fetch: async (url: string, options?: any) => {
          if (!permissionManager.checkPermission('network')) {
            throw new Error('Permission denied: network');
          }
          
          // Validate URL (prevent internal network access)
          if (!this.isAllowedUrl(url)) {
            throw new Error(`Forbidden URL: ${url}`);
          }
          
          // Mock response
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: 'mock' }),
            text: async () => 'mock response'
          };
        }
      },

      // Storage API
      storage: {
        get: (key: string) => {
          if (!permissionManager.checkPermission('storage')) {
            throw new Error('Permission denied: storage');
          }
          return null;
        },
        
        set: (key: string, value: any) => {
          if (!permissionManager.checkPermission('storage')) {
            throw new Error('Permission denied: storage');
          }
          return true;
        }
      },

      // Browser automation
      automation: {
        navigate: (url: string) => {
          if (!permissionManager.checkPermission('browser_automation')) {
            throw new Error('Permission denied: browser_automation');
          }
          return true;
        },
        
        screenshot: () => {
          if (!permissionManager.checkPermission('browser_automation')) {
            throw new Error('Permission denied: browser_automation');
          }
          return 'data:image/png;base64,mock';
        }
      },

      // AI services
      ai: {
        complete: async (prompt: string) => {
          if (!permissionManager.checkPermission('ai_services')) {
            throw new Error('Permission denied: ai_services');
          }
          return `AI response to: ${prompt}`;
        }
      },

      // Logging
      console: {
        log: (...args: any[]) => {
          console.log('[Sandbox]', ...args);
        },
        error: (...args: any[]) => {
          console.error('[Sandbox]', ...args);
        }
      }
    };
  }

  // Validate network URLs
  private isAllowedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Block internal/local addresses
      const blockedHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        '169.254.0.0',
        '10.0.0.0',
        '172.16.0.0',
        '192.168.0.0'
      ];
      
      for (const blocked of blockedHosts) {
        if (parsed.hostname.includes(blocked)) {
          return false;
        }
      }
      
      // Only allow http/https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  // Kill sandbox execution
  async killSandbox(sandboxId: string): Promise<void> {
    const worker = this.activeExecutions.get(sandboxId);
    if (worker) {
      await worker.terminate();
      this.activeExecutions.delete(sandboxId);
    }
  }

  // Get active sandbox count
  getActiveSandboxCount(): number {
    return this.activeExecutions.size;
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    // Terminate all workers
    for (const worker of this.workerPool) {
      await worker.terminate();
    }
    
    // Clear active executions
    for (const [id, worker] of this.activeExecutions) {
      await worker.terminate();
    }
    
    this.workerPool = [];
    this.activeExecutions.clear();
  }
}

export const sandboxRuntime = SandboxRuntime.getInstance();