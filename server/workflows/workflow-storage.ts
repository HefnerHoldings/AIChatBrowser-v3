import { EventEmitter } from 'events';
import { db } from '../db';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import {
  watchedWorkflows,
  workflowTriggers,
  workflowActions,
  workflowRuns,
  workflowChanges,
  workflowSchedules,
  type WatchedWorkflow,
  type WorkflowTrigger,
  type WorkflowAction,
  type WorkflowRun,
  type WorkflowChange,
  type WorkflowSchedule,
  type InsertWatchedWorkflow,
  type InsertWorkflowTrigger,
  type InsertWorkflowAction,
  type InsertWorkflowRun,
  type InsertWorkflowChange,
  type InsertWorkflowSchedule
} from '@shared/schema';

// Workflow statistics
export interface WorkflowStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  changesDetected: number;
  lastRun?: Date;
  nextRun?: Date;
}

// Run filters
export interface RunFilters {
  workflowId?: string;
  status?: string;
  triggerType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// Change filters
export interface ChangeFilters {
  workflowId?: string;
  runId?: string;
  changeType?: string;
  severity?: string;
  acknowledged?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class WorkflowStorage extends EventEmitter {
  constructor() {
    super();
  }

  // ========== Watched Workflows ==========

  async createWatchedWorkflow(data: InsertWatchedWorkflow): Promise<WatchedWorkflow> {
    const [workflow] = await db
      .insert(watchedWorkflows)
      .values(data)
      .returning();
    
    this.emit('workflow:created', workflow);
    return workflow;
  }

  async getWatchedWorkflow(id: string): Promise<WatchedWorkflow | null> {
    const [workflow] = await db
      .select()
      .from(watchedWorkflows)
      .where(eq(watchedWorkflows.id, id))
      .limit(1);
    
    return workflow || null;
  }

  async getWatchedWorkflows(status?: string): Promise<WatchedWorkflow[]> {
    const query = db.select().from(watchedWorkflows);
    
    if (status) {
      return await query.where(eq(watchedWorkflows.status, status));
    }
    
    return await query;
  }

  async updateWatchedWorkflow(
    id: string,
    updates: Partial<InsertWatchedWorkflow>
  ): Promise<WatchedWorkflow | null> {
    const [workflow] = await db
      .update(watchedWorkflows)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(watchedWorkflows.id, id))
      .returning();
    
    if (workflow) {
      this.emit('workflow:updated', workflow);
    }
    
    return workflow || null;
  }

  async deleteWatchedWorkflow(id: string): Promise<boolean> {
    const result = await db
      .delete(watchedWorkflows)
      .where(eq(watchedWorkflows.id, id));
    
    if (result.rowCount > 0) {
      this.emit('workflow:deleted', { id });
      return true;
    }
    
    return false;
  }

  async updateWorkflowMetrics(
    id: string,
    runResult: 'success' | 'failed',
    duration?: number,
    changesDetected?: number
  ): Promise<void> {
    const workflow = await this.getWatchedWorkflow(id);
    if (!workflow) return;
    
    const metrics = workflow.metrics || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageDuration: 0,
      changesDetected: 0
    };
    
    metrics.totalRuns++;
    
    if (runResult === 'success') {
      metrics.successfulRuns++;
    } else {
      metrics.failedRuns++;
    }
    
    if (duration) {
      metrics.lastDuration = duration;
      if (metrics.averageDuration === 0) {
        metrics.averageDuration = duration;
      } else {
        metrics.averageDuration = Math.round(
          (metrics.averageDuration * (metrics.totalRuns - 1) + duration) / metrics.totalRuns
        );
      }
    }
    
    if (changesDetected) {
      metrics.changesDetected += changesDetected;
    }
    
    await db
      .update(watchedWorkflows)
      .set({ 
        metrics,
        lastRun: new Date()
      })
      .where(eq(watchedWorkflows.id, id));
  }

  // ========== Workflow Triggers ==========

  async createWorkflowTrigger(data: InsertWorkflowTrigger): Promise<WorkflowTrigger> {
    const [trigger] = await db
      .insert(workflowTriggers)
      .values(data)
      .returning();
    
    this.emit('trigger:created', trigger);
    return trigger;
  }

