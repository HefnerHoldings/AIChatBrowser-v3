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
  type InsertProject, 
  type InsertWorkflow, 
  type InsertAutomationTask, 
  type InsertActivityLog, 
  type InsertExtractedLead,
  type InsertSessionReplay,
  type InsertWorkOrder,
  type InsertPrivacyLedger,
  type InsertAdrRecord
} from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private automationTasks: Map<string, AutomationTask> = new Map();
  private activityLogs: Map<string, ActivityLog> = new Map();
  private extractedLeads: Map<string, ExtractedLead> = new Map();
  private sessionReplays: Map<string, SessionReplay> = new Map();
  private workOrders: Map<string, WorkOrder> = new Map();
  private privacyLedger: Map<string, PrivacyLedger> = new Map();
  private adrRecords: Map<string, AdrRecord> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create sample project
    const project: Project = {
      id: "project-1",
      name: "EU Lead Generation Project",
      description: "Finding cookware wholesalers across European markets",
      autonomyLevel: 2,
      status: "active",
      createdAt: new Date(),
    };
    this.projects.set(project.id, project);

    // Create sample workflows
    const workflow1: Workflow = {
      id: "workflow-1",
      projectId: project.id,
      name: "EU Lead Generation",
      description: "Search and extract contact details from European cookware wholesalers",
      steps: [
        { type: "search", query: "cookware wholesaler EU", pages: 5 },
        { type: "extract", fields: ["company", "email", "phone", "website"] },
        { type: "validate", rules: ["email_format", "phone_region"] },
        { type: "export", format: "xlsx" }
      ],
      tags: ["Scraping", "Lead Generation"],
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };

    const workflow2: Workflow = {
      id: "workflow-2",
      projectId: project.id,
      name: "Competitor Analysis",
      description: "Analyze competitor websites and pricing",
      steps: [
        { type: "navigate", urls: ["competitor1.com", "competitor2.com"] },
        { type: "extract", fields: ["pricing", "products", "contact"] },
        { type: "analyze", comparison: true }
      ],
      tags: ["Research", "Analysis"],
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    };

    this.workflows.set(workflow1.id, workflow1);
    this.workflows.set(workflow2.id, workflow2);

    // Create sample automation task
    const task: AutomationTask = {
      id: "task-1",
      projectId: project.id,
      workflowId: workflow1.id,
      name: "Cookware Wholesaler Search",
      goal: "Find 150 relevant cookware wholesalers in EU, collect contact info, and export to XLSX",
      status: "running",
      currentStep: 1,
      plan: {
        steps: [
          { name: "Search Google for wholesalers", estimated: "2m", status: "completed" },
          { name: "Extract contact details", estimated: "5m", status: "running" },
          { name: "Validate email formats", estimated: "3m", status: "pending" },
          { name: "Export to XLSX", estimated: "1m", status: "pending" }
        ],
        permissions: ["Browse", "Extract", "Export"],
        riskLevel: "low"
      },
      extractedData: [],
      permissions: ["Browse", "Extract", "Export"],
      progress: 45,
      startedAt: new Date(Date.now() - 2 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    };
    this.automationTasks.set(task.id, task);

    // Create sample activity logs
    const log1: ActivityLog = {
      id: "log-1",
      taskId: task.id,
      type: "search",
      action: "Search Initiated",
      details: { query: "cookware wholesaler EU", results: 24 },
      status: "success",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    };

    const log2: ActivityLog = {
      id: "log-2",
      taskId: task.id,
      type: "extract",
      action: "Data Extraction",
      details: { 
        processed: 18, 
        total: 24, 
        extracted: { companies: 18, websites: 16, emails: 8, phones: 5 }
      },
      status: "pending",
      timestamp: new Date(Date.now() - 30 * 1000),
    };

    this.activityLogs.set(log1.id, log1);
    this.activityLogs.set(log2.id, log2);

    // Create sample extracted leads
    const leads = [
      {
        id: "lead-1",
        taskId: task.id,
        company: "European Cookware Distributors Ltd",
        website: "www.eu-cookware.com",
        email: "sales@eu-cookware.com",
        phone: "+49 30 12345678",
        country: "Germany",
        category: "Wholesale",
        score: 85,
        validated: true,
        source: "Google Search",
        extractedAt: new Date(Date.now() - 60 * 1000),
      },
      {
        id: "lead-2",
        taskId: task.id,
        company: "Nordic Kitchen Supplies",
        website: "www.nordickitchen.se",
        email: "info@nordickitchen.se",
        phone: "+46 8 98765432",
        country: "Sweden",
        category: "Wholesale",
        score: 78,
        validated: true,
        source: "Google Search",
        extractedAt: new Date(Date.now() - 45 * 1000),
      }
    ];

    leads.forEach(lead => this.extractedLeads.set(lead.id, lead));
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
      ...insertProject, 
      id, 
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
      ...insertWorkflow, 
      id, 
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

  // Automation Tasks
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
      ...insertTask, 
      id, 
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
      ...insertLog, 
      id, 
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
      ...insertLead, 
      id, 
      extractedAt: new Date() 
    };
    this.extractedLeads.set(id, lead);
    return lead;
  }

  async bulkCreateExtractedLeads(insertLeads: InsertExtractedLead[]): Promise<ExtractedLead[]> {
    const leads = insertLeads.map(insertLead => {
      const id = randomUUID();
      const lead: ExtractedLead = { 
        ...insertLead, 
        id, 
        extractedAt: new Date() 
      };
      this.extractedLeads.set(id, lead);
      return lead;
    });
    return leads;
  }

  // Session Replays
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
      ...insertReplay, 
      id, 
      createdAt: new Date() 
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

  // Work Orders
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
      ...insertOrder, 
      id, 
      createdAt: new Date() 
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

  // Privacy Ledger
  async getPrivacyLedger(sessionId?: string): Promise<PrivacyLedger[]> {
    const logs = Array.from(this.privacyLedger.values());
    return sessionId ? logs.filter(l => l.sessionId === sessionId) : logs;
  }

  async createPrivacyLog(insertLog: InsertPrivacyLedger): Promise<PrivacyLedger> {
    const id = randomUUID();
    const log: PrivacyLedger = { 
      ...insertLog, 
      id, 
      timestamp: new Date() 
    };
    this.privacyLedger.set(id, log);
    return log;
  }

  // ADR Records
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
      ...insertRecord, 
      id, 
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
}

export const storage = new MemStorage();
