import { EventEmitter } from 'events';
import * as rrule from 'rrule';
const { RRule, rrulestr } = rrule;
import * as cron from 'node-cron';
import { storage } from '../storage';
import type { WatchedWorkflow, WorkflowSchedule } from '@shared/schema';

// Schedule job definition
export interface ScheduleJob {
  id: string;
  workflowId: string;
  type: 'rrule' | 'cron' | 'interval' | 'once';
  expression: string;
  timezone: string;
  nextRun?: Date;
  lastRun?: Date;
  enabled: boolean;
  cronTask?: cron.ScheduledTask;
  intervalId?: NodeJS.Timeout;
}

// Schedule conflict
export interface ScheduleConflict {
  workflowId1: string;
  workflowId2: string;
  overlappingTime: Date;
  severity: 'low' | 'medium' | 'high';
}

// Queue item for execution
export interface QueueItem {
  workflowId: string;
  scheduleId: string;
  priority: number;
  scheduledTime: Date;
  addedAt: Date;
}

export class SchedulerService extends EventEmitter {
  private schedules: Map<string, ScheduleJob> = new Map();
  private executionQueue: QueueItem[] = [];
  private processing: boolean = false;
  private maxConcurrentRuns: number;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(maxConcurrentRuns: number = 5) {
    super();
    this.maxConcurrentRuns = maxConcurrentRuns;
    this.startQueueProcessor();
    this.startScheduleChecker();
  }

  // Initialize scheduler with existing workflows
  async initialize(): Promise<void> {
    try {
      const workflows = await storage.getWatchedWorkflows();
      
      for (const workflow of workflows) {
        if (workflow.status === 'active') {
          await this.scheduleWorkflow(workflow);
        }
      }
      
      console.log(`Scheduler initialized with ${this.schedules.size} active schedules`);
    } catch (error) {
      console.error('Failed to initialize scheduler:', error);
    }
  }

  // Schedule a workflow
  async scheduleWorkflow(workflow: WatchedWorkflow): Promise<void> {
    const { id, scheduleType, scheduleConfig } = workflow;
    
    if (!scheduleConfig) {
      console.warn(`No schedule config for workflow ${id}`);
      return;
    }

    // Remove existing schedule if any
    this.unscheduleWorkflow(id);

    const job: ScheduleJob = {
      id: `schedule-${id}`,
      workflowId: id,
      type: scheduleType as any,
      expression: '',
      timezone: scheduleConfig.timezone || 'UTC',
      enabled: true
    };

    try {
      switch (scheduleType) {
        case 'rrule':
          if (scheduleConfig.rrule) {
            job.expression = scheduleConfig.rrule;
            this.scheduleRRule(job);
          }
          break;
          
        case 'cron':
          if (scheduleConfig.cron) {
            job.expression = scheduleConfig.cron;
            this.scheduleCron(job);
          }
          break;
          
        case 'interval':
          if (scheduleConfig.interval) {
            job.expression = String(scheduleConfig.interval);
            this.scheduleInterval(job);
          }
          break;
      }

      this.schedules.set(job.id, job);
      this.emit('schedule:created', { workflowId: id, job });
      
    } catch (error) {
      console.error(`Failed to schedule workflow ${id}:`, error);
      this.emit('schedule:error', { workflowId: id, error });
    }
  }

  // Schedule using RRULE
  private scheduleRRule(job: ScheduleJob): void {
    try {
      const rule = rrulestr(job.expression, { 
        dtstart: new Date() 
      });
      
      // Calculate next occurrences
      const nextOccurrences = rule.between(
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
        true,
        (date, i) => i < 100 // Limit to 100 occurrences
      );

      if (nextOccurrences.length > 0) {
        job.nextRun = nextOccurrences[0];
        
        // Store future runs for conflict detection
        this.storeFutureRuns(job.workflowId, nextOccurrences);
      }
      
      // Create a cron job that checks for RRULE matches
      const cronExpression = '* * * * *'; // Check every minute
      job.cronTask = cron.schedule(cronExpression, () => {
        const now = new Date();
        const next = rule.after(now, false);
        
        if (next && this.isTimeToRun(next, now)) {
          this.queueExecution(job.workflowId, job.id, 5);
          job.lastRun = now;
          job.nextRun = rule.after(next, false);
        }
      }, {
        scheduled: true,
        timezone: job.timezone
      });
      
    } catch (error) {
      throw new Error(`Invalid RRULE: ${error}`);
    }
  }