  async getWorkflowTriggers(workflowId: string): Promise<WorkflowTrigger[]> {
    return await db
      .select()
      .from(workflowTriggers)
      .where(eq(workflowTriggers.workflowId, workflowId));
  }

  async updateWorkflowTrigger(
    id: string,
    updates: Partial<InsertWorkflowTrigger>
  ): Promise<WorkflowTrigger | null> {
    const [trigger] = await db
      .update(workflowTriggers)
      .set(updates)
      .where(eq(workflowTriggers.id, id))
      .returning();
    
    return trigger || null;
  }

  async deleteWorkflowTrigger(id: string): Promise<boolean> {
    const result = await db
      .delete(workflowTriggers)
      .where(eq(workflowTriggers.id, id));
    
    return result.rowCount > 0;
  }

  async incrementTriggerCount(id: string): Promise<void> {
    await db
      .update(workflowTriggers)
      .set({
        triggerCount: sql`${workflowTriggers.triggerCount} + 1`,
        lastTriggered: new Date()
      })
      .where(eq(workflowTriggers.id, id));
  }

  // ========== Workflow Actions ==========

  async createWorkflowAction(data: InsertWorkflowAction): Promise<WorkflowAction> {
    const [action] = await db
      .insert(workflowActions)
      .values(data)
      .returning();
    
    this.emit('action:created', action);
    return action;
  }

  async getWorkflowActions(workflowId: string): Promise<WorkflowAction[]> {
    return await db
      .select()
      .from(workflowActions)
      .where(eq(workflowActions.workflowId, workflowId))
      .orderBy(workflowActions.order);
  }

  async getWorkflowAction(id: string): Promise<WorkflowAction | null> {
    const [action] = await db
      .select()
      .from(workflowActions)
      .where(eq(workflowActions.id, id))
      .limit(1);
    
    return action || null;
  }

  async updateWorkflowAction(
    id: string,
    updates: Partial<InsertWorkflowAction>
  ): Promise<WorkflowAction | null> {
    const [action] = await db
      .update(workflowActions)
      .set(updates)
      .where(eq(workflowActions.id, id))
      .returning();
    
    return action || null;
  }

  async deleteWorkflowAction(id: string): Promise<boolean> {
    const result = await db
      .delete(workflowActions)
      .where(eq(workflowActions.id, id));
    
    return result.rowCount > 0;
  }

  // ========== Workflow Runs ==========

  async createWorkflowRun(data: InsertWorkflowRun): Promise<WorkflowRun> {
    // Get next run number
    const [lastRun] = await db
      .select({ maxRunNumber: sql`MAX(${workflowRuns.runNumber})` })
      .from(workflowRuns)
      .where(eq(workflowRuns.workflowId, data.workflowId));
    
    const runNumber = (lastRun?.maxRunNumber || 0) + 1;
    
    const [run] = await db
      .insert(workflowRuns)
      .values({
        ...data,
        runNumber,
        startedAt: data.startedAt || new Date()
      })
      .returning();
    
    this.emit('run:created', run);
    return run;
  }

