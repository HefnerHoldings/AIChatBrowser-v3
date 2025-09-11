import { EventEmitter } from 'events';
import { WorkflowEngine } from './workflow-engine';
import { SchedulerService } from './scheduler-service';
import { ChangeDetector } from './change-detector';
import { TriggerService } from './trigger-service';
import { ActionExecutor } from './action-executor';
import { workflowStorage } from './workflow-storage';
import { BrowserManager } from '../browser-manager';
import type { 
  WatchedWorkflow, 
  WorkflowRun, 
  InsertWatchedWorkflow,
  InsertWorkflowTrigger,
  InsertWorkflowAction
} from '@shared/schema';

// Workflow Manager configuration
export interface WorkflowManagerConfig {
  maxConcurrentWorkflows: number;
  maxConcurrentSteps: number;
  defaultTimeout: number;
  changeDetectionInterval: number;
  enableScreenshots: boolean;
  enableLogs: boolean;
}

// Main workflow manager that orchestrates all components
export class WorkflowManager extends EventEmitter {
  private engine: WorkflowEngine;
  private scheduler: SchedulerService;
  private changeDetector: ChangeDetector;
  private triggerService: TriggerService;
  private actionExecutor: ActionExecutor;
  private browserManager: BrowserManager;
  private config: WorkflowManagerConfig;
  private initialized: boolean = false;

  constructor(browserManager: BrowserManager, config: Partial<WorkflowManagerConfig> = {}) {
    super();
    
    this.browserManager = browserManager;
    this.config = {
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 10,
      maxConcurrentSteps: config.maxConcurrentSteps || 5,
      defaultTimeout: config.defaultTimeout || 300000,
      changeDetectionInterval: config.changeDetectionInterval || 60000,
      enableScreenshots: config.enableScreenshots !== false,
      enableLogs: config.enableLogs !== false
    };

    // Initialize components
    this.engine = new WorkflowEngine(browserManager, {
      maxConcurrentSteps: this.config.maxConcurrentSteps,
      defaultTimeout: this.config.defaultTimeout,
      enableScreenshots: this.config.enableScreenshots,
      enableLogs: this.config.enableLogs
    });

    this.scheduler = new SchedulerService(this.config.maxConcurrentWorkflows);
    this.changeDetector = new ChangeDetector(browserManager);
    this.triggerService = new TriggerService();
    this.actionExecutor = new ActionExecutor(browserManager);

    this.setupEventHandlers();
  }

  // Initialize the workflow manager
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing Workflow Manager...');
    