  // Schedule using cron expression
  private scheduleCron(job: ScheduleJob): void {
    if (!cron.validate(job.expression)) {
      throw new Error(`Invalid cron expression: ${job.expression}`);
    }

    job.cronTask = cron.schedule(job.expression, () => {
      this.queueExecution(job.workflowId, job.id, 5);
      job.lastRun = new Date();
      
      // Calculate next run
      const cronExpression = job.expression.split(' ');
      job.nextRun = this.calculateNextCronRun(cronExpression);
      
    }, {
      scheduled: true,
      timezone: job.timezone
    });
  }

  // Schedule using interval
  private scheduleInterval(job: ScheduleJob): void {
    const interval = parseInt(job.expression);
    if (isNaN(interval) || interval <= 0) {
      throw new Error(`Invalid interval: ${job.expression}`);
    }

    job.intervalId = setInterval(() => {
      this.queueExecution(job.workflowId, job.id, 3);
      job.lastRun = new Date();
      job.nextRun = new Date(Date.now() + interval);
    }, interval);

    job.nextRun = new Date(Date.now() + interval);
  }

  // Unschedule a workflow
  unscheduleWorkflow(workflowId: string): void {
    const scheduleId = `schedule-${workflowId}`;
    const job = this.schedules.get(scheduleId);
    
    if (job) {
      if (job.cronTask) {
        job.cronTask.stop();
      }
      if (job.intervalId) {
        clearInterval(job.intervalId);
      }
      
      this.schedules.delete(scheduleId);
      this.emit('schedule:removed', { workflowId });
    }
  }

  // Queue workflow for execution
  private queueExecution(
    workflowId: string, 
    scheduleId: string, 
    priority: number = 5
  ): void {
    const item: QueueItem = {
      workflowId,
      scheduleId,
      priority,
      scheduledTime: new Date(),
      addedAt: new Date()
    };

    // Insert into queue based on priority
    const insertIndex = this.executionQueue.findIndex(
      existing => existing.priority < priority
    );
    
    if (insertIndex === -1) {
      this.executionQueue.push(item);
    } else {
      this.executionQueue.splice(insertIndex, 0, item);
    }

    this.emit('workflow:queued', item);
    this.processQueue();
  }

