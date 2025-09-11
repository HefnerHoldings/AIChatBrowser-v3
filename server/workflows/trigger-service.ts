import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import type { WorkflowTrigger, WatchedWorkflow } from '@shared/schema';

// Trigger evaluation result
export interface TriggerResult {
  triggered: boolean;
  triggerId: string;
  triggerType: string;
  reason?: string;
  data?: any;
  timestamp: Date;
}

// Webhook registration
export interface WebhookRegistration {
  token: string;
  workflowId: string;
  secret?: string;
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

// API polling configuration
export interface APIPollConfig {
  workflowId: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  interval: number;
  lastPoll?: Date;
  lastResponse?: any;
  compareField?: string;
}

// Rate limit configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  current: number;
  resetAt: Date;
}

export class TriggerService extends EventEmitter {
  private triggers: Map<string, WorkflowTrigger> = new Map();
  private webhooks: Map<string, WebhookRegistration> = new Map();
  private apiPollers: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, Function> = new Map();
  private rateLimits: Map<string, RateLimitConfig> = new Map();
  private chainTriggers: Map<string, string[]> = new Map(); // workflow -> dependent workflows

  constructor() {
    super();
    this.setupInternalEventListeners();
  }

  // Initialize triggers for a workflow
  async initializeTriggers(workflow: WatchedWorkflow): Promise<void> {
    try {
      const triggers = await storage.getWorkflowTriggers(workflow.id);
      
      for (const trigger of triggers) {
        if (trigger.enabled) {
          await this.registerTrigger(trigger);
        }
      }
      
      console.log(`Initialized ${triggers.length} triggers for workflow ${workflow.id}`);
    } catch (error) {
      console.error(`Failed to initialize triggers for workflow ${workflow.id}:`, error);
    }
  }

  // Register a trigger
  async registerTrigger(trigger: WorkflowTrigger): Promise<void> {
    this.triggers.set(trigger.id, trigger);
    
    switch (trigger.type) {
      case 'webhook':
        await this.registerWebhook(trigger);
        break;
        
      case 'api':
        await this.registerAPIPoller(trigger);
        break;
        
      case 'event':
        await this.registerEventListener(trigger);
        break;
        
      case 'content':
      case 'element':
      case 'status':
        // These are handled by change detector
        this.emit('register:change-trigger', trigger);
        break;
        
      case 'chain':
        await this.registerChainTrigger(trigger);
        break;
    }
    
    this.emit('trigger:registered', trigger);
  }

  // Unregister a trigger
  async unregisterTrigger(triggerId: string): Promise<void> {
    const trigger = this.triggers.get(triggerId);
    if (!trigger) return;
    
    switch (trigger.type) {
      case 'webhook':
        this.unregisterWebhook(trigger);
        break;
        
      case 'api':
        this.unregisterAPIPoller(trigger);
        break;
        
      case 'event':
        this.unregisterEventListener(trigger);
        break;
        
      case 'chain':
        this.unregisterChainTrigger(trigger);
        break;
    }
    
    this.triggers.delete(triggerId);
    this.emit('trigger:unregistered', trigger);
  }

  // Register webhook trigger
  private async registerWebhook(trigger: WorkflowTrigger): Promise<void> {
    const config = trigger.config;
    const token = config.webhookToken || uuidv4();
    
    const registration: WebhookRegistration = {
      token,
      workflowId: trigger.workflowId,
      secret: config.webhookSecret,
      createdAt: new Date(),
      useCount: 0
    };
    
    this.webhooks.set(token, registration);
    
    // Emit webhook URL for external registration
    this.emit('webhook:created', {
      workflowId: trigger.workflowId,
      url: `/api/workflows/webhook/${token}`,
      token,
      secret: config.webhookSecret
    });
  }

  // Unregister webhook
  private unregisterWebhook(trigger: WorkflowTrigger): void {
    const config = trigger.config;
    if (config.webhookToken) {
      this.webhooks.delete(config.webhookToken);
    }
  }

