import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BrowserManager } from '../browser-manager';
import { createAgentOrchestrator, TaskPriority } from '../ai-agents';
import { storage } from '../storage';
import type { 
  WatchedWorkflow, 
  WorkflowRun, 
  WorkflowAction,
  Workflow 
} from '@shared/schema';

// Workflow execution status
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

// Workflow step definition
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: any;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
  retryCount?: number;
  dependencies?: string[];
}

// Execution context
export interface ExecutionContext {
  workflowId: string;
  runId: string;
  triggerType: string;
  triggeredBy?: string;
  variables: Map<string, any>;
  browserTab?: any;
  startedAt: Date;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Workflow executor options
export interface ExecutorOptions {
  maxConcurrentSteps: number;
  defaultTimeout: number;
  maxRetryAttempts: number;
  retryDelay: number;
  enableScreenshots: boolean;
  enableLogs: boolean;
}

export class WorkflowEngine extends EventEmitter {
  private browserManager: BrowserManager;
  private agentOrchestrator: any;
  private activeRuns: Map<string, ExecutionContext> = new Map();
  private stepExecutors: Map<string, Function> = new Map();
  private options: ExecutorOptions;

  constructor(browserManager: BrowserManager, options: Partial<ExecutorOptions> = {}) {
    super();
    this.browserManager = browserManager;
    this.agentOrchestrator = createAgentOrchestrator(browserManager);
    
    this.options = {
      maxConcurrentSteps: options.maxConcurrentSteps || 5,
      defaultTimeout: options.defaultTimeout || 300000, // 5 minutes
      maxRetryAttempts: options.maxRetryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableScreenshots: options.enableScreenshots !== false,
      enableLogs: options.enableLogs !== false
    };

    this.initializeStepExecutors();
  }

  private initializeStepExecutors(): void {
    // Navigation step
    this.stepExecutors.set('navigate', async (step: WorkflowStep, context: ExecutionContext) => {
      const { url } = step.config;
      if (!context.browserTab) {
        context.browserTab = await this.browserManager.createTab();
      }
      await context.browserTab.navigate(url);
      return { url, timestamp: new Date() };
    });

    // Wait step
    this.stepExecutors.set('wait', async (step: WorkflowStep, context: ExecutionContext) => {
      const { duration, selector, condition } = step.config;
      if (duration) {
        await new Promise(resolve => setTimeout(resolve, duration));
      } else if (selector && context.browserTab) {
        await context.browserTab.waitForSelector(selector);
      }
      return { waited: true };
    });

    // Click step
    this.stepExecutors.set('click', async (step: WorkflowStep, context: ExecutionContext) => {
      const { selector } = step.config;
      if (context.browserTab) {
        await context.browserTab.click(selector);
      }
      return { clicked: selector };
    });

    // Extract step
    this.stepExecutors.set('extract', async (step: WorkflowStep, context: ExecutionContext) => {
      const { selectors, rules } = step.config;
      if (!context.browserTab) {
        throw new Error('No browser tab available for extraction');
      }
      
      const extractedData: any = {};
      for (const [key, selector] of Object.entries(selectors || {})) {
        const element = await context.browserTab.evaluate((sel: string) => {
          const el = document.querySelector(sel);
          return el ? el.textContent : null;
        }, selector as string);
        extractedData[key] = element;
      }
      
      return extractedData;
    });

    // Fill form step
    this.stepExecutors.set('fill', async (step: WorkflowStep, context: ExecutionContext) => {
      const { fields } = step.config;
      if (context.browserTab) {
        for (const [selector, value] of Object.entries(fields || {})) {
          await context.browserTab.type(selector, value as string);
        }
      }
      return { filled: Object.keys(fields || {}).length };
    });

    // Condition step
    this.stepExecutors.set('condition', async (step: WorkflowStep, context: ExecutionContext) => {
      const { expression, variable, operator, value } = step.config;
      
      let result = false;
      if (expression) {
        // Evaluate JavaScript expression
        result = new Function('context', `return ${expression}`)(context);
      } else if (variable && operator && value !== undefined) {
        const varValue = context.variables.get(variable);
        switch (operator) {
          case '==': result = varValue == value; break;
          case '!=': result = varValue != value; break;
          case '>': result = varValue > value; break;
          case '<': result = varValue < value; break;
          case '>=': result = varValue >= value; break;
          case '<=': result = varValue <= value; break;
          case 'contains': result = String(varValue).includes(value); break;
          case 'matches': result = new RegExp(value).test(String(varValue)); break;
        }
      }
      
      return { result, evaluated: true };
    });

    // Loop step
    this.stepExecutors.set('loop', async (step: WorkflowStep, context: ExecutionContext) => {
      const { iterations, collection, steps } = step.config;
      const results = [];
      
      if (iterations) {
        for (let i = 0; i < iterations; i++) {
          context.variables.set('loopIndex', i);
          results.push(await this.executeSteps(steps, context));
        }
      } else if (collection) {
        const items = context.variables.get(collection) || [];
        for (let i = 0; i < items.length; i++) {
          context.variables.set('loopIndex', i);
          context.variables.set('loopItem', items[i]);
          results.push(await this.executeSteps(steps, context));
        }
      }
      
      return { iterations: results.length, results };
    });

    // Screenshot step
    this.stepExecutors.set('screenshot', async (step: WorkflowStep, context: ExecutionContext) => {
      if (context.browserTab) {
        const screenshot = await context.browserTab.screenshot();
        return { screenshot, timestamp: new Date() };
      }
      return { error: 'No browser tab available' };
    });

    // API call step
    this.stepExecutors.set('api', async (step: WorkflowStep, context: ExecutionContext) => {
      const { url, method, headers, body } = step.config;
      const response = await fetch(url, {
        method: method || 'GET',
        headers: headers || {},
        body: body ? JSON.stringify(body) : undefined
      });
      
      const data = await response.json();
      return { status: response.status, data };
    });

    // Store variable step
    this.stepExecutors.set('store', async (step: WorkflowStep, context: ExecutionContext) => {
      const { variable, value, source } = step.config;
      
      let storedValue = value;
      if (source) {
        storedValue = context.variables.get(source);
      }
      
      context.variables.set(variable, storedValue);
      return { stored: variable, value: storedValue };
    });
  }