  // Process execution queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.executionQueue.length === 0) {
      return;
    }

    this.processing = true;
    const concurrentRuns = Math.min(
      this.maxConcurrentRuns, 
      this.executionQueue.length
    );

    const toExecute = this.executionQueue.splice(0, concurrentRuns);
    const executions = toExecute.map(item => this.executeWorkflow(item));

    try {
      await Promise.allSettled(executions);
    } finally {
      this.processing = false;
      
      // Continue processing if queue has items
      if (this.executionQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  // Execute a workflow
  private async executeWorkflow(item: QueueItem): Promise<void> {
    this.emit('workflow:executing', item);
    
    try {
      // Trigger workflow execution through the engine
      await new Promise(resolve => {
        this.emit('execute:workflow', {
          workflowId: item.workflowId,
          triggerType: 'scheduled',
          triggeredBy: item.scheduleId,
          callback: resolve
        });
      });
      
      this.emit('workflow:executed', item);
    } catch (error) {
      this.emit('workflow:execution-failed', { item, error });
    }
  }

  // Check for schedule conflicts
  async detectConflicts(
    workflowId: string, 
    timeRange?: { start: Date; end: Date }
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];
    const job = this.schedules.get(`schedule-${workflowId}`);
    
    if (!job) return conflicts;

    const range = timeRange || {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
    };

    // Get future runs for this workflow
    const thisRuns = await this.getFutureRuns(workflowId, range);

    // Check against other workflows
    for (const [id, otherJob] of this.schedules) {
      if (otherJob.workflowId === workflowId) continue;
      
      const otherRuns = await this.getFutureRuns(otherJob.workflowId, range);
      
      // Find overlapping times
      for (const thisRun of thisRuns) {
        for (const otherRun of otherRuns) {
          const timeDiff = Math.abs(thisRun.getTime() - otherRun.getTime());
          
          // Consider runs within 5 minutes as conflicting
          if (timeDiff < 5 * 60 * 1000) {
            conflicts.push({
              workflowId1: workflowId,
              workflowId2: otherJob.workflowId,
              overlappingTime: thisRun,
              severity: timeDiff < 60000 ? 'high' : timeDiff < 180000 ? 'medium' : 'low'
            });
          }
        }
      }
    }

    return conflicts;
  }

  // Get future runs for a workflow
  private async getFutureRuns(
    workflowId: string,
    range: { start: Date; end: Date }
  ): Promise<Date[]> {
    const job = this.schedules.get(`schedule-${workflowId}`);
    if (!job) return [];

    const runs: Date[] = [];

    switch (job.type) {
      case 'rrule':
        const rule = rrulestr(job.expression);
        return rule.between(range.start, range.end, true);
        
      case 'cron':
        // Estimate cron runs (simplified)
        const current = new Date(range.start);
        while (current < range.end) {
          if (this.matchesCron(job.expression, current)) {
            runs.push(new Date(current));
          }
          current.setMinutes(current.getMinutes() + 1);
        }
        return runs;
        
      case 'interval':
        const interval = parseInt(job.expression);
        let next = job.nextRun || new Date();
        while (next < range.end) {
          if (next >= range.start) {
            runs.push(new Date(next));
          }
          next = new Date(next.getTime() + interval);
        }
        return runs;
        
      default:
        return [];
    }
  }

  // Helper functions
  private isTimeToRun(scheduled: Date, now: Date): boolean {
    const diff = Math.abs(scheduled.getTime() - now.getTime());
    return diff < 60000; // Within 1 minute
  }

  private calculateNextCronRun(cronParts: string[]): Date {
    // Simplified next run calculation
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // This is a simplified version - real implementation would parse cron properly
    if (cronParts[0] !== '*') {
      now.setMinutes(parseInt(cronParts[0]));
    } else {
      now.setMinutes(now.getMinutes() + 1);
    }
    
    return now;
  }

  private matchesCron(expression: string, date: Date): boolean {
    // Simplified cron matching
    const parts = expression.split(' ');
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    if (minute !== '*' && date.getMinutes() !== parseInt(minute)) return false;
    if (hour !== '*' && date.getHours() !== parseInt(hour)) return false;
    if (dayOfMonth !== '*' && date.getDate() !== parseInt(dayOfMonth)) return false;
    if (month !== '*' && date.getMonth() + 1 !== parseInt(month)) return false;
    if (dayOfWeek !== '*' && date.getDay() !== parseInt(dayOfWeek)) return false;
    
    return true;
  }

  private storeFutureRuns(workflowId: string, runs: Date[]): void {
    // Store in memory or database for conflict detection
    // Implementation depends on storage strategy
  }

  // Start queue processor
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.executionQueue.length > 0) {
        this.processQueue();
      }
    }, 1000);
  }

  // Start schedule checker
  private startScheduleChecker(): void {
    this.checkInterval = setInterval(() => {
      const now = new Date();
      
      for (const job of this.schedules.values()) {
        if (job.enabled && job.nextRun && job.nextRun <= now) {
          // Handle once schedules
          if (job.type === 'once') {
            this.queueExecution(job.workflowId, job.id, 10);
            this.unscheduleWorkflow(job.workflowId);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get schedule status
  getScheduleStatus(): any {
    const status = {
      totalSchedules: this.schedules.size,
      activeSchedules: 0,
      queueLength: this.executionQueue.length,
      processing: this.processing,
      schedules: [] as any[]
    };

    for (const job of this.schedules.values()) {
      if (job.enabled) status.activeSchedules++;
      
      status.schedules.push({
        workflowId: job.workflowId,
        type: job.type,
        enabled: job.enabled,
        nextRun: job.nextRun,
        lastRun: job.lastRun
      });
    }

    return status;
  }

  // Cleanup
  shutdown(): void {
    for (const job of this.schedules.values()) {
      if (job.cronTask) job.cronTask.stop();
      if (job.intervalId) clearInterval(job.intervalId);
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.schedules.clear();
    this.executionQueue = [];
  }
}