  // Handle webhook request
  async handleWebhook(
    token: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<TriggerResult> {
    const registration = this.webhooks.get(token);
    
    if (!registration) {
      return {
        triggered: false,
        triggerId: '',
        triggerType: 'webhook',
        reason: 'Invalid webhook token',
        timestamp: new Date()
      };
    }
    
    // Verify webhook secret if configured
    if (registration.secret) {
      const signature = headers['x-webhook-signature'] || headers['x-hub-signature'];
      if (!this.verifyWebhookSignature(payload, registration.secret, signature)) {
        return {
          triggered: false,
          triggerId: '',
          triggerType: 'webhook',
          reason: 'Invalid signature',
          timestamp: new Date()
        };
      }
    }
    
    // Check rate limit
    if (!this.checkRateLimit(registration.workflowId)) {
      return {
        triggered: false,
        triggerId: '',
        triggerType: 'webhook',
        reason: 'Rate limit exceeded',
        timestamp: new Date()
      };
    }
    
    // Update registration
    registration.lastUsed = new Date();
    registration.useCount++;
    
    // Trigger workflow
    const result: TriggerResult = {
      triggered: true,
      triggerId: token,
      triggerType: 'webhook',
      data: payload,
      timestamp: new Date()
    };
    
    this.emit('workflow:trigger', {
      workflowId: registration.workflowId,
      triggerType: 'webhook',
      triggeredBy: token,
      data: payload
    });
    
    return result;
  }

  // Register API poller
  private async registerAPIPoller(trigger: WorkflowTrigger): Promise<void> {
    const config = trigger.config;
    
    if (!config.apiEndpoint || !config.pollInterval) {
      console.error('Invalid API poller configuration');
      return;
    }
    
    const pollConfig: APIPollConfig = {
      workflowId: trigger.workflowId,
      endpoint: config.apiEndpoint,
      method: 'GET',
      headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {},
      interval: config.pollInterval,
      compareField: config.compareField
    };
    
    // Start polling
    const intervalId = setInterval(async () => {
      await this.pollAPI(trigger.id, pollConfig);
    }, pollConfig.interval);
    
    this.apiPollers.set(trigger.id, intervalId);
    
    // Initial poll
    await this.pollAPI(trigger.id, pollConfig);
  }

  // Unregister API poller
  private unregisterAPIPoller(trigger: WorkflowTrigger): void {
    const intervalId = this.apiPollers.get(trigger.id);
    if (intervalId) {
      clearInterval(intervalId);
      this.apiPollers.delete(trigger.id);
    }
  }

  // Poll API endpoint
  private async pollAPI(triggerId: string, config: APIPollConfig): Promise<void> {
    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: config.headers
      });
      