  async executeWorkflow(
    workflow: WatchedWorkflow,
    triggerType: string,
    triggeredBy?: string
  ): Promise<WorkflowRun> {
    const runId = uuidv4();
    const context: ExecutionContext = {
      workflowId: workflow.id,
      runId,
      triggerType,
      triggeredBy,
      variables: new Map(),
      startedAt: new Date(),
      timeout: workflow.config?.timeout || this.options.defaultTimeout,
      retryAttempts: workflow.config?.retryAttempts || this.options.maxRetryAttempts,
      retryDelay: workflow.config?.retryDelay || this.options.retryDelay
    };

    this.activeRuns.set(runId, context);
    this.emit('workflow:started', { workflowId: workflow.id, runId });

    try {
      // Load the playbook if specified
      let steps: WorkflowStep[] = [];
      if (workflow.playbookId) {
        const playbook = await storage.getWorkflow(workflow.playbookId);
        if (playbook && playbook.steps) {
          steps = this.convertPlaybookSteps(playbook.steps as any);
        }
      }

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Workflow timeout')), context.timeout);
      });

      const executionPromise = this.executeSteps(steps, context);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Create successful run record
      const run: Partial<WorkflowRun> = {
        workflowId: workflow.id,
        runNumber: (workflow.metrics?.totalRuns || 0) + 1,
        status: 'success',
        triggerType,
        triggeredBy,
        startedAt: context.startedAt,
        completedAt: new Date(),
        duration: Date.now() - context.startedAt.getTime(),
        extractedData: result,
        steps: steps.map(s => ({
          name: s.name,
          status: s.status,
          startedAt: s.startedAt?.toISOString() || '',
          completedAt: s.completedAt?.toISOString(),
          output: s.output,
          error: s.error
        }))
      };