    try {
      // Load active workflows
      const workflows = await workflowStorage.getWatchedWorkflows('active');
      
      // Initialize scheduler with workflows
      await this.scheduler.initialize();
      
      // Initialize triggers for each workflow
      for (const workflow of workflows) {
        await this.triggerService.initializeTriggers(workflow);
      }
      
      // Start change detection monitoring
      this.startChangeDetection();
      
      this.initialized = true;
      console.log(`Workflow Manager initialized with ${workflows.length} active workflows`);
      
    } catch (error) {
      console.error('Failed to initialize Workflow Manager:', error);
      throw error;
    }
  }

  // Setup event handlers between components
  private setupEventHandlers(): void {
    // Scheduler events
    this.scheduler.on('execute:workflow', async ({ workflowId, triggerType, triggeredBy, callback }) => {
      try {
        const run = await this.executeWorkflow(workflowId, triggerType, triggeredBy);
        callback(null, run);
      } catch (error) {
        callback(error);
      }
    });

    // Trigger service events
    this.triggerService.on('workflow:trigger', async ({ workflowId, triggerType, triggeredBy, data }) => {
      await this.executeWorkflow(workflowId, triggerType, triggeredBy, data);
    });

    // Engine events
    this.engine.on('workflow:started', ({ workflowId, runId }) => {
      this.emit('workflow:started', { workflowId, runId });
    });

    this.engine.on('workflow:completed', async ({ workflowId, runId, result }) => {
      await this.handleWorkflowCompletion(workflowId, runId, 'success', result);
    });

    this.engine.on('workflow:failed', async ({ workflowId, runId, error }) => {
      await this.handleWorkflowCompletion(workflowId, runId, 'failed', null, error);
    });

    // Change detector events
    this.changeDetector.on('change:detected', async ({ workflowId, url, result }) => {
      await this.handleChangeDetected(workflowId, result);
    });

    // Action executor events
    this.actionExecutor.on('action:completed', ({ actionId, result }) => {
      this.emit('action:completed', { actionId, result });
    });
  }

  // Create a new watched workflow
  async createWatchedWorkflow(
    workflow: InsertWatchedWorkflow,
    triggers: InsertWorkflowTrigger[] = [],
    actions: InsertWorkflowAction[] = []
  ): Promise<WatchedWorkflow> {
    // Create workflow with triggers and actions
    const created = await workflowStorage.createWorkflowWithTriggersAndActions(
      workflow,
      triggers,
      actions
    );

    // Schedule if active
    if (created.workflow.status === 'active') {
      await this.scheduler.scheduleWorkflow(created.workflow);
      await this.triggerService.initializeTriggers(created.workflow);
    }

    this.emit('workflow:created', created.workflow);
    return created.workflow;
  }

  // Update a watched workflow
  async updateWatchedWorkflow(
    id: string,
    updates: Partial<InsertWatchedWorkflow>
  ): Promise<WatchedWorkflow | null> {
    const workflow = await workflowStorage.updateWatchedWorkflow(id, updates);
    
    if (workflow) {
      // Reschedule if needed
      if (updates.scheduleConfig || updates.status) {
        this.scheduler.unscheduleWorkflow(id);
        
        if (workflow.status === 'active') {
          await this.scheduler.scheduleWorkflow(workflow);
        }
      }
      
      this.emit('workflow:updated', workflow);
    }
    
    return workflow;
  }

  // Delete a watched workflow
  async deleteWatchedWorkflow(id: string): Promise<boolean> {
    // Unschedule and cleanup
    this.scheduler.unscheduleWorkflow(id);
    
    // Delete from storage
    await workflowStorage.deleteWorkflowComplete(id);
    
    this.emit('workflow:deleted', { id });
    return true;
  }

  // Execute a workflow
  async executeWorkflow(
    workflowId: string,
    triggerType: string,
    triggeredBy?: string,
    data?: any
  ): Promise<WorkflowRun> {
    const workflow = await workflowStorage.getWatchedWorkflow(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    if (workflow.status !== 'active') {
      throw new Error(`Workflow ${workflowId} is not active`);
    }
    
    // Check if already running
    if (this.engine.isRunning(workflowId)) {
      throw new Error(`Workflow ${workflowId} is already running`);
    }
    
    // Create run record
    const run = await workflowStorage.createWorkflowRun({
      workflowId,
      runNumber: 0, // Will be calculated
      status: 'running',
      triggerType,
      triggeredBy,
      startedAt: new Date()
    });
    
    // Execute workflow
    try {
      const result = await this.engine.executeWorkflow(workflow, triggerType, triggeredBy);
      
      // Execute actions
      const actions = await workflowStorage.getWorkflowActions(workflowId);
      const actionResults = await this.actionExecutor.executeActions(
        actions,
        run,
        { ...data, extractedData: result.extractedData }
      );
      
      // Update run with results
      await workflowStorage.updateWorkflowRun(run.id, {
        status: 'success',
        completedAt: new Date(),
        duration: Date.now() - run.startedAt.getTime(),
        extractedData: result.extractedData,
        actionsExecuted: actionResults as any
      });
      
      // Update metrics
      await workflowStorage.updateWorkflowMetrics(
        workflowId,
        'success',
        result.duration
      );
      
      return result;
      
    } catch (error: any) {
      // Handle failure
      await workflowStorage.updateWorkflowRun(run.id, {
        status: 'failed',
        completedAt: new Date(),
        duration: Date.now() - run.startedAt.getTime(),
        error: error.message
      });
      
      await workflowStorage.updateWorkflowMetrics(workflowId, 'failed');
      
      throw error;
    }
  }

  // Handle workflow completion
  private async handleWorkflowCompletion(
    workflowId: string,
    runId: string,
    status: 'success' | 'failed',
    result?: any,
    error?: any
  ): Promise<void> {
    await workflowStorage.completeWorkflowRun(runId, status, error?.message);
    
    // Trigger chain workflows if successful
    if (status === 'success') {
      this.triggerService.handleWorkflowCompletion(workflowId, result);
    }
    
    this.emit('workflow:execution-complete', {
      workflowId,
      runId,
      status,
      result,
      error
    });
  }

  // Handle detected changes
  private async handleChangeDetected(
    workflowId: string,
    changeResult: any
  ): Promise<void> {
    if (!changeResult.hasChanged) return;
    
    // Get current run
    const runs = await workflowStorage.getWorkflowRuns({
      workflowId,
      status: 'running',
      limit: 1
    });
    
    const runId = runs[0]?.id;
    if (!runId) return;
    
    // Create change record
    await workflowStorage.createWorkflowChange({
      workflowId,
      runId,
      changeType: changeResult.changeType,
      severity: changeResult.severity,
      previousValue: changeResult.diff?.old,
      currentValue: changeResult.diff?.new,
      diff: changeResult.diff,
      similarity: changeResult.similarity,
      changeScore: changeResult.changeScore,
      screenshot: changeResult.screenshot
    });
    
    // Update workflow metrics
    await workflowStorage.updateWorkflowMetrics(
      workflowId,
      'success',
      undefined,
      1
    );
    
    // Emit event for triggers
    this.emit('change:detected', {
      workflowId,
      changes: changeResult
    });
  }

  // Start change detection monitoring
  private startChangeDetection(): void {
    setInterval(async () => {
      const workflows = await workflowStorage.getWatchedWorkflows('active');
      
      for (const workflow of workflows) {
        if (workflow.changeDetection && workflow.config?.url) {
          try {
            await this.changeDetector.detectChanges(
              workflow.id,
              workflow.config.url,
              workflow.changeDetectionConfig as any
            );
          } catch (error) {
            console.error(`Change detection failed for workflow ${workflow.id}:`, error);
          }
        }
      }
    }, this.config.changeDetectionInterval);
  }

  // Handle webhook trigger
  async handleWebhookTrigger(
    token: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<any> {
    return await this.triggerService.handleWebhook(token, payload, headers);
  }

  // Get workflow statistics
  async getWorkflowStats(workflowId: string): Promise<any> {
    return await workflowStorage.getWorkflowStats(workflowId);
  }

  // Get global statistics
  async getGlobalStats(): Promise<any> {
    const workflowStats = await workflowStorage.getGlobalStats();
    const scheduleStatus = this.scheduler.getScheduleStatus();
    const triggerStats = this.triggerService.getTriggerStats();
    
    return {
      ...workflowStats,
      schedule: scheduleStatus,
      triggers: triggerStats
    };
  }

  // Detect schedule conflicts
  async detectScheduleConflicts(
    workflowId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    return await this.scheduler.detectConflicts(workflowId, timeRange);
  }

  // Pause workflow
  async pauseWorkflow(workflowId: string): Promise<void> {
    await this.updateWatchedWorkflow(workflowId, { status: 'paused' });
    this.scheduler.unscheduleWorkflow(workflowId);
  }

  // Resume workflow
  async resumeWorkflow(workflowId: string): Promise<void> {
    const workflow = await workflowStorage.getWatchedWorkflow(workflowId);
    if (workflow) {
      await this.updateWatchedWorkflow(workflowId, { status: 'active' });
      await this.scheduler.scheduleWorkflow(workflow);
    }
  }

  // Manual trigger
  async triggerWorkflowManually(workflowId: string): Promise<WorkflowRun> {
    return await this.executeWorkflow(workflowId, 'manual', 'user');
  }

  // Cleanup and shutdown
  shutdown(): void {
    console.log('Shutting down Workflow Manager...');
    this.scheduler.shutdown();
    this.triggerService.shutdown();
    this.removeAllListeners();
  }
}

// Export singleton instance
let workflowManager: WorkflowManager | null = null;

export function createWorkflowManager(browserManager: BrowserManager): WorkflowManager {
  if (!workflowManager) {
    workflowManager = new WorkflowManager(browserManager);
  }
  return workflowManager;
}

export function getWorkflowManager(): WorkflowManager | null {
  return workflowManager;
}