  async getWorkflowRun(id: string): Promise<WorkflowRun | null> {
    const [run] = await db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.id, id))
      .limit(1);
    
    return run || null;
  }

  async getWorkflowRuns(filters: RunFilters = {}): Promise<WorkflowRun[]> {
    let query = db.select().from(workflowRuns);
    
    const conditions = [];
    
    if (filters.workflowId) {
      conditions.push(eq(workflowRuns.workflowId, filters.workflowId));
    }
    
    if (filters.status) {
      conditions.push(eq(workflowRuns.status, filters.status));
    }
    
    if (filters.triggerType) {
      conditions.push(eq(workflowRuns.triggerType, filters.triggerType));
    }
    
    if (filters.startDate) {
      conditions.push(gte(workflowRuns.startedAt, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(workflowRuns.startedAt, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(workflowRuns.startedAt));
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async updateWorkflowRun(
    id: string,
    updates: Partial<InsertWorkflowRun>
  ): Promise<WorkflowRun | null> {
    const [run] = await db
      .update(workflowRuns)
      .set(updates)
      .where(eq(workflowRuns.id, id))
      .returning();
    
    if (run) {
      this.emit('run:updated', run);
    }
    
    return run || null;
  }

  async completeWorkflowRun(
    id: string,
    status: 'success' | 'failed',
    error?: string
  ): Promise<void> {
    const run = await this.getWorkflowRun(id);
    if (!run) return;
    
    const duration = Date.now() - run.startedAt.getTime();
    
    await this.updateWorkflowRun(id, {
      status,
      completedAt: new Date(),
      duration,
      error
    });
    
    // Update workflow metrics
    await this.updateWorkflowMetrics(run.workflowId, status, duration);
  }

  // ========== Workflow Changes ==========

  async createWorkflowChange(data: InsertWorkflowChange): Promise<WorkflowChange> {
    const [change] = await db
      .insert(workflowChanges)
      .values(data)
      .returning();
    
    this.emit('change:created', change);
    return change;
  }

  async getWorkflowChanges(filters: ChangeFilters = {}): Promise<WorkflowChange[]> {
    let query = db.select().from(workflowChanges);
    
    const conditions = [];
    
    if (filters.workflowId) {
      conditions.push(eq(workflowChanges.workflowId, filters.workflowId));
    }
    
    if (filters.runId) {
      conditions.push(eq(workflowChanges.runId, filters.runId));
    }
    
    if (filters.changeType) {
      conditions.push(eq(workflowChanges.changeType, filters.changeType));
    }
    
    if (filters.severity) {
      conditions.push(eq(workflowChanges.severity, filters.severity));
    }
    
    if (filters.acknowledged !== undefined) {
      conditions.push(eq(workflowChanges.acknowledged, filters.acknowledged));
    }
    
    if (filters.startDate) {
      conditions.push(gte(workflowChanges.detectedAt, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(workflowChanges.detectedAt, filters.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(workflowChanges.detectedAt));
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async acknowledgeChange(id: string): Promise<void> {
    await db
      .update(workflowChanges)
      .set({ acknowledged: true })
      .where(eq(workflowChanges.id, id));
  }

  async markChangeNotified(id: string): Promise<void> {
    await db
      .update(workflowChanges)
      .set({ notified: true })
      .where(eq(workflowChanges.id, id));
  }

  // ========== Workflow Schedules ==========

  async createWorkflowSchedule(data: InsertWorkflowSchedule): Promise<WorkflowSchedule> {
    const [schedule] = await db
      .insert(workflowSchedules)
      .values(data)
      .returning();
    
    this.emit('schedule:created', schedule);
    return schedule;
  }

  async getWorkflowSchedules(workflowId: string): Promise<WorkflowSchedule[]> {
    return await db
      .select()
      .from(workflowSchedules)
      .where(eq(workflowSchedules.workflowId, workflowId));
  }

  async updateWorkflowSchedule(
    id: string,
    updates: Partial<InsertWorkflowSchedule>
  ): Promise<WorkflowSchedule | null> {
    const [schedule] = await db
      .update(workflowSchedules)
      .set(updates)
      .where(eq(workflowSchedules.id, id))
      .returning();
    
    return schedule || null;
  }

  async updateScheduleNextRun(
    id: string,
    nextRun: Date,
    lastRun?: Date
  ): Promise<void> {
    const updates: any = { nextRun };
    
    if (lastRun) {
      updates.lastRun = lastRun;
      updates.runCount = sql`${workflowSchedules.runCount} + 1`;
    }
    
    await db
      .update(workflowSchedules)
      .set(updates)
      .where(eq(workflowSchedules.id, id));
  }

  async deleteWorkflowSchedule(id: string): Promise<boolean> {
    const result = await db
      .delete(workflowSchedules)
      .where(eq(workflowSchedules.id, id));
    
    return result.rowCount > 0;
  }

  // ========== Statistics & Analytics ==========

  async getWorkflowStats(workflowId: string): Promise<WorkflowStats> {
    const workflow = await this.getWatchedWorkflow(workflowId);
    
    if (!workflow) {
      return {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageDuration: 0,
        changesDetected: 0
      };
    }
    
    const metrics = workflow.metrics || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      averageDuration: 0,
      changesDetected: 0
    };
    
    return {
      ...metrics,
      lastRun: workflow.lastRun || undefined,
      nextRun: workflow.nextRun || undefined
    };
  }

  async getGlobalStats(): Promise<any> {
    const [workflows] = await db
      .select({
        total: sql`COUNT(*)`,
        active: sql`COUNT(*) FILTER (WHERE ${watchedWorkflows.status} = 'active')`,
        paused: sql`COUNT(*) FILTER (WHERE ${watchedWorkflows.status} = 'paused')`,
        error: sql`COUNT(*) FILTER (WHERE ${watchedWorkflows.status} = 'error')`
      })
      .from(watchedWorkflows);
    
    const [runs] = await db
      .select({
        total: sql`COUNT(*)`,
        success: sql`COUNT(*) FILTER (WHERE ${workflowRuns.status} = 'success')`,
        failed: sql`COUNT(*) FILTER (WHERE ${workflowRuns.status} = 'failed')`,
        running: sql`COUNT(*) FILTER (WHERE ${workflowRuns.status} = 'running')`,
        avgDuration: sql`AVG(${workflowRuns.duration})`
      })
      .from(workflowRuns);
    
    const [changes] = await db
      .select({
        total: sql`COUNT(*)`,
        unacknowledged: sql`COUNT(*) FILTER (WHERE ${workflowChanges.acknowledged} = false)`,
        critical: sql`COUNT(*) FILTER (WHERE ${workflowChanges.severity} = 'critical')`,
        high: sql`COUNT(*) FILTER (WHERE ${workflowChanges.severity} = 'high')`
      })
      .from(workflowChanges);
    
    return {
      workflows,
      runs,
      changes
    };
  }

  // ========== Bulk Operations ==========

  async createWorkflowWithTriggersAndActions(
    workflow: InsertWatchedWorkflow,
    triggers: InsertWorkflowTrigger[],
    actions: InsertWorkflowAction[]
  ): Promise<{
    workflow: WatchedWorkflow;
    triggers: WorkflowTrigger[];
    actions: WorkflowAction[];
  }> {
    // Create workflow
    const createdWorkflow = await this.createWatchedWorkflow(workflow);
    
    // Create triggers
    const createdTriggers = await Promise.all(
      triggers.map(trigger => 
        this.createWorkflowTrigger({
          ...trigger,
          workflowId: createdWorkflow.id
        })
      )
    );
    
    // Create actions
    const createdActions = await Promise.all(
      actions.map((action, index) => 
        this.createWorkflowAction({
          ...action,
          workflowId: createdWorkflow.id,
          order: action.order || index
        })
      )
    );
    
    return {
      workflow: createdWorkflow,
      triggers: createdTriggers,
      actions: createdActions
    };
  }

  async deleteWorkflowComplete(workflowId: string): Promise<void> {
    // Delete all related data
    await db.delete(workflowChanges)
      .where(eq(workflowChanges.workflowId, workflowId));
    
    await db.delete(workflowRuns)
      .where(eq(workflowRuns.workflowId, workflowId));
    
    await db.delete(workflowActions)
      .where(eq(workflowActions.workflowId, workflowId));
    
    await db.delete(workflowTriggers)
      .where(eq(workflowTriggers.workflowId, workflowId));
    
    await db.delete(workflowSchedules)
      .where(eq(workflowSchedules.workflowId, workflowId));
    
    await db.delete(watchedWorkflows)
      .where(eq(watchedWorkflows.id, workflowId));
    
    this.emit('workflow:deleted-complete', { workflowId });
  }

  // ========== Migration & Maintenance ==========

  async migrateOldWorkflows(): Promise<void> {
    // Migrate old workflow format to new watched workflows
    // This would be implemented based on legacy data structure
    console.log('Migration not yet implemented');
  }

  async cleanupOldRuns(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(workflowRuns)
      .where(lte(workflowRuns.startedAt, cutoffDate));
    
    return result.rowCount;
  }

  async cleanupOldChanges(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(workflowChanges)
      .where(
        and(
          lte(workflowChanges.detectedAt, cutoffDate),
          eq(workflowChanges.acknowledged, true)
        )
      );
    
    return result.rowCount;
  }
}

// Export singleton instance
export const workflowStorage = new WorkflowStorage();