      if (!response.ok) {
        console.error(`API poll failed: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      // Check if data has changed
      let hasChanged = false;
      
      if (config.compareField) {
        const newValue = this.getNestedValue(data, config.compareField);
        const oldValue = config.lastResponse ? 
          this.getNestedValue(config.lastResponse, config.compareField) : null;
        hasChanged = newValue !== oldValue;
      } else {
        // Compare entire response
        hasChanged = JSON.stringify(data) !== JSON.stringify(config.lastResponse);
      }
      
      if (hasChanged) {
        config.lastResponse = data;
        config.lastPoll = new Date();
        
        // Trigger workflow
        this.emit('workflow:trigger', {
          workflowId: config.workflowId,
          triggerType: 'api',
          triggeredBy: triggerId,
          data
        });
      }
      
    } catch (error) {
      console.error('API polling error:', error);
      this.emit('trigger:error', { triggerId, error });
    }
  }

  // Register event listener
  private async registerEventListener(trigger: WorkflowTrigger): Promise<void> {
    const config = trigger.config;
    
    if (!config.eventName) {
      console.error('Invalid event listener configuration');
      return;
    }
    
    const listener = (data: any) => {
      // Check event source if specified
      if (config.eventSource && data.source !== config.eventSource) {
        return;
      }
      
      // Check rate limit
      if (!this.checkRateLimit(trigger.workflowId)) {
        return;
      }
      
      // Trigger workflow
      this.emit('workflow:trigger', {
        workflowId: trigger.workflowId,
        triggerType: 'event',
        triggeredBy: trigger.id,
        data
      });
    };
    
    this.eventListeners.set(trigger.id, listener);
    
    // Subscribe to event
    this.on(config.eventName, listener);
  }

  // Unregister event listener
  private unregisterEventListener(trigger: WorkflowTrigger): void {
    const listener = this.eventListeners.get(trigger.id);
    if (listener && trigger.config.eventName) {
      this.off(trigger.config.eventName, listener);
      this.eventListeners.delete(trigger.id);
    }
  }

  // Register chain trigger
  private async registerChainTrigger(trigger: WorkflowTrigger): Promise<void> {
    const config = trigger.config;
    
    if (!config.sourceWorkflow) {
      console.error('Invalid chain trigger configuration');
      return;
    }
    
    // Add to chain mapping
    const dependents = this.chainTriggers.get(config.sourceWorkflow) || [];
    dependents.push(trigger.workflowId);
    this.chainTriggers.set(config.sourceWorkflow, dependents);
  }

  // Unregister chain trigger
  private unregisterChainTrigger(trigger: WorkflowTrigger): void {
    const config = trigger.config;
    if (config.sourceWorkflow) {
      const dependents = this.chainTriggers.get(config.sourceWorkflow) || [];
      const index = dependents.indexOf(trigger.workflowId);
      if (index > -1) {
        dependents.splice(index, 1);
      }
    }
  }

  // Handle workflow completion for chain triggers
  handleWorkflowCompletion(workflowId: string, result: any): void {
    const dependents = this.chainTriggers.get(workflowId) || [];
    
    for (const dependentId of dependents) {
      this.emit('workflow:trigger', {
        workflowId: dependentId,
        triggerType: 'chain',
        triggeredBy: workflowId,
        data: result
      });
    }
  }

  // Evaluate conditional triggers
  async evaluateConditionalTrigger(
    trigger: WorkflowTrigger,
    context: any
  ): Promise<boolean> {
    const config = trigger.config;
    
    switch (trigger.type) {
      case 'content':
        // Check content change
        if (config.contentPattern) {
          const regex = new RegExp(config.contentPattern);
          return regex.test(context.content);
        }
        if (config.changeThreshold) {
          return context.changeScore > config.changeThreshold;
        }
        break;
        
      case 'element':
        // Check element presence/change
        if (config.elementSelector) {
          return context.elements?.includes(config.elementSelector);
        }
        break;
        
      case 'status':
        // Check HTTP status
        if (config.statusCode) {
          return context.statusCode === config.statusCode;
        }
        if (config.statusPattern) {
          const regex = new RegExp(config.statusPattern);
          return regex.test(String(context.statusCode));
        }
        break;
    }
    
    return false;
  }

  // Check rate limit
  private checkRateLimit(workflowId: string): boolean {
    let limit = this.rateLimits.get(workflowId);
    
    if (!limit) {
      // Default rate limit: 100 requests per minute
      limit = {
        maxRequests: 100,
        windowMs: 60000,
        current: 0,
        resetAt: new Date(Date.now() + 60000)
      };
      this.rateLimits.set(workflowId, limit);
    }
    
    const now = new Date();
    
    // Reset if window has passed
    if (now >= limit.resetAt) {
      limit.current = 0;
      limit.resetAt = new Date(now.getTime() + limit.windowMs);
    }
    
    // Check limit
    if (limit.current >= limit.maxRequests) {
      this.emit('rateLimit:exceeded', { workflowId, limit });
      return false;
    }
    
    limit.current++;
    return true;
  }

  // Verify webhook signature
  private verifyWebhookSignature(
    payload: any,
    secret: string,
    signature?: string
  ): boolean {
    if (!signature) return false;
    
    // Implementation depends on webhook provider
    // This is a simplified example
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Setup internal event listeners
  private setupInternalEventListeners(): void {
    // Listen for workflow completions
    this.on('workflow:completed', ({ workflowId, result }) => {
      this.handleWorkflowCompletion(workflowId, result);
    });
    
    // Listen for change detection results
    this.on('change:detected', async ({ workflowId, changes }) => {
      const triggers = Array.from(this.triggers.values())
        .filter(t => t.workflowId === workflowId && 
                    ['content', 'element', 'status'].includes(t.type));
      
      for (const trigger of triggers) {
        if (await this.evaluateConditionalTrigger(trigger, changes)) {
          this.emit('workflow:trigger', {
            workflowId,
            triggerType: trigger.type,
            triggeredBy: trigger.id,
            data: changes
          });
        }
      }
    });
  }

  // Get trigger statistics
  getTriggerStats(): any {
    return {
      totalTriggers: this.triggers.size,
      webhooks: this.webhooks.size,
      apiPollers: this.apiPollers.size,
      eventListeners: this.eventListeners.size,
      chainTriggers: this.chainTriggers.size,
      triggers: Array.from(this.triggers.values()).map(t => ({
        id: t.id,
        workflowId: t.workflowId,
        type: t.type,
        enabled: t.enabled,
        lastTriggered: t.lastTriggered,
        triggerCount: t.triggerCount
      }))
    };
  }

  // Update rate limit
  updateRateLimit(workflowId: string, config: Partial<RateLimitConfig>): void {
    const existing = this.rateLimits.get(workflowId) || {
      maxRequests: 100,
      windowMs: 60000,
      current: 0,
      resetAt: new Date(Date.now() + 60000)
    };
    
    this.rateLimits.set(workflowId, { ...existing, ...config });
  }

  // Cleanup
  shutdown(): void {
    // Clear all API pollers
    for (const intervalId of this.apiPollers.values()) {
      clearInterval(intervalId);
    }
    
    // Clear all event listeners
    for (const [triggerId, listener] of this.eventListeners) {
      const trigger = this.triggers.get(triggerId);
      if (trigger?.config.eventName) {
        this.off(trigger.config.eventName, listener);
      }
    }
    
    this.triggers.clear();
    this.webhooks.clear();
    this.apiPollers.clear();
    this.eventListeners.clear();
    this.rateLimits.clear();
    this.chainTriggers.clear();
  }
}