      this.emit('workflow:completed', { workflowId: workflow.id, runId, result });
      return run as WorkflowRun;

    } catch (error: any) {
      // Handle errors and create failed run record
      const run: Partial<WorkflowRun> = {
        workflowId: workflow.id,
        runNumber: (workflow.metrics?.totalRuns || 0) + 1,
        status: 'failed',
        triggerType,
        triggeredBy,
        startedAt: context.startedAt,
        completedAt: new Date(),
        duration: Date.now() - context.startedAt.getTime(),
        error: error.message
      };

      this.emit('workflow:failed', { workflowId: workflow.id, runId, error });
      return run as WorkflowRun;

    } finally {
      // Cleanup
      if (context.browserTab) {
        await context.browserTab.close();
      }
      this.activeRuns.delete(runId);
    }
  }

  private async executeSteps(
    steps: WorkflowStep[],
    context: ExecutionContext
  ): Promise<any> {
    const results: any = {};
    const completed = new Set<string>();
    const executing = new Map<string, Promise<any>>();

    // Execute steps with dependency resolution
    while (completed.size < steps.length) {
      const readySteps = steps.filter(step => {
        if (completed.has(step.id) || executing.has(step.id)) {
          return false;
        }
        
        if (step.dependencies) {
          return step.dependencies.every(dep => completed.has(dep));
        }
        
        return true;
      });

      if (readySteps.length === 0 && executing.size === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }

      // Execute ready steps in parallel (up to max concurrent)
      const toExecute = readySteps.slice(0, this.options.maxConcurrentSteps - executing.size);
      
      for (const step of toExecute) {
        const promise = this.executeStep(step, context)
          .then(result => {
            results[step.id] = result;
            completed.add(step.id);
            executing.delete(step.id);
            return result;
          })
          .catch(error => {
            step.error = error.message;
            executing.delete(step.id);
            throw error;
          });
        
        executing.set(step.id, promise);
      }

      // Wait for at least one step to complete
      if (executing.size > 0) {
        await Promise.race(Array.from(executing.values()));
      }
    }

    return results;
  }

  private async executeStep(
    step: WorkflowStep,
    context: ExecutionContext
  ): Promise<any> {
    step.startedAt = new Date();
    step.status = ExecutionStatus.RUNNING;
    
    this.emit('step:started', { 
      workflowId: context.workflowId, 
      runId: context.runId, 
      step 
    });

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= context.retryAttempts; attempt++) {
      try {
        const executor = this.stepExecutors.get(step.type);
        if (!executor) {
          throw new Error(`Unknown step type: ${step.type}`);
        }

        const result = await executor(step, context);
        
        step.completedAt = new Date();
        step.status = ExecutionStatus.SUCCESS;
        step.output = result;
        
        this.emit('step:completed', { 
          workflowId: context.workflowId, 
          runId: context.runId, 
          step, 
          result 
        });
        
        return result;
        
      } catch (error: any) {
        lastError = error;
        step.retryCount = attempt;
        
        if (attempt < context.retryAttempts) {
          this.emit('step:retry', { 
            workflowId: context.workflowId, 
            runId: context.runId, 
            step, 
            attempt,
            error 
          });
          
          // Exponential backoff
          const delay = context.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    step.completedAt = new Date();
    step.status = ExecutionStatus.FAILED;
    step.error = lastError?.message || 'Unknown error';
    
    this.emit('step:failed', { 
      workflowId: context.workflowId, 
      runId: context.runId, 
      step, 
      error: lastError 
    });
    
    throw lastError;
  }

  private convertPlaybookSteps(playbookSteps: any[]): WorkflowStep[] {
    return playbookSteps.map((step, index) => ({
      id: `step-${index}`,
      name: step.name || `Step ${index + 1}`,
      type: step.type || 'navigate',
      config: step.config || step,
      status: ExecutionStatus.PENDING,
      dependencies: step.dependencies
    }));
  }

  async cancelWorkflow(runId: string): Promise<void> {
    const context = this.activeRuns.get(runId);
    if (context) {
      this.emit('workflow:cancelled', { 
        workflowId: context.workflowId, 
        runId 
      });
      
      if (context.browserTab) {
        await context.browserTab.close();
      }
      
      this.activeRuns.delete(runId);
    }
  }

  getActiveRuns(): string[] {
    return Array.from(this.activeRuns.keys());
  }

  isRunning(workflowId: string): boolean {
    return Array.from(this.activeRuns.values())
      .some(context => context.workflowId === workflowId);
  }
}