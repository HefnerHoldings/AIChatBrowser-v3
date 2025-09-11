import { 
  type Project, 
  type Workflow, 
  type AutomationTask, 
  type ActivityLog, 
  type ExtractedLead,
  type SessionReplay,
  type WorkOrder,
  type PrivacyLedger,
  type AdrRecord,
  type Bookmark,
  type BrowserHistory,
  type Download,
  type InsertProject, 
  type InsertWorkflow, 
  type InsertAutomationTask, 
  type InsertActivityLog, 
  type InsertExtractedLead,
  type InsertSessionReplay,
  type InsertWorkOrder,
  type InsertPrivacyLedger,
  type InsertAdrRecord,
  type InsertBookmark,
  type InsertBrowserHistory,
  type InsertDownload,
  type SavedPassword,
  type InsertSavedPassword,
  type WorkflowAIChat,
  type WorkflowVoiceSession,
  type WorkflowStepConfig,
  type InsertWorkflowAIChat,
  type InsertWorkflowVoiceSession,
  type InsertWorkflowStepConfig,
  type MarketplaceItem,
  type MarketplaceVersion,
  type MarketplaceAuthor,
  type MarketplaceInstallation,
  type MarketplaceReview,
  type MarketplaceLicense,
  type MarketplacePermission,
  type MarketplaceDependency,
  type MarketplaceDownload,
  type MarketplaceTransaction,
  type MarketplaceExecutionLog,
  type InsertMarketplaceItem,
  type InsertMarketplaceVersion,
  type InsertMarketplaceAuthor,
  type InsertMarketplaceInstallation,
  type InsertMarketplaceReview,
  type InsertMarketplaceLicense,
  type InsertMarketplacePermission,
  type InsertMarketplaceDependency,
  type InsertMarketplaceDownload,
  type InsertMarketplaceTransaction,
  type InsertMarketplaceExecutionLog,
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
  type InsertWorkflowSchedule,
  projects,
  workflows,
  automationTasks,
  activityLogs,
  extractedLeads,
  sessionReplays,
  workOrders,
  privacyLedger,
  adrRecords,
  bookmarks,
  browserHistory,
  downloads,
  savedPasswords,
  workflowAIChats,
  workflowVoiceSessions,
  workflowStepConfigs,
  marketplaceItems,
  marketplaceVersions,
  marketplaceAuthors,
  marketplaceInstallations,
  marketplaceReviews,
  marketplaceLicenses,
  marketplacePermissions,
  marketplaceDependencies,
  marketplaceDownloads,
  marketplaceTransactions,
  marketplaceExecutionLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, like, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  
  // Workflows
  getWorkflows(projectId?: string): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  
  // Automation Tasks
  getAutomationTasks(projectId?: string): Promise<AutomationTask[]>;
  getAutomationTask(id: string): Promise<AutomationTask | undefined>;
  createAutomationTask(task: InsertAutomationTask): Promise<AutomationTask>;
  updateAutomationTask(id: string, updates: Partial<InsertAutomationTask>): Promise<AutomationTask | undefined>;
  
  // Activity Logs
  getActivityLogs(taskId?: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Extracted Leads
  getExtractedLeads(taskId?: string): Promise<ExtractedLead[]>;
  createExtractedLead(lead: InsertExtractedLead): Promise<ExtractedLead>;
  bulkCreateExtractedLeads(leads: InsertExtractedLead[]): Promise<ExtractedLead[]>;
  
  // Session Replays
  getSessionReplays(projectId?: string): Promise<SessionReplay[]>;
  getSessionReplay(id: string): Promise<SessionReplay | undefined>;
  createSessionReplay(replay: InsertSessionReplay): Promise<SessionReplay>;
  updateSessionReplay(id: string, updates: Partial<InsertSessionReplay>): Promise<SessionReplay | undefined>;
  
  // Work Orders
  getWorkOrders(projectId?: string): Promise<WorkOrder[]>;
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  createWorkOrder(order: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined>;
  
  // Privacy Ledger
  getPrivacyLedger(sessionId?: string): Promise<PrivacyLedger[]>;
  createPrivacyLog(log: InsertPrivacyLedger): Promise<PrivacyLedger>;
  
  // ADR Records
  getAdrRecords(projectId?: string): Promise<AdrRecord[]>;
  getAdrRecord(id: string): Promise<AdrRecord | undefined>;
  createAdrRecord(record: InsertAdrRecord): Promise<AdrRecord>;
  updateAdrRecord(id: string, updates: Partial<InsertAdrRecord>): Promise<AdrRecord | undefined>;
  
  // Bookmarks
  getBookmarks(): Promise<Bookmark[]>;
  getBookmark(id: string): Promise<Bookmark | undefined>;
  getBookmarkByUrl(url: string): Promise<Bookmark | undefined>;
  getBookmarkFolders(): Promise<string[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: string): Promise<boolean>;
  reorderBookmarks(bookmarkIds: string[], startPosition: number): Promise<void>;
  
  // Browser History
  getBrowserHistory(limit?: number, offset?: number, searchQuery?: string): Promise<BrowserHistory[]>;
  addToHistory(history: InsertBrowserHistory): Promise<BrowserHistory>;
  deleteHistoryItem(id: string): Promise<boolean>;
  clearHistory(): Promise<void>;
  getHistoryCount(): Promise<number>;
  
  // Downloads
  getDownloads(): Promise<Download[]>;
  getDownload(id: string): Promise<Download | undefined>;
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: string, updates: Partial<InsertDownload>): Promise<Download | undefined>;
  deleteDownload(id: string): Promise<boolean>;
  
  // Saved Passwords
  getSavedPasswords(): Promise<SavedPassword[]>;
  getSavedPasswordForDomain(domain: string): Promise<SavedPassword[]>;
  savePassword(password: InsertSavedPassword): Promise<SavedPassword>;
  updatePassword(id: string, updates: Partial<InsertSavedPassword>): Promise<SavedPassword | undefined>;
  deletePassword(id: string): Promise<boolean>;
  
  // Workflow AI Chats
  getWorkflowAIChats(workflowId?: string): Promise<WorkflowAIChat[]>;
  getWorkflowAIChatsBySession(sessionId: string): Promise<WorkflowAIChat[]>;
  createWorkflowAIChat(chat: InsertWorkflowAIChat): Promise<WorkflowAIChat>;
  
  // Workflow Voice Sessions
  getWorkflowVoiceSessions(): Promise<WorkflowVoiceSession[]>;
  getWorkflowVoiceSession(sessionId: string): Promise<WorkflowVoiceSession | undefined>;
  createWorkflowVoiceSession(session: InsertWorkflowVoiceSession): Promise<WorkflowVoiceSession>;
  updateWorkflowVoiceSession(id: string, updates: Partial<InsertWorkflowVoiceSession>): Promise<WorkflowVoiceSession | undefined>;
  
  // Workflow Step Configs
  getWorkflowStepConfigs(workflowId: string): Promise<WorkflowStepConfig[]>;
  createWorkflowStepConfig(config: InsertWorkflowStepConfig): Promise<WorkflowStepConfig>;
  updateWorkflowStepConfig(id: string, updates: Partial<InsertWorkflowStepConfig>): Promise<WorkflowStepConfig | undefined>;
  deleteWorkflowStepConfig(id: string): Promise<boolean>;
  
  // Workflow Templates
  getWorkflowTemplates(): Promise<Workflow[]>;
  createWorkflowFromTemplate(templateId: string): Promise<Workflow>;
  
  // Marketplace
  getMarketplaceItems(filters?: { type?: string; category?: string; search?: string; featured?: boolean }): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>;
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: string): Promise<boolean>;
  
  getMarketplaceAuthor(id: string): Promise<MarketplaceAuthor | undefined>;
  getMarketplaceAuthorByUserId(userId: string): Promise<MarketplaceAuthor | undefined>;
  createMarketplaceAuthor(author: InsertMarketplaceAuthor): Promise<MarketplaceAuthor>;
  updateMarketplaceAuthor(id: string, updates: Partial<InsertMarketplaceAuthor>): Promise<MarketplaceAuthor | undefined>;
  
  getMarketplaceInstallations(userId: string): Promise<MarketplaceInstallation[]>;
  getMarketplaceInstallation(itemId: string, userId: string): Promise<MarketplaceInstallation | undefined>;
  createMarketplaceInstallation(installation: InsertMarketplaceInstallation): Promise<MarketplaceInstallation>;
  updateMarketplaceInstallation(id: string, updates: Partial<InsertMarketplaceInstallation>): Promise<MarketplaceInstallation | undefined>;
  
  getMarketplaceReviews(itemId: string): Promise<MarketplaceReview[]>;
  createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>;
  
  getMarketplaceVersion(id: string): Promise<MarketplaceVersion | undefined>;
  getMarketplaceVersions(itemId: string): Promise<MarketplaceVersion[]>;
  createMarketplaceVersion(version: InsertMarketplaceVersion): Promise<MarketplaceVersion>;
  
  createMarketplaceLicense(license: InsertMarketplaceLicense): Promise<MarketplaceLicense>;
  getMarketplaceLicense(licenseKey: string): Promise<MarketplaceLicense | undefined>;
  
  trackMarketplaceDownload(download: InsertMarketplaceDownload): Promise<MarketplaceDownload>;
  recordMarketplaceExecution(log: InsertMarketplaceExecutionLog): Promise<MarketplaceExecutionLog>;
  
  // Watched Workflows
  getWatchedWorkflows(status?: string): Promise<WatchedWorkflow[]>;
  getWatchedWorkflow(id: string): Promise<WatchedWorkflow | null>;
  createWatchedWorkflow(workflow: InsertWatchedWorkflow): Promise<WatchedWorkflow>;
  updateWatchedWorkflow(id: string, updates: Partial<InsertWatchedWorkflow>): Promise<WatchedWorkflow | null>;
  deleteWatchedWorkflow(id: string): Promise<boolean>;
  
  // Workflow Triggers
  getWorkflowTriggers(workflowId: string): Promise<WorkflowTrigger[]>;
  createWorkflowTrigger(trigger: InsertWorkflowTrigger): Promise<WorkflowTrigger>;
  updateWorkflowTrigger(id: string, updates: Partial<InsertWorkflowTrigger>): Promise<WorkflowTrigger | null>;
  deleteWorkflowTrigger(id: string): Promise<boolean>;
  
  // Workflow Actions
  getWorkflowActions(workflowId: string): Promise<WorkflowAction[]>;
  getWorkflowAction(id: string): Promise<WorkflowAction | null>;
  createWorkflowAction(action: InsertWorkflowAction): Promise<WorkflowAction>;
  updateWorkflowAction(id: string, updates: Partial<InsertWorkflowAction>): Promise<WorkflowAction | null>;
  deleteWorkflowAction(id: string): Promise<boolean>;
  
  // Workflow Runs
  getWorkflowRuns(filters?: { workflowId?: string; status?: string; limit?: number }): Promise<WorkflowRun[]>;
  getWorkflowRun(id: string): Promise<WorkflowRun | null>;
  createWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun>;
  updateWorkflowRun(id: string, updates: Partial<InsertWorkflowRun>): Promise<WorkflowRun | null>;
  
  // Workflow Changes
  getWorkflowChanges(filters?: { workflowId?: string; runId?: string; acknowledged?: boolean }): Promise<WorkflowChange[]>;
  createWorkflowChange(change: InsertWorkflowChange): Promise<WorkflowChange>;
  acknowledgeWorkflowChange(id: string): Promise<void>;
  
  // Workflow Schedules
  getWorkflowSchedules(workflowId: string): Promise<WorkflowSchedule[]>;
  createWorkflowSchedule(schedule: InsertWorkflowSchedule): Promise<WorkflowSchedule>;
  updateWorkflowSchedule(id: string, updates: Partial<InsertWorkflowSchedule>): Promise<WorkflowSchedule | null>;
  deleteWorkflowSchedule(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const [project] = await db
      .insert(projects)
      .values({ ...insertProject, id })
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  // Workflows
  async getWorkflows(projectId?: string): Promise<Workflow[]> {
    if (projectId) {
      return await db
        .select()
        .from(workflows)
        .where(eq(workflows.projectId, projectId))
        .orderBy(desc(workflows.createdAt));
    }
    return await db.select().from(workflows).orderBy(desc(workflows.createdAt));
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const [workflow] = await db
      .insert(workflows)
      .values({ ...insertWorkflow, id })
      .returning();
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [workflow] = await db
      .update(workflows)
      .set(updates)
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  // Automation Tasks
  async getAutomationTasks(projectId?: string): Promise<AutomationTask[]> {
    if (projectId) {
      return await db
        .select()
        .from(automationTasks)
        .where(eq(automationTasks.projectId, projectId))
        .orderBy(desc(automationTasks.createdAt));
    }
    return await db.select().from(automationTasks).orderBy(desc(automationTasks.createdAt));
  }

  async getAutomationTask(id: string): Promise<AutomationTask | undefined> {
    const [task] = await db.select().from(automationTasks).where(eq(automationTasks.id, id));
    return task;
  }

  async createAutomationTask(insertTask: InsertAutomationTask): Promise<AutomationTask> {
    const id = randomUUID();
    const [task] = await db
      .insert(automationTasks)
      .values({ ...insertTask, id })
      .returning();
    return task;
  }

  async updateAutomationTask(id: string, updates: Partial<InsertAutomationTask>): Promise<AutomationTask | undefined> {
    const [task] = await db
      .update(automationTasks)
      .set(updates)
      .where(eq(automationTasks.id, id))
      .returning();
    return task;
  }

  // Activity Logs
  async getActivityLogs(taskId?: string): Promise<ActivityLog[]> {
    if (taskId) {
      return await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.taskId, taskId))
        .orderBy(desc(activityLogs.timestamp));
    }
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const [log] = await db
      .insert(activityLogs)
      .values({ ...insertLog, id })
      .returning();
    return log;
  }

  // Extracted Leads
  async getExtractedLeads(taskId?: string): Promise<ExtractedLead[]> {
    if (taskId) {
      return await db
        .select()
        .from(extractedLeads)
        .where(eq(extractedLeads.taskId, taskId))
        .orderBy(desc(extractedLeads.extractedAt));
    }
    return await db.select().from(extractedLeads).orderBy(desc(extractedLeads.extractedAt));
  }

  async createExtractedLead(insertLead: InsertExtractedLead): Promise<ExtractedLead> {
    const id = randomUUID();
    const [lead] = await db
      .insert(extractedLeads)
      .values({ ...insertLead, id })
      .returning();
    return lead;
  }

  async bulkCreateExtractedLeads(insertLeads: InsertExtractedLead[]): Promise<ExtractedLead[]> {
    const leadsWithIds = insertLeads.map(lead => ({ ...lead, id: randomUUID() }));
    const createdLeads = await db
      .insert(extractedLeads)
      .values(leadsWithIds)
      .returning();
    return createdLeads;
  }

  // Session Replays
  async getSessionReplays(projectId?: string): Promise<SessionReplay[]> {
    if (projectId) {
      return await db
        .select()
        .from(sessionReplays)
        .where(eq(sessionReplays.projectId, projectId))
        .orderBy(desc(sessionReplays.createdAt));
    }
    return await db.select().from(sessionReplays).orderBy(desc(sessionReplays.createdAt));
  }

  async getSessionReplay(id: string): Promise<SessionReplay | undefined> {
    const [replay] = await db.select().from(sessionReplays).where(eq(sessionReplays.id, id));
    return replay;
  }

  async createSessionReplay(insertReplay: InsertSessionReplay): Promise<SessionReplay> {
    const id = randomUUID();
    const [replay] = await db
      .insert(sessionReplays)
      .values({ ...insertReplay, id })
      .returning();
    return replay;
  }

  async updateSessionReplay(id: string, updates: Partial<InsertSessionReplay>): Promise<SessionReplay | undefined> {
    const [replay] = await db
      .update(sessionReplays)
      .set(updates)
      .where(eq(sessionReplays.id, id))
      .returning();
    return replay;
  }

  // Work Orders
  async getWorkOrders(projectId?: string): Promise<WorkOrder[]> {
    if (projectId) {
      return await db
        .select()
        .from(workOrders)
        .where(eq(workOrders.projectId, projectId))
        .orderBy(desc(workOrders.createdAt));
    }
    return await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const [order] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    return order;
  }

  async createWorkOrder(insertOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = randomUUID();
    const [order] = await db
      .insert(workOrders)
      .values({ ...insertOrder, id })
      .returning();
    return order;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const [order] = await db
      .update(workOrders)
      .set(updates)
      .where(eq(workOrders.id, id))
      .returning();
    return order;
  }

  // Privacy Ledger
  async getPrivacyLedger(sessionId?: string): Promise<PrivacyLedger[]> {
    if (sessionId) {
      return await db
        .select()
        .from(privacyLedger)
        .where(eq(privacyLedger.sessionId, sessionId))
        .orderBy(desc(privacyLedger.timestamp));
    }
    return await db.select().from(privacyLedger).orderBy(desc(privacyLedger.timestamp));
  }

  async createPrivacyLog(insertLog: InsertPrivacyLedger): Promise<PrivacyLedger> {
    const id = randomUUID();
    const [log] = await db
      .insert(privacyLedger)
      .values({ ...insertLog, id })
      .returning();
    return log;
  }

  // ADR Records
  async getAdrRecords(projectId?: string): Promise<AdrRecord[]> {
    if (projectId) {
      return await db
        .select()
        .from(adrRecords)
        .where(eq(adrRecords.projectId, projectId))
        .orderBy(desc(adrRecords.createdAt));
    }
    return await db.select().from(adrRecords).orderBy(desc(adrRecords.createdAt));
  }

  async getAdrRecord(id: string): Promise<AdrRecord | undefined> {
    const [record] = await db.select().from(adrRecords).where(eq(adrRecords.id, id));
    return record;
  }

  async createAdrRecord(insertRecord: InsertAdrRecord): Promise<AdrRecord> {
    const id = randomUUID();
    const [record] = await db
      .insert(adrRecords)
      .values({ ...insertRecord, id })
      .returning();
    return record;
  }

  async updateAdrRecord(id: string, updates: Partial<InsertAdrRecord>): Promise<AdrRecord | undefined> {
    const [record] = await db
      .update(adrRecords)
      .set(updates)
      .where(eq(adrRecords.id, id))
      .returning();
    return record;
  }

  // Bookmarks
  async getBookmarks(): Promise<Bookmark[]> {
    return await db.select().from(bookmarks).orderBy(bookmarks.position);
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks).where(eq(bookmarks.id, id));
    return bookmark;
  }

  async getBookmarkByUrl(url: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db.select().from(bookmarks).where(eq(bookmarks.url, url));
    return bookmark;
  }

  async getBookmarkFolders(): Promise<string[]> {
    const result = await db
      .select({ folder: bookmarks.folder })
      .from(bookmarks)
      .where(sql`${bookmarks.folder} IS NOT NULL`)
      .groupBy(bookmarks.folder);
    return result.map(r => r.folder).filter(Boolean) as string[];
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    // Get max position for proper ordering
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${bookmarks.position}), 0)` })
      .from(bookmarks);
    const position = (maxPos?.max ?? 0) + 1;
    
    const [bookmark] = await db
      .insert(bookmarks)
      .values({ ...insertBookmark, id, position })
      .returning();
    return bookmark;
  }

  async updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .update(bookmarks)
      .set(updates)
      .where(eq(bookmarks.id, id))
      .returning();
    return bookmark;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    const result = await db.delete(bookmarks).where(eq(bookmarks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderBookmarks(bookmarkIds: string[], startPosition: number): Promise<void> {
    // Update positions for the specified bookmarks
    for (let i = 0; i < bookmarkIds.length; i++) {
      await db
        .update(bookmarks)
        .set({ position: startPosition + i })
        .where(eq(bookmarks.id, bookmarkIds[i]));
    }
  }

  // Browser History
  async getBrowserHistory(limit: number = 100, offset: number = 0, searchQuery?: string): Promise<BrowserHistory[]> {
    let query = db.select().from(browserHistory);
    
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.where(
        or(
          sql`${browserHistory.title} ILIKE ${searchPattern}`,
          sql`${browserHistory.url} ILIKE ${searchPattern}`
        )
      );
    }
    
    return await query
      .orderBy(desc(browserHistory.lastVisited))
      .limit(limit)
      .offset(offset);
  }

  async addToHistory(insertHistory: InsertBrowserHistory): Promise<BrowserHistory> {
    // Check if URL already exists
    const [existing] = await db
      .select()
      .from(browserHistory)
      .where(eq(browserHistory.url, insertHistory.url))
      .limit(1);
    
    if (existing) {
      // Update visit count and last visited time
      const [updated] = await db
        .update(browserHistory)
        .set({
          visitCount: sql`${browserHistory.visitCount} + 1`,
          lastVisited: new Date(),
          title: insertHistory.title, // Update title in case it changed
          favicon: insertHistory.favicon // Update favicon in case it changed
        })
        .where(eq(browserHistory.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new history entry
      const id = randomUUID();
      const [history] = await db
        .insert(browserHistory)
        .values({ ...insertHistory, id, visitCount: 1 })
        .returning();
      return history;
    }
  }
  
  async deleteHistoryItem(id: string): Promise<boolean> {
    const result = await db.delete(browserHistory).where(eq(browserHistory.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearHistory(): Promise<void> {
    await db.delete(browserHistory);
  }
  
  async getHistoryCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(browserHistory);
    return result?.count || 0;
  }

  // Downloads
  async getDownloads(): Promise<Download[]> {
    return await db.select().from(downloads).orderBy(desc(downloads.startedAt));
  }

  async getDownload(id: string): Promise<Download | undefined> {
    const [download] = await db.select().from(downloads).where(eq(downloads.id, id));
    return download;
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const [download] = await db
      .insert(downloads)
      .values({ ...insertDownload, id })
      .returning();
    return download;
  }

  async updateDownload(id: string, updates: Partial<InsertDownload>): Promise<Download | undefined> {
    const [download] = await db
      .update(downloads)
      .set(updates)
      .where(eq(downloads.id, id))
      .returning();
    return download;
  }

  async deleteDownload(id: string): Promise<boolean> {
    const result = await db.delete(downloads).where(eq(downloads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Saved Passwords
  async getSavedPasswords(): Promise<SavedPassword[]> {
    return await db.select().from(savedPasswords).orderBy(savedPasswords.domain);
  }

  async getSavedPasswordForDomain(domain: string): Promise<SavedPassword[]> {
    return await db
      .select()
      .from(savedPasswords)
      .where(eq(savedPasswords.domain, domain));
  }

  async savePassword(insertPassword: InsertSavedPassword): Promise<SavedPassword> {
    const id = randomUUID();
    const [password] = await db
      .insert(savedPasswords)
      .values({ ...insertPassword, id })
      .returning();
    return password;
  }

  async updatePassword(id: string, updates: Partial<InsertSavedPassword>): Promise<SavedPassword | undefined> {
    const [password] = await db
      .update(savedPasswords)
      .set(updates)
      .where(eq(savedPasswords.id, id))
      .returning();
    return password;
  }

  async deletePassword(id: string): Promise<boolean> {
    const result = await db.delete(savedPasswords).where(eq(savedPasswords.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Workflow AI Chats
  async getWorkflowAIChats(workflowId?: string): Promise<WorkflowAIChat[]> {
    if (workflowId) {
      return await db
        .select()
        .from(workflowAIChats)
        .where(eq(workflowAIChats.workflowId, workflowId))
        .orderBy(desc(workflowAIChats.createdAt));
    }
    return await db.select().from(workflowAIChats).orderBy(desc(workflowAIChats.createdAt));
  }

  async getWorkflowAIChatsBySession(sessionId: string): Promise<WorkflowAIChat[]> {
    return await db
      .select()
      .from(workflowAIChats)
      .where(eq(workflowAIChats.sessionId, sessionId))
      .orderBy(workflowAIChats.createdAt);
  }

  async createWorkflowAIChat(insertChat: InsertWorkflowAIChat): Promise<WorkflowAIChat> {
    const id = randomUUID();
    const [chat] = await db
      .insert(workflowAIChats)
      .values({ ...insertChat, id })
      .returning();
    return chat;
  }

  // Workflow Voice Sessions
  async getWorkflowVoiceSessions(): Promise<WorkflowVoiceSession[]> {
    return await db.select().from(workflowVoiceSessions).orderBy(desc(workflowVoiceSessions.createdAt));
  }

  async getWorkflowVoiceSession(sessionId: string): Promise<WorkflowVoiceSession | undefined> {
    const [session] = await db
      .select()
      .from(workflowVoiceSessions)
      .where(eq(workflowVoiceSessions.sessionId, sessionId));
    return session;
  }

  async createWorkflowVoiceSession(insertSession: InsertWorkflowVoiceSession): Promise<WorkflowVoiceSession> {
    const [session] = await db
      .insert(workflowVoiceSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updateWorkflowVoiceSession(id: string, updates: Partial<InsertWorkflowVoiceSession>): Promise<WorkflowVoiceSession | undefined> {
    const [session] = await db
      .update(workflowVoiceSessions)
      .set(updates)
      .where(eq(workflowVoiceSessions.sessionId, id))
      .returning();
    return session;
  }

  // Workflow Step Configs
  async getWorkflowStepConfigs(workflowId: string): Promise<WorkflowStepConfig[]> {
    return await db
      .select()
      .from(workflowStepConfigs)
      .where(eq(workflowStepConfigs.workflowId, workflowId))
      .orderBy(workflowStepConfigs.stepIndex);
  }

  async createWorkflowStepConfig(insertConfig: InsertWorkflowStepConfig): Promise<WorkflowStepConfig> {
    const id = randomUUID();
    const [config] = await db
      .insert(workflowStepConfigs)
      .values({ ...insertConfig, id })
      .returning();
    return config;
  }

  async updateWorkflowStepConfig(id: string, updates: Partial<InsertWorkflowStepConfig>): Promise<WorkflowStepConfig | undefined> {
    const [config] = await db
      .update(workflowStepConfigs)
      .set(updates)
      .where(eq(workflowStepConfigs.id, id))
      .returning();
    return config;
  }

  async deleteWorkflowStepConfig(id: string): Promise<boolean> {
    const result = await db.delete(workflowStepConfigs).where(eq(workflowStepConfigs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Workflow Templates
  async getWorkflowTemplates(): Promise<Workflow[]> {
    return await db
      .select()
      .from(workflows)
      .where(eq(workflows.isTemplate, true))
      .orderBy(desc(workflows.createdAt));
  }

  async createWorkflowFromTemplate(templateId: string): Promise<Workflow> {
    const [template] = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, templateId), eq(workflows.isTemplate, true)));
    
    if (!template) {
      throw new Error('Template not found');
    }

    const id = randomUUID();
    const [workflow] = await db
      .insert(workflows)
      .values({
        ...template,
        id,
        name: `${template.name} (Copy)`,
        isTemplate: false,
        createdAt: new Date(),
        lastUsed: null
      })
      .returning();
    
    return workflow;
  }
}

// MemStorage implementation for fallback
class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private automationTasks: Map<string, AutomationTask> = new Map();
  private activityLogs: Map<string, ActivityLog> = new Map();
  private extractedLeads: Map<string, ExtractedLead> = new Map();
  private sessionReplays: Map<string, SessionReplay> = new Map();
  private workOrders: Map<string, WorkOrder> = new Map();
  private privacyLedger: Map<string, PrivacyLedger> = new Map();
  private adrRecords: Map<string, AdrRecord> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();
  private browserHistory: Map<string, BrowserHistory> = new Map();
  private downloads: Map<string, Download> = new Map();
  private savedPasswords: Map<string, SavedPassword> = new Map();
  private workflowAIChats: Map<string, WorkflowAIChat> = new Map();
  private workflowVoiceSessions: Map<string, WorkflowVoiceSession> = new Map();
  private workflowStepConfigs: Map<string, WorkflowStepConfig> = new Map();
  
  // Marketplace Maps
  private marketplaceItems: Map<string, MarketplaceItem> = new Map();
  private marketplaceVersions: Map<string, MarketplaceVersion> = new Map();
  private marketplaceAuthors: Map<string, MarketplaceAuthor> = new Map();
  private marketplaceInstallations: Map<string, MarketplaceInstallation> = new Map();
  private marketplaceReviews: Map<string, MarketplaceReview> = new Map();
  private marketplaceLicenses: Map<string, MarketplaceLicense> = new Map();
  private marketplacePermissions: Map<string, MarketplacePermission> = new Map();
  private marketplaceDependencies: Map<string, MarketplaceDependency> = new Map();
  private marketplaceDownloads: Map<string, MarketplaceDownload> = new Map();
  private marketplaceTransactions: Map<string, MarketplaceTransaction> = new Map();
  private marketplaceExecutionLogs: Map<string, MarketplaceExecutionLog> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample bookmark
    const bookmark: Bookmark = {
      id: "bookmark-1",
      title: "Google",
      url: "https://www.google.com",
      favicon: "https://www.google.com/favicon.ico",
      folder: null,
      position: 0,
      createdAt: new Date(),
    };
    this.bookmarks.set(bookmark.id, bookmark);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      autonomyLevel: insertProject.autonomyLevel || 1,
      status: insertProject.status || 'active',
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  // Workflows
  async getWorkflows(projectId?: string): Promise<Workflow[]> {
    const workflows = Array.from(this.workflows.values());
    return projectId ? workflows.filter(w => w.projectId === projectId) : workflows;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = { 
      id,
      projectId: insertWorkflow.projectId || null,
      name: insertWorkflow.name,
      description: insertWorkflow.description || null,
      type: insertWorkflow.type || "data-extraction",
      status: insertWorkflow.status || "draft",
      steps: insertWorkflow.steps,
      config: insertWorkflow.config || {},
      metrics: insertWorkflow.metrics || {},
      tags: insertWorkflow.tags || null,
      isTemplate: insertWorkflow.isTemplate || false,
      aiGenerated: insertWorkflow.aiGenerated || false,
      lastUsed: null,
      createdAt: new Date() 
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { ...workflow, ...updates };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  // Implement all other methods similarly...
  async getAutomationTasks(projectId?: string): Promise<AutomationTask[]> {
    const tasks = Array.from(this.automationTasks.values());
    return projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
  }

  async getAutomationTask(id: string): Promise<AutomationTask | undefined> {
    return this.automationTasks.get(id);
  }

  async createAutomationTask(insertTask: InsertAutomationTask): Promise<AutomationTask> {
    const id = randomUUID();
    const task: AutomationTask = { 
      id,
      projectId: insertTask.projectId || null,
      workflowId: insertTask.workflowId || null,
      name: insertTask.name,
      goal: insertTask.goal,
      status: insertTask.status || 'pending',
      currentStep: insertTask.currentStep || null,
      plan: insertTask.plan || null,
      extractedData: insertTask.extractedData || [],
      permissions: insertTask.permissions || [],
      progress: insertTask.progress || null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date() 
    };
    this.automationTasks.set(id, task);
    return task;
  }

  async updateAutomationTask(id: string, updates: Partial<InsertAutomationTask>): Promise<AutomationTask | undefined> {
    const task = this.automationTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updates };
    this.automationTasks.set(id, updatedTask);
    return updatedTask;
  }

  // Activity Logs
  async getActivityLogs(taskId?: string): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values());
    return taskId ? logs.filter(l => l.taskId === taskId) : logs;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = { 
      id,
      taskId: insertLog.taskId || null,
      type: insertLog.type,
      action: insertLog.action,
      details: insertLog.details || null,
      screenshot: insertLog.screenshot || null,
      status: insertLog.status,
      timestamp: new Date() 
    };
    this.activityLogs.set(id, log);
    return log;
  }

  // Extracted Leads
  async getExtractedLeads(taskId?: string): Promise<ExtractedLead[]> {
    const leads = Array.from(this.extractedLeads.values());
    return taskId ? leads.filter(l => l.taskId === taskId) : leads;
  }

  async createExtractedLead(insertLead: InsertExtractedLead): Promise<ExtractedLead> {
    const id = randomUUID();
    const lead: ExtractedLead = { 
      id,
      taskId: insertLead.taskId || null,
      company: insertLead.company || null,
      website: insertLead.website || null,
      email: insertLead.email || null,
      phone: insertLead.phone || null,
      address: insertLead.address || null,
      country: insertLead.country || null,
      category: insertLead.category || null,
      score: insertLead.score || null,
      validated: insertLead.validated || null,
      source: insertLead.source || null,
      extractedAt: new Date() 
    };
    this.extractedLeads.set(id, lead);
    return lead;
  }

  async bulkCreateExtractedLeads(insertLeads: InsertExtractedLead[]): Promise<ExtractedLead[]> {
    return Promise.all(insertLeads.map(lead => this.createExtractedLead(lead)));
  }

  // Implement remaining methods...
  async getSessionReplays(projectId?: string): Promise<SessionReplay[]> {
    const replays = Array.from(this.sessionReplays.values());
    return projectId ? replays.filter(r => r.projectId === projectId) : replays;
  }

  async getSessionReplay(id: string): Promise<SessionReplay | undefined> {
    return this.sessionReplays.get(id);
  }

  async createSessionReplay(insertReplay: InsertSessionReplay): Promise<SessionReplay> {
    const id = randomUUID();
    const replay: SessionReplay = { 
      id,
      projectId: insertReplay.projectId || null,
      name: insertReplay.name,
      description: insertReplay.description || null,
      startUrl: insertReplay.startUrl,
      endUrl: insertReplay.endUrl || null,
      duration: insertReplay.duration || null,
      status: insertReplay.status || 'recording',
      recordingData: insertReplay.recordingData || null,
      metadata: insertReplay.metadata || null,
      createdAt: new Date(),
      completedAt: null
    };
    this.sessionReplays.set(id, replay);
    return replay;
  }

  async updateSessionReplay(id: string, updates: Partial<InsertSessionReplay>): Promise<SessionReplay | undefined> {
    const replay = this.sessionReplays.get(id);
    if (!replay) return undefined;
    const updatedReplay = { ...replay, ...updates };
    this.sessionReplays.set(id, updatedReplay);
    return updatedReplay;
  }

  async getWorkOrders(projectId?: string): Promise<WorkOrder[]> {
    const orders = Array.from(this.workOrders.values());
    return projectId ? orders.filter(o => o.projectId === projectId) : orders;
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    return this.workOrders.get(id);
  }

  async createWorkOrder(insertOrder: InsertWorkOrder): Promise<WorkOrder> {
    const id = randomUUID();
    const order: WorkOrder = { 
      id,
      projectId: insertOrder.projectId || null,
      title: insertOrder.title,
      description: insertOrder.description || null,
      type: insertOrder.type,
      priority: insertOrder.priority || 'normal',
      status: insertOrder.status || 'pending',
      assignee: insertOrder.assignee || null,
      requirements: insertOrder.requirements || null,
      deliverables: insertOrder.deliverables || null,
      estimatedHours: insertOrder.estimatedHours || null,
      actualHours: insertOrder.actualHours || null,
      deadline: insertOrder.deadline || null,
      createdAt: new Date(),
      completedAt: null
    };
    this.workOrders.set(id, order);
    return order;
  }

  async updateWorkOrder(id: string, updates: Partial<InsertWorkOrder>): Promise<WorkOrder | undefined> {
    const order = this.workOrders.get(id);
    if (!order) return undefined;
    const updatedOrder = { ...order, ...updates };
    this.workOrders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getPrivacyLedger(sessionId?: string): Promise<PrivacyLedger[]> {
    const logs = Array.from(this.privacyLedger.values());
    return sessionId ? logs.filter(l => l.sessionId === sessionId) : logs;
  }

  async createPrivacyLog(insertLog: InsertPrivacyLedger): Promise<PrivacyLedger> {
    const id = randomUUID();
    const log: PrivacyLedger = { 
      id,
      sessionId: insertLog.sessionId,
      eventType: insertLog.eventType,
      domain: insertLog.domain,
      dataType: insertLog.dataType || null,
      dataValue: insertLog.dataValue || null,
      purpose: insertLog.purpose || null,
      consentStatus: insertLog.consentStatus || null,
      metadata: insertLog.metadata || null,
      timestamp: new Date() 
    };
    this.privacyLedger.set(id, log);
    return log;
  }

  async getAdrRecords(projectId?: string): Promise<AdrRecord[]> {
    const records = Array.from(this.adrRecords.values());
    return projectId ? records.filter(r => r.projectId === projectId) : records;
  }

  async getAdrRecord(id: string): Promise<AdrRecord | undefined> {
    return this.adrRecords.get(id);
  }

  async createAdrRecord(insertRecord: InsertAdrRecord): Promise<AdrRecord> {
    const id = randomUUID();
    const record: AdrRecord = { 
      id,
      projectId: insertRecord.projectId || null,
      title: insertRecord.title,
      status: insertRecord.status || 'proposed',
      decisionDate: insertRecord.decisionDate || null,
      context: insertRecord.context,
      decision: insertRecord.decision,
      consequences: insertRecord.consequences || null,
      alternatives: insertRecord.alternatives || null,
      relatedRecords: insertRecord.relatedRecords || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.adrRecords.set(id, record);
    return record;
  }

  async updateAdrRecord(id: string, updates: Partial<InsertAdrRecord>): Promise<AdrRecord | undefined> {
    const record = this.adrRecords.get(id);
    if (!record) return undefined;
    const updatedRecord = { ...record, ...updates, updatedAt: new Date() };
    this.adrRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async getBookmarks(): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).sort((a, b) => a.position - b.position);
  }

  async getBookmark(id: string): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }

  async getBookmarkByUrl(url: string): Promise<Bookmark | undefined> {
    return Array.from(this.bookmarks.values()).find(b => b.url === url);
  }

  async getBookmarkFolders(): Promise<string[]> {
    const folders = new Set<string>();
    for (const bookmark of this.bookmarks.values()) {
      if (bookmark.folder) folders.add(bookmark.folder);
    }
    return Array.from(folders);
  }

  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    // Get max position for proper ordering
    const positions = Array.from(this.bookmarks.values()).map(b => b.position);
    const maxPosition = positions.length > 0 ? Math.max(...positions) : 0;
    
    const bookmark: Bookmark = { 
      id,
      title: insertBookmark.title,
      url: insertBookmark.url,
      favicon: insertBookmark.favicon || null,
      folder: insertBookmark.folder || null,
      position: maxPosition + 1,
      createdAt: new Date() 
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async updateBookmark(id: string, updates: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return undefined;
    const updatedBookmark = { ...bookmark, ...updates };
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }

  async deleteBookmark(id: string): Promise<boolean> {
    return this.bookmarks.delete(id);
  }

  async reorderBookmarks(bookmarkIds: string[], startPosition: number): Promise<void> {
    for (let i = 0; i < bookmarkIds.length; i++) {
      const bookmark = this.bookmarks.get(bookmarkIds[i]);
      if (bookmark) {
        bookmark.position = startPosition + i;
        this.bookmarks.set(bookmarkIds[i], bookmark);
      }
    }
  }

  async getBrowserHistory(limit: number = 100, offset: number = 0, searchQuery?: string): Promise<BrowserHistory[]> {
    let history = Array.from(this.browserHistory.values());
    
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      history = history.filter(h => 
        h.title.toLowerCase().includes(search) || 
        h.url.toLowerCase().includes(search)
      );
    }
    
    return history
      .sort((a, b) => b.lastVisited.getTime() - a.lastVisited.getTime())
      .slice(offset, offset + limit);
  }

  async addToHistory(insertHistory: InsertBrowserHistory): Promise<BrowserHistory> {
    // Check if URL already exists
    const existing = Array.from(this.browserHistory.values()).find(h => h.url === insertHistory.url);
    
    if (existing) {
      // Update existing history entry
      existing.visitCount++;
      existing.lastVisited = new Date();
      existing.title = insertHistory.title;
      if (insertHistory.favicon) existing.favicon = insertHistory.favicon;
      return existing;
    } else {
      // Create new history entry
      const id = randomUUID();
      const history: BrowserHistory = { 
        id,
        title: insertHistory.title,
        url: insertHistory.url,
        favicon: insertHistory.favicon || null,
        visitCount: 1,
        lastVisited: new Date() 
      };
      this.browserHistory.set(id, history);
      return history;
    }
  }

  async deleteHistoryItem(id: string): Promise<boolean> {
    return this.browserHistory.delete(id);
  }
  
  async clearHistory(): Promise<void> {
    this.browserHistory.clear();
  }
  
  async getHistoryCount(): Promise<number> {
    return this.browserHistory.size;
  }

  async getDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values())
      .sort((a, b) => {
        // First sort by status (active downloads first)
        const statusOrder = { 'downloading': 0, 'pending': 1, 'completed': 2, 'failed': 3, 'cancelled': 4 };
        const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 5) - 
                          (statusOrder[b.status as keyof typeof statusOrder] || 5);
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by date (newest first)
        return (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0);
      });
  }

  async getDownload(id: string): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const download: Download = { 
      id,
      filename: insertDownload.filename,
      url: insertDownload.url,
      path: insertDownload.path || null,
      size: insertDownload.size || null,
      mimeType: insertDownload.mimeType || null,
      status: insertDownload.status || 'pending',
      progress: 0,
      error: insertDownload.error || null,
      startedAt: new Date(),
      completedAt: null 
    };
    this.downloads.set(id, download);
    return download;
  }

  async updateDownload(id: string, updates: Partial<InsertDownload>): Promise<Download | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;
    
    // Merge updates properly
    const updatedDownload: Download = { 
      ...download, 
      ...updates,
      // Set completedAt when status becomes completed
      completedAt: updates.status === 'completed' ? new Date() : download.completedAt
    };
    
    this.downloads.set(id, updatedDownload);
    return updatedDownload;
  }

  async deleteDownload(id: string): Promise<boolean> {
    return this.downloads.delete(id);
  }

  async getSavedPasswords(): Promise<SavedPassword[]> {
    return Array.from(this.savedPasswords.values()).sort((a, b) => a.domain.localeCompare(b.domain));
  }

  async getSavedPasswordForDomain(domain: string): Promise<SavedPassword[]> {
    return Array.from(this.savedPasswords.values()).filter(p => p.domain === domain);
  }

  async savePassword(insertPassword: InsertSavedPassword): Promise<SavedPassword> {
    const id = randomUUID();
    const password: SavedPassword = { 
      id,
      domain: insertPassword.domain,
      username: insertPassword.username,
      encryptedPassword: insertPassword.encryptedPassword,
      createdAt: new Date(),
      lastUsed: null
    };
    this.savedPasswords.set(id, password);
    return password;
  }

  async updatePassword(id: string, updates: Partial<InsertSavedPassword>): Promise<SavedPassword | undefined> {
    const password = this.savedPasswords.get(id);
    if (!password) return undefined;
    const updatedPassword = { ...password, ...updates };
    this.savedPasswords.set(id, updatedPassword);
    return updatedPassword;
  }

  async deletePassword(id: string): Promise<boolean> {
    return this.savedPasswords.delete(id);
  }

  async getWorkflowAIChats(workflowId?: string): Promise<WorkflowAIChat[]> {
    const chats = Array.from(this.workflowAIChats.values());
    return workflowId ? chats.filter(c => c.workflowId === workflowId) : chats;
  }

  async getWorkflowAIChatsBySession(sessionId: string): Promise<WorkflowAIChat[]> {
    return Array.from(this.workflowAIChats.values())
      .filter(c => c.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createWorkflowAIChat(insertChat: InsertWorkflowAIChat): Promise<WorkflowAIChat> {
    const id = randomUUID();
    const chat: WorkflowAIChat = { 
      id,
      workflowId: insertChat.workflowId || null,
      sessionId: insertChat.sessionId,
      role: insertChat.role,
      content: insertChat.content,
      metadata: insertChat.metadata || null,
      createdAt: new Date() 
    };
    this.workflowAIChats.set(id, chat);
    return chat;
  }

  async getWorkflowVoiceSessions(): Promise<WorkflowVoiceSession[]> {
    return Array.from(this.workflowVoiceSessions.values());
  }

  async getWorkflowVoiceSession(sessionId: string): Promise<WorkflowVoiceSession | undefined> {
    return this.workflowVoiceSessions.get(sessionId);
  }

  async createWorkflowVoiceSession(insertSession: InsertWorkflowVoiceSession): Promise<WorkflowVoiceSession> {
    const session: WorkflowVoiceSession = { 
      sessionId: insertSession.sessionId,
      workflowId: insertSession.workflowId || null,
      transcript: insertSession.transcript || [],
      context: insertSession.context || null,
      metadata: insertSession.metadata || null,
      createdAt: new Date(),
      endedAt: null
    };
    this.workflowVoiceSessions.set(session.sessionId, session);
    return session;
  }

  async updateWorkflowVoiceSession(id: string, updates: Partial<InsertWorkflowVoiceSession>): Promise<WorkflowVoiceSession | undefined> {
    const session = this.workflowVoiceSessions.get(id);
    if (!session) return undefined;
    const updatedSession = { ...session, ...updates };
    this.workflowVoiceSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getWorkflowStepConfigs(workflowId: string): Promise<WorkflowStepConfig[]> {
    return Array.from(this.workflowStepConfigs.values())
      .filter(c => c.workflowId === workflowId)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }

  async createWorkflowStepConfig(insertConfig: InsertWorkflowStepConfig): Promise<WorkflowStepConfig> {
    const id = randomUUID();
    const config: WorkflowStepConfig = { 
      id,
      workflowId: insertConfig.workflowId,
      stepIndex: insertConfig.stepIndex,
      stepIndex: insertConfig.stepIndex,
      stepType: insertConfig.stepType,
      name: insertConfig.name,
      description: insertConfig.description || null,
      config: insertConfig.config || {},
      validation: insertConfig.validation || null,
      aiPrompt: insertConfig.aiPrompt || null,
      createdAt: new Date() 
    };
    this.workflowStepConfigs.set(id, config);
    return config;
  }

  async updateWorkflowStepConfig(id: string, updates: Partial<InsertWorkflowStepConfig>): Promise<WorkflowStepConfig | undefined> {
    const config = this.workflowStepConfigs.get(id);
    if (!config) return undefined;
    const updatedConfig = { ...config, ...updates };
    this.workflowStepConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteWorkflowStepConfig(id: string): Promise<boolean> {
    return this.workflowStepConfigs.delete(id);
  }

  async getWorkflowTemplates(): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(w => w.isTemplate);
  }

  async createWorkflowFromTemplate(templateId: string): Promise<Workflow> {
    const template = this.workflows.get(templateId);
    if (!template || !template.isTemplate) {
      throw new Error('Template not found');
    }
    
    const id = randomUUID();
    const workflow: Workflow = { 
      ...template,
      id,
      name: `${template.name} (Copy)`,
      isTemplate: false,
      createdAt: new Date(),
      lastUsed: null
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  // Marketplace Methods (stub implementations for MemStorage)
  async getMarketplaceItems(filters?: { type?: string; category?: string; search?: string; featured?: boolean }): Promise<MarketplaceItem[]> {
    const items = Array.from(this.marketplaceItems.values());
    let filtered = items;
    
    if (filters?.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }
    if (filters?.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(item => item.featured === filters.featured);
    }
    
    return filtered.sort((a, b) => b.downloads - a.downloads);
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    return this.marketplaceItems.get(id);
  }

  async createMarketplaceItem(insertItem: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const id = randomUUID();
    const slug = insertItem.slug || insertItem.name.toLowerCase().replace(/\s+/g, '-');
    const item: MarketplaceItem = {
      id,
      slug,
      type: insertItem.type,
      name: insertItem.name,
      authorId: insertItem.authorId,
      description: insertItem.description,
      longDescription: insertItem.longDescription || null,
      icon: insertItem.icon || null,
      banner: insertItem.banner || null,
      screenshots: insertItem.screenshots || [],
      category: insertItem.category,
      tags: insertItem.tags || [],
      status: insertItem.status || 'draft',
      featured: insertItem.featured || false,
      visibility: insertItem.visibility || 'public',
      price: insertItem.price || 0,
      pricingModel: insertItem.pricingModel || 'one-time',
      subscriptionPrice: insertItem.subscriptionPrice || null,
      currency: insertItem.currency || 'USD',
      revenueShare: insertItem.revenueShare || 0.7,
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      installCount: 0,
      sourceUrl: insertItem.sourceUrl || null,
      documentationUrl: insertItem.documentationUrl || null,
      supportUrl: insertItem.supportUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      lastReviewedAt: null
    };
    this.marketplaceItems.set(id, item);
    return item;
  }

  async updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const item = this.marketplaceItems.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...updates, updatedAt: new Date() };
    this.marketplaceItems.set(id, updated);
    return updated;
  }

  async deleteMarketplaceItem(id: string): Promise<boolean> {
    return this.marketplaceItems.delete(id);
  }

  async getMarketplaceAuthor(id: string): Promise<MarketplaceAuthor | undefined> {
    return this.marketplaceAuthors.get(id);
  }

  async getMarketplaceAuthorByUserId(userId: string): Promise<MarketplaceAuthor | undefined> {
    return Array.from(this.marketplaceAuthors.values()).find(a => a.userId === userId);
  }

  async createMarketplaceAuthor(insertAuthor: InsertMarketplaceAuthor): Promise<MarketplaceAuthor> {
    const id = randomUUID();
    const author: MarketplaceAuthor = {
      id,
      userId: insertAuthor.userId || null,
      username: insertAuthor.username,
      displayName: insertAuthor.displayName,
      bio: insertAuthor.bio || null,
      avatar: insertAuthor.avatar || null,
      website: insertAuthor.website || null,
      github: insertAuthor.github || null,
      twitter: insertAuthor.twitter || null,
      verified: insertAuthor.verified || false,
      verificationDate: null,
      totalDownloads: 0,
      totalRevenue: 0,
      averageRating: 0,
      itemsPublished: 0,
      stripeAccountId: insertAuthor.stripeAccountId || null,
      payoutSettings: insertAuthor.payoutSettings || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.marketplaceAuthors.set(id, author);
    return author;
  }

  async updateMarketplaceAuthor(id: string, updates: Partial<InsertMarketplaceAuthor>): Promise<MarketplaceAuthor | undefined> {
    const author = this.marketplaceAuthors.get(id);
    if (!author) return undefined;
    const updated = { ...author, ...updates, updatedAt: new Date() };
    this.marketplaceAuthors.set(id, updated);
    return updated;
  }

  async getMarketplaceInstallations(userId: string): Promise<MarketplaceInstallation[]> {
    return Array.from(this.marketplaceInstallations.values())
      .filter(i => i.userId === userId)
      .sort((a, b) => b.installedAt.getTime() - a.installedAt.getTime());
  }

  async getMarketplaceInstallation(itemId: string, userId: string): Promise<MarketplaceInstallation | undefined> {
    return Array.from(this.marketplaceInstallations.values())
      .find(i => i.itemId === itemId && i.userId === userId);
  }

  async createMarketplaceInstallation(insertInstallation: InsertMarketplaceInstallation): Promise<MarketplaceInstallation> {
    const id = randomUUID();
    const installation: MarketplaceInstallation = {
      id,
      itemId: insertInstallation.itemId,
      versionId: insertInstallation.versionId,
      userId: insertInstallation.userId,
      status: insertInstallation.status || 'active',
      autoUpdate: insertInstallation.autoUpdate ?? true,
      settings: insertInstallation.settings || {},
      permissions: insertInstallation.permissions || [],
      usageStats: insertInstallation.usageStats || {},
      lastUsed: null,
      installedAt: new Date(),
      uninstalledAt: null
    };
    this.marketplaceInstallations.set(id, installation);
    
    // Update install count on item
    const item = this.marketplaceItems.get(insertInstallation.itemId);
    if (item) {
      item.installCount++;
      this.marketplaceItems.set(item.id, item);
    }
    
    return installation;
  }

  async updateMarketplaceInstallation(id: string, updates: Partial<InsertMarketplaceInstallation>): Promise<MarketplaceInstallation | undefined> {
    const installation = this.marketplaceInstallations.get(id);
    if (!installation) return undefined;
    const updated = { ...installation, ...updates };
    this.marketplaceInstallations.set(id, updated);
    return updated;
  }

  async getMarketplaceReviews(itemId: string): Promise<MarketplaceReview[]> {
    return Array.from(this.marketplaceReviews.values())
      .filter(r => r.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMarketplaceReview(insertReview: InsertMarketplaceReview): Promise<MarketplaceReview> {
    const id = randomUUID();
    const review: MarketplaceReview = {
      id,
      itemId: insertReview.itemId,
      userId: insertReview.userId,
      versionId: insertReview.versionId || null,
      rating: insertReview.rating,
      title: insertReview.title || null,
      review: insertReview.review || null,
      helpful: 0,
      unhelpful: 0,
      developerResponse: null,
      developerResponseAt: null,
      verified: insertReview.verified || false,
      flagged: false,
      flagReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.marketplaceReviews.set(id, review);
    
    // Update item rating
    const reviews = await this.getMarketplaceReviews(insertReview.itemId);
    const item = this.marketplaceItems.get(insertReview.itemId);
    if (item) {
      item.rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      item.reviewCount = reviews.length;
      this.marketplaceItems.set(item.id, item);
    }
    
    return review;
  }

  async getMarketplaceVersion(id: string): Promise<MarketplaceVersion | undefined> {
    return this.marketplaceVersions.get(id);
  }

  async getMarketplaceVersions(itemId: string): Promise<MarketplaceVersion[]> {
    return Array.from(this.marketplaceVersions.values())
      .filter(v => v.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createMarketplaceVersion(insertVersion: InsertMarketplaceVersion): Promise<MarketplaceVersion> {
    const id = randomUUID();
    const version: MarketplaceVersion = {
      id,
      itemId: insertVersion.itemId,
      version: insertVersion.version,
      changelog: insertVersion.changelog || null,
      packageUrl: insertVersion.packageUrl || null,
      packageHash: insertVersion.packageHash || null,
      packageSize: insertVersion.packageSize || null,
      minEngineVersion: insertVersion.minEngineVersion || null,
      maxEngineVersion: insertVersion.maxEngineVersion || null,
      releaseNotes: insertVersion.releaseNotes || null,
      breakingChanges: insertVersion.breakingChanges || false,
      securityScanStatus: insertVersion.securityScanStatus || 'pending',
      securityScanReport: insertVersion.securityScanReport || null,
      autoUpdate: insertVersion.autoUpdate ?? true,
      deprecated: insertVersion.deprecated || false,
      deprecationReason: insertVersion.deprecationReason || null,
      createdAt: new Date()
    };
    this.marketplaceVersions.set(id, version);
    return version;
  }

  async createMarketplaceLicense(insertLicense: InsertMarketplaceLicense): Promise<MarketplaceLicense> {
    const id = randomUUID();
    const licenseKey = `${insertLicense.type.toUpperCase()}-${randomUUID().substring(0, 8)}-${randomUUID().substring(0, 8)}`;
    const license: MarketplaceLicense = {
      id,
      itemId: insertLicense.itemId,
      userId: insertLicense.userId,
      licenseKey,
      type: insertLicense.type,
      status: insertLicense.status || 'active',
      maxActivations: insertLicense.maxActivations || 1,
      currentActivations: 0,
      features: insertLicense.features || {},
      restrictions: insertLicense.restrictions || {},
      validFrom: new Date(),
      validUntil: insertLicense.validUntil || null,
      createdAt: new Date()
    };
    this.marketplaceLicenses.set(id, license);
    return license;
  }

  async getMarketplaceLicense(licenseKey: string): Promise<MarketplaceLicense | undefined> {
    return Array.from(this.marketplaceLicenses.values()).find(l => l.licenseKey === licenseKey);
  }

  async trackMarketplaceDownload(insertDownload: InsertMarketplaceDownload): Promise<MarketplaceDownload> {
    const id = randomUUID();
    const download: MarketplaceDownload = {
      id,
      itemId: insertDownload.itemId,
      versionId: insertDownload.versionId || null,
      userId: insertDownload.userId || null,
      ipAddress: insertDownload.ipAddress || null,
      userAgent: insertDownload.userAgent || null,
      country: insertDownload.country || null,
      referrer: insertDownload.referrer || null,
      downloadedAt: new Date()
    };
    this.marketplaceDownloads.set(id, download);
    
    // Update download count on item
    const item = this.marketplaceItems.get(insertDownload.itemId);
    if (item) {
      item.downloads++;
      this.marketplaceItems.set(item.id, item);
    }
    
    return download;
  }

  async recordMarketplaceExecution(insertLog: InsertMarketplaceExecutionLog): Promise<MarketplaceExecutionLog> {
    const id = randomUUID();
    const log: MarketplaceExecutionLog = {
      id,
      itemId: insertLog.itemId,
      installationId: insertLog.installationId || null,
      userId: insertLog.userId,
      executionId: insertLog.executionId,
      sandboxId: insertLog.sandboxId || null,
      status: insertLog.status,
      startTime: new Date(),
      endTime: insertLog.endTime || null,
      duration: insertLog.duration || null,
      input: insertLog.input || null,
      output: insertLog.output || null,
      error: insertLog.error || null,
      resourceUsage: insertLog.resourceUsage || null,
      permissionsUsed: insertLog.permissionsUsed || [],
      apiCalls: insertLog.apiCalls || [],
      violations: insertLog.violations || [],
      createdAt: new Date()
    };
    this.marketplaceExecutionLogs.set(id, log);
    return log;
  }
}

// Use DatabaseStorage if database is available, otherwise fallback to MemStorage
const isDatabaseAvailable = !!process.env.DATABASE_URL;
export const storage: IStorage = isDatabaseAvailable ? new DatabaseStorage() : new MemStorage();