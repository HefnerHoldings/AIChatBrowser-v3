import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { windowsAPI } from "./windows-api";
import { browserManager } from "./browser-manager";
import { BrowserEngineType, browserEngine } from "./browser-engine";
import { createAgentOrchestrator, TaskPriority, AgentType } from "./ai-agents";
import { createQASuite, TestType, TestStatus } from "./qa-suite";
import { createSelectorStudio, SelectorType, DomainProfile } from "./selector-studio";
import { registerOrganizationRoutes } from "./organizationRoutes";
import { 
  insertProjectSchema, 
  insertWorkflowSchema, 
  insertAutomationTaskSchema, 
  insertActivityLogSchema,
  insertSessionReplaySchema,
  insertWorkOrderSchema,
  insertPrivacyLedgerSchema,
  insertAdrRecordSchema,
  insertBookmarkSchema,
  insertBrowserHistorySchema,
  insertDownloadSchema,
  insertSavedPasswordSchema,
  insertWorkflowAIChatSchema,
  insertWorkflowVoiceSessionSchema,
  insertWorkflowStepConfigSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize AI Agent Orchestrator
  const agentOrchestrator = createAgentOrchestrator(browserManager);
  
  // Initialize QA Suite Pro
  const qaSuite = createQASuite(browserManager);
  
  // Initialize Selector Studio v2
  const selectorStudio = createSelectorStudio(browserManager);
  
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(data);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create project" });
      }
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, updates);
      if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid project data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update project" });
      }
    }
  });

  // Workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const { projectId } = req.query;
      const workflows = await storage.getWorkflows(projectId as string);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        res.status(404).json({ message: "Workflow not found" });
        return;
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(data);
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create workflow" });
      }
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(id, updates);
      if (!workflow) {
        res.status(404).json({ message: "Workflow not found" });
        return;
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update workflow" });
      }
    }
  });

  // Workflow Templates
  app.get("/api/workflows/templates", async (req, res) => {
    try {
      const templates = await storage.getWorkflowTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow templates" });
    }
  });

  app.post("/api/workflows/templates/:templateId/create", async (req, res) => {
    try {
      const { templateId } = req.params;
      const workflow = await storage.createWorkflowFromTemplate(templateId);
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow from template" });
    }
  });

  // Workflow AI Chat
  app.get("/api/workflows/:workflowId/ai-chats", async (req, res) => {
    try {
      const { workflowId } = req.params;
      const chats = await storage.getWorkflowAIChats(workflowId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI chats" });
    }
  });

  app.post("/api/workflows/ai-chat", async (req, res) => {
    try {
      const data = insertWorkflowAIChatSchema.parse(req.body);
      const chat = await storage.createWorkflowAIChat(data);
      res.json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid AI chat data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create AI chat" });
      }
    }
  });

  // Workflow Voice Sessions
  app.get("/api/workflows/voice-sessions", async (req, res) => {
    try {
      const sessions = await storage.getWorkflowVoiceSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch voice sessions" });
    }
  });

  app.post("/api/workflows/voice-session", async (req, res) => {
    try {
      const data = insertWorkflowVoiceSessionSchema.parse(req.body);
      const session = await storage.createWorkflowVoiceSession(data);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid voice session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create voice session" });
      }
    }
  });

  app.patch("/api/workflows/voice-session/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkflowVoiceSessionSchema.partial().parse(req.body);
      const session = await storage.updateWorkflowVoiceSession(id, updates);
      if (!session) {
        res.status(404).json({ message: "Voice session not found" });
        return;
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid voice session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update voice session" });
      }
    }
  });

  // Workflow Step Configs
  app.get("/api/workflows/:workflowId/step-configs", async (req, res) => {
    try {
      const { workflowId } = req.params;
      const configs = await storage.getWorkflowStepConfigs(workflowId);
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch step configurations" });
    }
  });

  app.post("/api/workflows/step-config", async (req, res) => {
    try {
      const data = insertWorkflowStepConfigSchema.parse(req.body);
      const config = await storage.createWorkflowStepConfig(data);
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid step config data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create step configuration" });
      }
    }
  });

  app.patch("/api/workflows/step-config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkflowStepConfigSchema.partial().parse(req.body);
      const config = await storage.updateWorkflowStepConfig(id, updates);
      if (!config) {
        res.status(404).json({ message: "Step configuration not found" });
        return;
      }
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid step config data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update step configuration" });
      }
    }
  });

  // Execute Workflow with Browser Engine
  app.post("/api/workflows/:workflowId/execute", async (req, res) => {
    try {
      const { workflowId } = req.params;
      
      // Get workflow and its steps
      const workflow = await storage.getWorkflow(workflowId);
      if (!workflow) {
        res.status(404).json({ message: "Workflow not found" });
        return;
      }
      
      const steps = await storage.getWorkflowStepConfigs(workflowId);
      if (!steps || steps.length === 0) {
        res.status(400).json({ message: "No steps configured for this workflow" });
        return;
      }
      
      // Initialize browser engine if not already done
      try {
        await browserEngine.initialize();
      } catch (e) {
        // Already initialized or initialization error
        console.log('Browser engine initialization:', e);
      }
      
      // Create a new tab for workflow execution
      const tab = await browserEngine.createTab();
      const tabId = tab.id;
      
      const results: any[] = [];
      let error: string | null = null;
      
      try {
        // Execute each step sequentially
        for (const step of steps.sort((a, b) => a.stepIndex - b.stepIndex)) {
          const stepConfig = typeof step.config === 'string' 
            ? JSON.parse(step.config) 
            : step.config;
          
          switch (step.type) {
            case 'navigate':
              await browserEngine.navigate(tabId, stepConfig.url);
              results.push({ step: step.name, type: 'navigate', url: stepConfig.url });
              break;
              
            case 'click':
              await browserEngine.executeScript(tabId, `
                document.querySelector('${stepConfig.selector}')?.click();
              `);
              results.push({ step: step.name, type: 'click', selector: stepConfig.selector });
              break;
              
            case 'fill':
              await browserEngine.executeScript(tabId, `
                const element = document.querySelector('${stepConfig.selector}');
                if (element) {
                  element.value = '${stepConfig.value}';
                  element.dispatchEvent(new Event('input', { bubbles: true }));
                }
              `);
              results.push({ step: step.name, type: 'fill', selector: stepConfig.selector });
              break;
              
            case 'extract':
              const data = await browserEngine.executeScript(tabId, `
                const elements = document.querySelectorAll('${stepConfig.selector}');
                Array.from(elements).map(el => ({
                  text: el.textContent?.trim(),
                  href: el.href,
                  src: el.src,
                  value: el.value
                }));
              `);
              results.push({ step: step.name, type: 'extract', data });
              break;
              
            case 'wait':
              await new Promise(resolve => setTimeout(resolve, stepConfig.duration || 1000));
              results.push({ step: step.name, type: 'wait', duration: stepConfig.duration });
              break;
              
            default:
              results.push({ step: step.name, type: step.type, status: 'skipped' });
          }
        }
        
        // Update workflow status
        await storage.updateWorkflow(workflowId, { 
          status: 'active'
        });
        
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error occurred';
      } finally {
        // Close the tab
        await browserEngine.closeTab(tabId);
      }
      
      if (error) {
        res.status(500).json({ 
          message: "Workflow execution failed", 
          error,
          partialResults: results 
        });
      } else {
        res.json({ 
          message: "Workflow executed successfully",
          results,
          workflow: workflow.name 
        });
      }
      
    } catch (error) {
      console.error('Workflow execution error:', error);
      res.status(500).json({ 
        message: "Failed to execute workflow",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/workflows/step-config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteWorkflowStepConfig(id);
      if (!deleted) {
        res.status(404).json({ message: "Step configuration not found" });
        return;
      }
      res.json({ message: "Step configuration deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete step configuration" });
    }
  });

  // Automation Tasks
  app.get("/api/automation-tasks", async (req, res) => {
    try {
      const { projectId } = req.query;
      const tasks = await storage.getAutomationTasks(projectId as string);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch automation tasks" });
    }
  });

  app.get("/api/automation-tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getAutomationTask(id);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/automation-tasks", async (req, res) => {
    try {
      const data = insertAutomationTaskSchema.parse(req.body);
      const task = await storage.createAutomationTask(data);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  });

  app.patch("/api/automation-tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertAutomationTaskSchema.partial().parse(req.body);
      const task = await storage.updateAutomationTask(id, updates);
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid task data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  });

  // Activity Logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const { taskId } = req.query;
      const logs = await storage.getActivityLogs(taskId as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/activity-logs", async (req, res) => {
    try {
      const data = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(data);
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create log" });
      }
    }
  });

  // Extracted Leads
  app.get("/api/extracted-leads", async (req, res) => {
    try {
      const { taskId } = req.query;
      const leads = await storage.getExtractedLeads(taskId as string);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch extracted leads" });
    }
  });

  // Export leads to CSV/XLSX
  app.post("/api/export-leads/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const { format = "xlsx" } = req.body;
      
      const leads = await storage.getExtractedLeads(taskId);
      
      if (format === "csv") {
        // Simple CSV export
        const csvHeader = "Company,Website,Email,Phone,Country,Score\n";
        const csvData = leads.map(lead => 
          `"${lead.company || ''}","${lead.website || ''}","${lead.email || ''}","${lead.phone || ''}","${lead.country || ''}",${lead.score || 0}`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads_${taskId}.csv"`);
        res.send(csvHeader + csvData);
      } else {
        // For XLSX, we'd typically use a library like 'xlsx'
        // For now, return JSON data that could be processed by frontend
        res.json({ 
          message: "Export initiated", 
          format, 
          count: leads.length,
          data: leads
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export leads" });
    }
  });

  // Simulate automation execution
  app.post("/api/automation-tasks/:id/execute", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getAutomationTask(id);
      
      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      // Update task to running status
      await storage.updateAutomationTask(id, { 
        status: "running"
      });

      // Create activity log for execution start
      await storage.createActivityLog({
        taskId: id,
        type: "execute",
        action: "Automation Started",
        details: { goal: task.goal },
        status: "success"
      });

      res.json({ message: "Automation execution started", taskId: id });
    } catch (error) {
      res.status(500).json({ message: "Failed to start automation" });
    }
  });

  app.post("/api/automation-tasks/:id/pause", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateAutomationTask(id, { status: "paused" });
      
      await storage.createActivityLog({
        taskId: id,
        type: "control",
        action: "Automation Paused",
        details: { reason: "User request" },
        status: "success"
      });

      res.json({ message: "Automation paused" });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause automation" });
    }
  });

  // Session Replays
  app.get("/api/session-replays", async (req, res) => {
    try {
      const { projectId } = req.query;
      const replays = await storage.getSessionReplays(projectId as string);
      res.json(replays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session replays" });
    }
  });

  app.get("/api/session-replays/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const replay = await storage.getSessionReplay(id);
      if (!replay) {
        res.status(404).json({ message: "Session replay not found" });
        return;
      }
      res.json(replay);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session replay" });
    }
  });

  app.post("/api/session-replays", async (req, res) => {
    try {
      const data = insertSessionReplaySchema.parse(req.body);
      const replay = await storage.createSessionReplay(data);
      res.json(replay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session replay data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session replay" });
      }
    }
  });

  app.patch("/api/session-replays/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertSessionReplaySchema.partial().parse(req.body);
      const replay = await storage.updateSessionReplay(id, updates);
      if (!replay) {
        res.status(404).json({ message: "Session replay not found" });
        return;
      }
      res.json(replay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session replay data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update session replay" });
      }
    }
  });

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const { projectId } = req.query;
      const orders = await storage.getWorkOrders(projectId as string);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getWorkOrder(id);
      if (!order) {
        res.status(404).json({ message: "Work order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      const data = insertWorkOrderSchema.parse(req.body);
      const order = await storage.createWorkOrder(data);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid work order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create work order" });
      }
    }
  });

  app.patch("/api/work-orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertWorkOrderSchema.partial().parse(req.body);
      const order = await storage.updateWorkOrder(id, updates);
      if (!order) {
        res.status(404).json({ message: "Work order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid work order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update work order" });
      }
    }
  });

  // Privacy Ledger
  app.get("/api/privacy-ledger", async (req, res) => {
    try {
      const { sessionId } = req.query;
      const logs = await storage.getPrivacyLedger(sessionId as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch privacy ledger" });
    }
  });

  app.post("/api/privacy-ledger", async (req, res) => {
    try {
      const data = insertPrivacyLedgerSchema.parse(req.body);
      const log = await storage.createPrivacyLog(data);
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid privacy log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create privacy log" });
      }
    }
  });

  // ADR Records
  app.get("/api/adr-records", async (req, res) => {
    try {
      const { projectId } = req.query;
      const records = await storage.getAdrRecords(projectId as string);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ADR records" });
    }
  });

  app.get("/api/adr-records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const record = await storage.getAdrRecord(id);
      if (!record) {
        res.status(404).json({ message: "ADR record not found" });
        return;
      }
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ADR record" });
    }
  });

  app.post("/api/adr-records", async (req, res) => {
    try {
      const data = insertAdrRecordSchema.parse(req.body);
      const record = await storage.createAdrRecord(data);
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ADR record data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ADR record" });
      }
    }
  });

  app.patch("/api/adr-records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertAdrRecordSchema.partial().parse(req.body);
      const record = await storage.updateAdrRecord(id, updates);
      if (!record) {
        res.status(404).json({ message: "ADR record not found" });
        return;
      }
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ADR record data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ADR record" });
      }
    }
  });

  // Puppeteer Automation Endpoints
  let puppeteerBrowser: any = null;
  let activePage: any = null;

  // Initialize Puppeteer browser
  app.post("/api/browser/init", async (req, res) => {
    try {
      const puppeteer = await import('puppeteer');
      puppeteerBrowser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const pages = await puppeteerBrowser.pages();
      activePage = pages[0] || await puppeteerBrowser.newPage();
      res.json({ success: true, message: "Browser initialized" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Navigate to URL
  app.post("/api/browser/navigate", async (req, res) => {
    if (!activePage) {
      res.status(400).json({ error: "Browser not initialized" });
      return;
    }
    
    try {
      const { url } = req.body;
      await activePage.goto(url, { waitUntil: 'networkidle2' });
      const title = await activePage.title();
      const currentUrl = activePage.url();
      const screenshot = await activePage.screenshot({ encoding: 'base64' });
      
      res.json({
        success: true,
        url: currentUrl,
        title,
        screenshot: `data:image/png;base64,${screenshot}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Extract data from page
  app.post("/api/browser/extract", async (req, res) => {
    if (!activePage) {
      res.status(400).json({ error: "Browser not initialized" });
      return;
    }
    
    try {
      const { selector, fields } = req.body;
      const data = await activePage.evaluate((sel: string, flds: any) => {
        const elements = document.querySelectorAll(sel);
        return Array.from(elements).map(el => {
          const result: any = {};
          if (typeof flds === 'object') {
            Object.entries(flds).forEach(([key, fieldSelector]) => {
              const fieldEl = el.querySelector(fieldSelector as string);
              result[key] = fieldEl ? fieldEl.textContent : null;
            });
          } else {
            result.text = el.textContent;
          }
          return result;
        });
      }, selector, fields);
      
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fill form
  app.post("/api/browser/fill-form", async (req, res) => {
    if (!activePage) {
      res.status(400).json({ error: "Browser not initialized" });
      return;
    }
    
    try {
      const { formData } = req.body;
      for (const [selector, value] of Object.entries(formData)) {
        await activePage.type(selector, value as string);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Click element
  app.post("/api/browser/click", async (req, res) => {
    if (!activePage) {
      res.status(400).json({ error: "Browser not initialized" });
      return;
    }
    
    try {
      const { selector } = req.body;
      await activePage.click(selector);
      await activePage.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
      res.json({ success: true, url: activePage.url() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Execute workflow
  app.post("/api/browser/execute-workflow", async (req, res) => {
    if (!activePage) {
      res.status(400).json({ error: "Browser not initialized" });
      return;
    }
    
    const { workflow } = req.body;
    const results = [];
    
    try {
      for (const step of workflow.steps) {
        let stepResult: any;
        
        switch (step.type) {
          case 'navigate':
            await activePage.goto(step.url, { waitUntil: 'networkidle2' });
            stepResult = { success: true, url: activePage.url() };
            break;
            
          case 'click':
            await activePage.click(step.selector);
            stepResult = { success: true };
            break;
            
          case 'type':
            await activePage.type(step.selector, step.value);
            stepResult = { success: true };
            break;
            
          case 'extract':
            const data = await activePage.evaluate((sel: string) => {
              const elements = document.querySelectorAll(sel);
              return Array.from(elements).map(el => el.textContent);
            }, step.selector);
            stepResult = { success: true, data };
            break;
            
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
            stepResult = { success: true };
            break;
            
          case 'screenshot':
            const screenshot = await activePage.screenshot({ encoding: 'base64' });
            stepResult = {
              success: true,
              screenshot: `data:image/png;base64,${screenshot}`
            };
            break;
            
          default:
            stepResult = { error: `Unknown step type: ${step.type}` };
        }
        
        results.push({ step: step.name || step.type, ...stepResult });
        
        if (stepResult.error) break;
      }
      
      res.json({ success: true, results });
    } catch (error: any) {
      res.status(500).json({ error: error.message, results });
    }
  });

  // Close browser
  app.post("/api/browser/close", async (req, res) => {
    try {
      if (puppeteerBrowser) {
        await puppeteerBrowser.close();
        puppeteerBrowser = null;
        activePage = null;
      }
      res.json({ success: true, message: "Browser closed" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Windows API endpoints
  app.get("/api/windows/system-info", async (req, res) => {
    try {
      const info = await windowsAPI.getSystemInfo();
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/notification", async (req, res) => {
    try {
      const { title, message, icon, sound, wait } = req.body;
      await windowsAPI.showNotification({ title, message, icon, sound, wait });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/clipboard", async (req, res) => {
    try {
      const content = await windowsAPI.getClipboard();
      res.json({ content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/clipboard", async (req, res) => {
    try {
      const { text } = req.body;
      await windowsAPI.setClipboard(text);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/screenshot", async (req, res) => {
    try {
      const { outputPath } = req.body;
      const path = await windowsAPI.takeScreenshot(outputPath);
      res.json({ success: true, path });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/processes", async (req, res) => {
    try {
      const processes = await windowsAPI.getProcesses();
      res.json({ processes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/kill-process", async (req, res) => {
    try {
      const { pid } = req.body;
      await windowsAPI.killProcess(pid);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/open-file", async (req, res) => {
    try {
      const { filePath } = req.body;
      await windowsAPI.openFile(filePath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/registry/read", async (req, res) => {
    try {
      const { keyPath, valueName } = req.query;
      const value = await windowsAPI.readRegistry(keyPath as string, valueName as string);
      res.json({ value });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/registry/write", async (req, res) => {
    try {
      const { keyPath, valueName, value, type } = req.body;
      await windowsAPI.writeRegistry(keyPath, valueName, value, type);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/shortcut", async (req, res) => {
    try {
      const options = req.body;
      await windowsAPI.createShortcut(options);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/installed-programs", async (req, res) => {
    try {
      const programs = await windowsAPI.getInstalledPrograms();
      res.json({ programs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/auth-info", async (req, res) => {
    try {
      const info = await windowsAPI.getUserAuthInfo();
      res.json(info);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/windows/powershell", async (req, res) => {
    try {
      const { command } = req.body;
      const output = await windowsAPI.executePowerShell(command);
      res.json({ output });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/windows/network-shares", async (req, res) => {
    try {
      const shares = await windowsAPI.getNetworkShares();
      res.json({ shares });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simple proxy endpoint for fetching external web pages
  app.post("/api/browser-proxy/fetch", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      console.log('Proxying request to:', url);

      // Validate and normalize URL
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Use node's fetch to get the page content with better error handling
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'no-NO,no;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const contentType = response.headers.get('content-type');
      console.log('Response content-type:', contentType);
      
      if (contentType?.includes('text/html')) {
        let html = await response.text();
        
        // Parse the URL to get origin
        const urlObj = new URL(targetUrl);
        const baseUrl = urlObj.origin;
        
        // More comprehensive URL replacements
        html = html
          // Add base tag for relative URLs
          .replace(/<head[^>]*>/i, `$&<base href="${baseUrl}/">`)
          // Replace protocol-relative URLs
          .replace(/src="\/\//g, 'src="https://')
          .replace(/href="\/\//g, 'href="https://')
          // Replace root-relative URLs  
          .replace(/src="\//g, `src="${baseUrl}/`)
          .replace(/href="\//g, `href="${baseUrl}/`)
          // Remove integrity checks that might fail
          .replace(/integrity="[^"]*"/g, '')
          // Remove CSP that might block resources
          .replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
        
        // Add custom CSS to make content more readable
        const customStyle = `
          <style>
            /* Custom proxy styles */
            body { 
              max-width: 100% !important; 
              overflow-x: hidden !important;
            }
            /* Hide cookie banners and popups */
            [class*="cookie"], [class*="consent"], [class*="gdpr"], 
            [id*="cookie"], [id*="consent"], [id*="gdpr"] {
              display: none !important;
            }
          </style>
        `;
        
        html = html.replace('</head>', customStyle + '</head>');
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Proxied-URL', targetUrl);
        res.send(html);
      } else if (contentType?.includes('application/json')) {
        const json = await response.json();
        res.json(json);
      } else {
        // For non-HTML content, proxy it directly
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        res.send(Buffer.from(buffer));
      }
      
    } catch (error) {
      console.error('Proxy fetch error:', error);
      
      // Return a user-friendly error page
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="no">
        <head>
          <meta charset="UTF-8">
          <title>Kunne ikke laste siden</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .error-container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            h1 { font-size: 3rem; margin: 0 0 1rem 0; }
            p { font-size: 1.2rem; opacity: 0.9; }
            .error-details {
              margin-top: 1rem;
              padding: 1rem;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 5px;
              font-family: monospace;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>⚠️ Kunne ikke laste siden</h1>
            <p>Vi kunne ikke hente innholdet fra den forespurte URL-en.</p>
            <div class="error-details">
              URL: ${req.body.url || 'Ukjent'}<br>
              Feil: ${error instanceof Error ? error.message : 'Ukjent feil'}
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Browser Content Proxy - Fetch and serve web page content
  app.get("/api/browser-proxy/:instanceId/:tabId", async (req, res) => {
    try {
      const { instanceId, tabId } = req.params;
      // const engine = browserManager.getEngine(instanceId); // TODO: Implement getEngine method
      const engine = null; // Temporarily disabled
      
      if (!engine) {
        // If no browser engine, return a simple message
        res.send(`
          <html>
            <head>
              <title>Browser Not Ready</title>
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100vh; 
                  margin: 0;
                  background: #1a1a1a;
                  color: #e0e0e0;
                }
                .message { text-align: center; }
                button {
                  margin-top: 20px;
                  padding: 10px 20px;
                  background: #007bff;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div class="message">
                <h2>Nettleseren er ikke klar</h2>
                <p>Vennligst vent mens vi initialiserer nettleseren...</p>
                <button onclick="window.location.reload()">Prøv igjen</button>
              </div>
            </body>
          </html>
        `);
        return;
      }
      
      const tab = engine.getTab(tabId);
      if (!tab) {
        res.status(404).json({ error: 'Tab not found' });
        return;
      }
      
      // Try to get the page content
      const content = await engine.getPageContent(tabId);
      
      if (!content) {
        // Return a simple loading page if content is not available
        res.send(`
          <html>
            <head>
              <title>Loading...</title>
              <style>
                body { 
                  font-family: system-ui, -apple-system, sans-serif; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  height: 100vh; 
                  margin: 0;
                  background: #1a1a1a;
                  color: #e0e0e0;
                }
                .message { text-align: center; }
              </style>
            </head>
            <body>
              <div class="message">
                <h2>Laster innhold...</h2>
                <p>URL: ${tab.url}</p>
              </div>
            </body>
          </html>
        `);
        return;
      }
      
      // Send the HTML content with proper headers
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Allow iframe from same origin
      res.send(content);
      
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).send(`
        <html>
          <head>
            <title>Error</title>
            <style>
              body { 
                font-family: system-ui; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: #1a1a1a;
                color: #ff4444;
              }
            </style>
          </head>
          <body>
            <div>
              <h2>Kunne ikke laste siden</h2>
              <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Native Browser Engine endpoints
  app.post("/api/browser-engine/instance", async (req, res) => {
    try {
      const { type, profile, isIncognito, contextOptions } = req.body;
      const instanceId = await browserManager.createInstance({
        type: type || BrowserEngineType.CHROMIUM,
        profile,
        isIncognito,
        contextOptions
      });
      res.json({ instanceId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/browser-engine/instance/:instanceId", async (req, res) => {
    try {
      await browserManager.closeInstance(req.params.instanceId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/instances", async (req, res) => {
    try {
      const instances = browserManager.getAllInstances();
      res.json({ instances: instances.map(i => ({
        id: i.id,
        type: i.type,
        tabCount: i.tabs.size,
        isIncognito: i.isIncognito,
        createdAt: i.createdAt,
        lastActiveAt: i.lastActiveAt
      })) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/tab", async (req, res) => {
    try {
      const { url, options } = req.body;
      const tab = await browserManager.createTab(req.params.instanceId, url, options);
      res.json({ tab });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/browser-engine/instance/:instanceId/tab/:tabId", async (req, res) => {
    try {
      await browserManager.closeTab(req.params.instanceId, req.params.tabId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/tab/:tabId/navigate", async (req, res) => {
    try {
      const { url } = req.body;
      await browserManager.navigate(req.params.instanceId, req.params.tabId, url);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/tab/:tabId/execute", async (req, res) => {
    try {
      const { script } = req.body;
      const result = await browserManager.executeScript(req.params.instanceId, req.params.tabId, script);
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/tab/:tabId/screenshot", async (req, res) => {
    try {
      const { options } = req.body;
      const screenshot = await browserManager.screenshot(req.params.instanceId, req.params.tabId, options);
      res.json({ screenshot: screenshot.toString('base64') });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // GET endpoint for screenshot (for useQuery)
  app.get("/api/browser-engine/instance/:instanceId/tab/:tabId/screenshot", async (req, res) => {
    try {
      const screenshot = await browserManager.screenshot(req.params.instanceId, req.params.tabId);
      res.json(screenshot.toString('base64'));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/instance/:instanceId/tab/:tabId/metrics", async (req, res) => {
    try {
      const metrics = await browserManager.getPerformanceMetrics(req.params.instanceId, req.params.tabId);
      res.json({ metrics });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/profile", async (req, res) => {
    try {
      const profile = req.body;
      browserManager.createProfile(profile);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/profiles", async (req, res) => {
    try {
      const profiles = browserManager.getAllProfiles();
      res.json({ profiles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/tab/:tabId/emulate", async (req, res) => {
    try {
      const { device } = req.body;
      await browserManager.emulateDevice(req.params.instanceId, req.params.tabId, device);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/instance/:instanceId/extensions", async (req, res) => {
    try {
      const { extensions } = req.body;
      await browserManager.enableExtensions(req.params.instanceId, extensions);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/memory", async (req, res) => {
    try {
      const usage = browserManager.getMemoryUsage();
      res.json({ usage });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/cleanup", async (req, res) => {
    try {
      const { maxAge } = req.body;
      await browserManager.cleanup(maxAge);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Advanced Tab Management endpoints
  app.post("/api/browser-engine/tab/new", async (req, res) => {
    try {
      const { instanceId, url, background } = req.body;
      
      if (!instanceId) {
        return res.status(400).json({ error: 'Instance ID required' });
      }
      
      // Create new tab
      const tab = await browserManager.createTab(instanceId, url || 'about:blank');
      
      // If not background, switch to the new tab
      if (!background) {
        const instance = browserManager.getAllInstances()
          .find(inst => inst.id === instanceId);
        
        if (instance) {
          browserManager.setActiveInstance(instanceId);
        }
      }
      
      res.json({ 
        tab,
        totalTabs: browserManager.getMemoryUsage().tabs,
        message: `Ny fane åpnet${url ? ` med ${url}` : ''}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/duplicate", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      // Get current tab info
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      const sourceTab = instance.tabs.get(tabId);
      if (!sourceTab) {
        return res.status(404).json({ error: 'Tab not found' });
      }
      
      // Create duplicate tab with same URL
      const newTab = await browserManager.createTab(instanceId, sourceTab.url);
      
      res.json({ 
        tab: newTab,
        duplicatedFrom: tabId,
        message: 'Fane duplisert'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/tabs/:instanceId", async (req, res) => {
    try {
      const { instanceId } = req.params;
      
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      const tabs = Array.from(instance.tabs.values());
      
      res.json({ 
        tabs,
        count: tabs.length,
        activeTabId: tabs[0]?.id // First tab as active for now
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/switch", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      const tab = instance.tabs.get(tabId);
      if (!tab) {
        return res.status(404).json({ error: 'Tab not found' });
      }
      
      // Set this tab as the active one in the browser engine
      browserManager.setActiveInstance(instanceId);
      
      res.json({ 
        success: true,
        activeTab: tab,
        message: 'Byttet til fane'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tabs/close-all", async (req, res) => {
    try {
      const { instanceId, keepActive } = req.body;
      
      if (!instanceId) {
        return res.status(400).json({ error: 'Instance ID required' });
      }
      
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      // Get first tab as active (for now)
      const activeTabId = Array.from(instance.tabs.values())[0]?.id;
      
      const tabsToClose: string[] = [];
      
      for (const [tabId] of Array.from(instance.tabs)) {
        if (!keepActive || tabId !== activeTabId) {
          tabsToClose.push(tabId);
        }
      }
      
      // Close all tabs except active if requested
      for (const tabId of tabsToClose) {
        await browserManager.closeTab(instanceId, tabId);
      }
      
      res.json({ 
        success: true,
        closedCount: tabsToClose.length,
        remainingTabs: instance.tabs.size,
        message: `${tabsToClose.length} faner lukket`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/reload", async (req, res) => {
    try {
      const { instanceId, tabId, hard } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      // Execute reload script
      const script = hard ? 
        'location.reload(true);' : 
        'location.reload();';
      
      await browserManager.executeScript(instanceId, tabId, script);
      
      res.json({ 
        success: true,
        message: `Fane lastet på nytt ${hard ? '(hard reload)' : ''}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/stop", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      // Execute stop script
      await browserManager.executeScript(instanceId, tabId, 'window.stop();');
      
      res.json({ 
        success: true,
        message: 'Lasting stoppet'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/navigate-back", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      await browserManager.executeScript(instanceId, tabId, 'history.back();');
      
      res.json({ 
        success: true,
        message: 'Navigerte tilbake'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/navigate-forward", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      await browserManager.executeScript(instanceId, tabId, 'history.forward();');
      
      res.json({ 
        success: true,
        message: 'Navigerte fremover'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/open-multiple", async (req, res) => {
    try {
      const { instanceId, urls } = req.body;
      
      if (!instanceId || !urls || !Array.isArray(urls)) {
        return res.status(400).json({ error: 'Instance ID and URLs array required' });
      }
      
      const tabs = [];
      
      // Open each URL in a new tab
      for (const url of urls) {
        const tab = await browserManager.createTab(instanceId, url);
        tabs.push(tab);
      }
      
      res.json({ 
        success: true,
        tabs,
        count: tabs.length,
        message: `${tabs.length} nye faner åpnet`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/browser-engine/tab/close-others", async (req, res) => {
    try {
      const { instanceId, tabId } = req.body;
      
      if (!instanceId || !tabId) {
        return res.status(400).json({ error: 'Instance ID and Tab ID required' });
      }
      
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      const tabsToClose: string[] = [];
      
      for (const [tid] of Array.from(instance.tabs)) {
        if (tid !== tabId) {
          tabsToClose.push(tid);
        }
      }
      
      // Close all other tabs
      for (const tid of tabsToClose) {
        await browserManager.closeTab(instanceId, tid);
      }
      
      res.json({ 
        success: true,
        closedCount: tabsToClose.length,
        message: `${tabsToClose.length} andre faner lukket`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Keyboard shortcuts handler
  app.post("/api/browser-engine/keyboard-shortcut", async (req, res) => {
    try {
      const { instanceId, shortcut, tabId } = req.body;
      
      if (!instanceId || !shortcut) {
        return res.status(400).json({ error: 'Instance ID and shortcut required' });
      }
      
      const instance = browserManager.getAllInstances()
        .find(inst => inst.id === instanceId);
      
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      let result: any = { success: true };
      
      switch (shortcut) {
        case 'Ctrl+T':
        case 'Cmd+T':
          // Open new tab
          const newTab = await browserManager.createTab(instanceId, 'about:blank');
          result.tab = newTab;
          result.action = 'new_tab';
          result.message = 'Ny fane åpnet';
          break;
          
        case 'Ctrl+W':
        case 'Cmd+W':
          // Close current tab
          if (tabId) {
            await browserManager.closeTab(instanceId, tabId);
            result.action = 'close_tab';
            result.message = 'Fane lukket';
          }
          break;
          
        case 'Ctrl+Shift+T':
        case 'Cmd+Shift+T':
          // Reopen closed tab (would need history tracking)
          result.action = 'reopen_tab';
          result.message = 'Gjenåpne lukket fane (ikke implementert enda)';
          break;
          
        case 'Ctrl+Tab':
        case 'Cmd+Tab':
          // Switch to next tab
          const tabsArray = Array.from(instance.tabs.keys());
          const currentIndex = tabId ? tabsArray.indexOf(tabId) : 0;
          const nextIndex = (currentIndex + 1) % tabsArray.length;
          const nextTabId = tabsArray[nextIndex];
          result.action = 'switch_tab';
          result.tabId = nextTabId;
          result.message = 'Byttet til neste fane';
          break;
          
        case 'Ctrl+Shift+Tab':
        case 'Cmd+Shift+Tab':
          // Switch to previous tab
          const tabsArr = Array.from(instance.tabs.keys());
          const currIndex = tabId ? tabsArr.indexOf(tabId) : 0;
          const prevIndex = (currIndex - 1 + tabsArr.length) % tabsArr.length;
          const prevTabId = tabsArr[prevIndex];
          result.action = 'switch_tab';
          result.tabId = prevTabId;
          result.message = 'Byttet til forrige fane';
          break;
          
        case 'Ctrl+1':
        case 'Cmd+1':
        case 'Ctrl+2':
        case 'Cmd+2':
        case 'Ctrl+3':
        case 'Cmd+3':
        case 'Ctrl+4':
        case 'Cmd+4':
        case 'Ctrl+5':
        case 'Cmd+5':
        case 'Ctrl+6':
        case 'Cmd+6':
        case 'Ctrl+7':
        case 'Cmd+7':
        case 'Ctrl+8':
        case 'Cmd+8':
          // Switch to specific tab number
          const tabNumber = parseInt(shortcut.slice(-1)) - 1;
          const tabsList = Array.from(instance.tabs.keys());
          if (tabNumber < tabsList.length) {
            result.action = 'switch_tab';
            result.tabId = tabsList[tabNumber];
            result.message = `Byttet til fane ${tabNumber + 1}`;
          }
          break;
          
        case 'Ctrl+9':
        case 'Cmd+9':
          // Switch to last tab
          const lastTabsList = Array.from(instance.tabs.keys());
          const lastTabId = lastTabsList[lastTabsList.length - 1];
          result.action = 'switch_tab';
          result.tabId = lastTabId;
          result.message = 'Byttet til siste fane';
          break;
          
        case 'Ctrl+D':
        case 'Cmd+D':
          // Bookmark current page (would need bookmark system)
          result.action = 'bookmark';
          result.message = 'Bokmerke funksjon (ikke implementert enda)';
          break;
          
        case 'Ctrl+R':
        case 'Cmd+R':
        case 'F5':
          // Reload current tab
          if (tabId) {
            await browserManager.executeScript(instanceId, tabId, 'location.reload();');
            result.action = 'reload';
            result.message = 'Side lastet på nytt';
          }
          break;
          
        case 'Ctrl+Shift+R':
        case 'Cmd+Shift+R':
        case 'Ctrl+F5':
        case 'Cmd+Shift+F5':
          // Hard reload
          if (tabId) {
            await browserManager.executeScript(instanceId, tabId, 'location.reload(true);');
            result.action = 'hard_reload';
            result.message = 'Hard reload utført';
          }
          break;
          
        case 'Alt+Left':
        case 'Alt+←':
          // Go back
          if (tabId) {
            await browserManager.executeScript(instanceId, tabId, 'history.back();');
            result.action = 'navigate_back';
            result.message = 'Navigerte tilbake';
          }
          break;
          
        case 'Alt+Right':
        case 'Alt+→':
          // Go forward
          if (tabId) {
            await browserManager.executeScript(instanceId, tabId, 'history.forward();');
            result.action = 'navigate_forward';
            result.message = 'Navigerte fremover';
          }
          break;
          
        case 'Ctrl+L':
        case 'Cmd+L':
          // Focus address bar
          result.action = 'focus_address_bar';
          result.message = 'Adressefelt fokusert';
          break;
          
        case 'Escape':
          // Stop loading
          if (tabId) {
            await browserManager.executeScript(instanceId, tabId, 'window.stop();');
            result.action = 'stop_loading';
            result.message = 'Lasting stoppet';
          }
          break;
          
        default:
          result.success = false;
          result.message = `Ukjent snarvei: ${shortcut}`;
      }
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/browser-engine/keyboard-shortcuts", async (req, res) => {
    try {
      const shortcuts = [
        { key: 'Ctrl+T / Cmd+T', action: 'Åpne ny fane' },
        { key: 'Ctrl+W / Cmd+W', action: 'Lukk fane' },
        { key: 'Ctrl+Shift+T / Cmd+Shift+T', action: 'Gjenåpne lukket fane' },
        { key: 'Ctrl+Tab / Cmd+Tab', action: 'Neste fane' },
        { key: 'Ctrl+Shift+Tab / Cmd+Shift+Tab', action: 'Forrige fane' },
        { key: 'Ctrl+1-8 / Cmd+1-8', action: 'Gå til fane 1-8' },
        { key: 'Ctrl+9 / Cmd+9', action: 'Gå til siste fane' },
        { key: 'Ctrl+R / Cmd+R / F5', action: 'Last siden på nytt' },
        { key: 'Ctrl+Shift+R / Cmd+Shift+R', action: 'Hard reload' },
        { key: 'Alt+← / Alt+Left', action: 'Gå tilbake' },
        { key: 'Alt+→ / Alt+Right', action: 'Gå fremover' },
        { key: 'Ctrl+D / Cmd+D', action: 'Bokmerke side' },
        { key: 'Ctrl+L / Cmd+L', action: 'Fokuser adressefelt' },
        { key: 'Escape', action: 'Stopp lasting' }
      ];
      
      res.json({ shortcuts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Bookmarks endpoints
  app.get("/api/bookmarks", async (req, res) => {
    try {
      const bookmarks = await storage.getBookmarks();
      res.json(bookmarks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/bookmarks", async (req, res) => {
    try {
      const data = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(data);
      res.json(bookmark);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
      const success = await storage.deleteBookmark(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Bookmark not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Browser History endpoints
  app.get("/api/browser-history", async (req, res) => {
    try {
      const history = await storage.getBrowserHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/browser-history", async (req, res) => {
    try {
      const data = insertBrowserHistorySchema.parse(req.body);
      const historyEntry = await storage.addToHistory(data);
      res.json(historyEntry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid history data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/browser-history", async (req, res) => {
    try {
      await storage.clearHistory();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Downloads endpoints
  app.get("/api/downloads", async (req, res) => {
    try {
      const downloads = await storage.getDownloads();
      res.json(downloads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) {
        res.status(404).json({ message: "Download not found" });
        return;
      }
      res.json(download);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/downloads", async (req, res) => {
    try {
      const data = insertDownloadSchema.parse(req.body);
      const download = await storage.createDownload(data);
      res.json(download);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid download data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.patch("/api/downloads/:id", async (req, res) => {
    try {
      const updates = insertDownloadSchema.partial().parse(req.body);
      const download = await storage.updateDownload(req.params.id, updates);
      if (!download) {
        res.status(404).json({ message: "Download not found" });
        return;
      }
      res.json(download);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid download data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });
  
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const success = await storage.deleteDownload(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Download not found" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Saved passwords endpoints
  app.get("/api/saved-passwords", async (req, res) => {
    try {
      const passwords = await storage.getSavedPasswords();
      res.json(passwords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/saved-passwords/domain/:domain", async (req, res) => {
    try {
      const passwords = await storage.getSavedPasswordForDomain(req.params.domain);
      res.json(passwords);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/saved-passwords", async (req, res) => {
    try {
      const data = insertSavedPasswordSchema.parse(req.body);
      const password = await storage.savePassword(data);
      res.json(password);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/saved-passwords/:id", async (req, res) => {
    try {
      const updates = insertSavedPasswordSchema.partial().parse(req.body);
      const password = await storage.updatePassword(req.params.id, updates);
      if (!password) {
        res.status(404).json({ message: "Password not found" });
        return;
      }
      res.json(password);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/saved-passwords/:id", async (req, res) => {
    try {
      const success = await storage.deletePassword(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Password not found" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cloud Sync endpoints
  app.get('/api/sync/status', (req, res) => {
    res.json({
      isEnabled: true,
      lastSync: new Date().toISOString(),
      pendingChanges: 0,
      conflicts: 0,
      devices: 2
    });
  });

  app.post('/api/sync/start', async (req, res) => {
    // Simulate sync operation
    res.json({
      success: true,
      itemsSynced: {
        bookmarks: 156,
        history: 1250,
        passwords: 45,
        settings: 1
      },
      duration: 2100
    });
  });

  app.get('/api/sync/conflicts', (req, res) => {
    res.json([]);
  });

  app.post('/api/sync/conflicts/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { resolution } = req.body;
    res.json({ success: true, conflictId: id, resolution });
  });

  app.get('/api/sync/devices', (req, res) => {
    res.json([
      {
        id: 'device-1',
        name: 'Min Desktop',
        type: 'desktop',
        lastSeen: new Date().toISOString(),
        isActive: true,
        browser: 'MadEasy Browser v2.0',
        os: 'Windows 11'
      },
      {
        id: 'device-2',
        name: 'Min iPhone',
        type: 'mobile',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        isActive: false,
        browser: 'MadEasy Mobile v2.0',
        os: 'iOS 17'
      }
    ]);
  });

  app.post('/api/sync/backup', async (req, res) => {
    res.json({
      id: `backup-${Date.now()}`,
      name: req.body.name || 'Manual backup',
      createdAt: new Date().toISOString(),
      size: Math.random() * 5 * 1024 * 1024,
      type: 'manual'
    });
  });

  app.get('/api/sync/backups', (req, res) => {
    res.json([
      {
        id: 'backup-1',
        name: 'Automatisk backup',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        size: 2.5 * 1024 * 1024,
        type: 'auto',
        items: {
          bookmarks: 156,
          history: 1250,
          passwords: 45,
          settings: 1
        }
      }
    ]);
  });

  app.post('/api/sync/restore/:backupId', async (req, res) => {
    const { backupId } = req.params;
    res.json({ success: true, backupId, restoredItems: 1500 });
  });

  // AI Agent Orchestration endpoints
  app.post("/api/agents/task", async (req, res) => {
    try {
      const { description, type, priority, context } = req.body;
      const task = {
        id: `task-${Date.now()}`,
        type: type || 'generic',
        description,
        priority: priority || TaskPriority.MEDIUM,
        context: context || {},
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const result = await agentOrchestrator.executeTask(task);
      res.json({ task, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/status", async (req, res) => {
    try {
      const agentStatus = Array.from(agentOrchestrator.getAgentStatus().entries()).map(([type, status]) => ({
        agent: type,
        status
      }));
      
      const metrics = Array.from(agentOrchestrator.getAgentMetrics().entries()).map(([type, metrics]) => ({
        agent: type,
        metrics
      }));
      
      res.json({
        agents: agentStatus,
        metrics,
        taskQueue: agentOrchestrator.getTaskQueue(),
        mode: agentOrchestrator.getMode()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      if (!['manual', 'copilot', 'autopilot', 'pm'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
      }
      
      agentOrchestrator.setMode(mode);
      res.json({ mode, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/web-scraping", async (req, res) => {
    try {
      const { url, selectors, options } = req.body;
      
      // Create browser instance for scraping
      const instanceId = await browserManager.createInstance({
        type: BrowserEngineType.CHROMIUM,
        isIncognito: true
      });
      
      const tab = await browserManager.createTab(instanceId, url);
      
      const task = {
        id: `scraping-${Date.now()}`,
        type: 'web-scraping',
        description: `Extract data from ${url}`,
        priority: TaskPriority.HIGH,
        context: {
          url,
          selectors,
          instanceId,
          tabId: tab.id,
          options
        },
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const result = await agentOrchestrator.executeTask(task);
      
      // Cleanup browser instance
      await browserManager.closeInstance(instanceId);
      
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/form-automation", async (req, res) => {
    try {
      const { url, formData, submitSelector } = req.body;
      
      // Create browser instance
      const instanceId = await browserManager.createInstance({
        type: BrowserEngineType.CHROMIUM
      });
      
      const tab = await browserManager.createTab(instanceId, url);
      
      const task = {
        id: `form-${Date.now()}`,
        type: 'form-automation',
        description: `Fill and submit form at ${url}`,
        priority: TaskPriority.HIGH,
        context: {
          url,
          fields: formData,
          submitSelector,
          instanceId,
          tabId: tab.id
        },
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const result = await agentOrchestrator.executeTask(task);
      
      // Take screenshot of result
      const screenshot = await browserManager.screenshot(instanceId, tab.id);
      
      // Cleanup
      await browserManager.closeInstance(instanceId);
      
      res.json({ 
        result,
        screenshot: screenshot.toString('base64')
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents/research", async (req, res) => {
    try {
      const { query, sources } = req.body;
      
      const task = {
        id: `research-${Date.now()}`,
        type: 'research',
        description: query,
        priority: TaskPriority.MEDIUM,
        context: { sources },
        status: 'pending' as const,
        createdAt: new Date()
      };
      
      const result = await agentOrchestrator.executeTask(task);
      res.json({ result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // QA Suite Pro endpoints
  app.post("/api/qa/test", async (req, res) => {
    try {
      const { url, testType, config } = req.body;
      
      if (!url || !testType) {
        return res.status(400).json({ error: 'URL and test type are required' });
      }
      
      const result = await qaSuite.runTest(url, testType as TestType, config);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/qa/suite", async (req, res) => {
    try {
      const suiteConfig = req.body;
      
      if (!suiteConfig.urls || suiteConfig.urls.length === 0) {
        return res.status(400).json({ error: 'URLs are required' });
      }
      
      const result = await qaSuite.runTestSuite(suiteConfig);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/qa/schedule", async (req, res) => {
    try {
      const { config, rrule } = req.body;
      
      if (!config || !rrule) {
        return res.status(400).json({ error: 'Config and RRULE are required' });
      }
      
      const scheduleId = qaSuite.scheduleTestSuite(config, rrule);
      res.json({ scheduleId, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/qa/schedule/:scheduleId", async (req, res) => {
    try {
      const success = qaSuite.cancelScheduledTest(req.params.scheduleId);
      
      if (!success) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/qa/schedules", async (req, res) => {
    try {
      const schedules = qaSuite.getScheduledTests();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/qa/history", async (req, res) => {
    try {
      const { url } = req.query;
      const history = qaSuite.getTestHistory(url as string);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/qa/compare", async (req, res) => {
    try {
      const { resultId1, resultId2 } = req.body;
      
      if (!resultId1 || !resultId2) {
        return res.status(400).json({ error: 'Two result IDs are required' });
      }
      
      const comparison = qaSuite.compareTestResults(resultId1, resultId2);
      res.json(comparison);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/qa/cicd", async (req, res) => {
    try {
      const { platform, config } = req.body;
      
      if (!platform || !config) {
        return res.status(400).json({ error: 'Platform and config are required' });
      }
      
      qaSuite.setupCICDIntegration(platform, config);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/qa/cicd", async (req, res) => {
    try {
      const integrations = qaSuite.getCICDIntegrations();
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/qa/report", async (req, res) => {
    try {
      const { resultIds } = req.body;
      
      if (!resultIds || resultIds.length === 0) {
        return res.status(400).json({ error: 'Result IDs are required' });
      }
      
      const history = qaSuite.getTestHistory();
      const results = history.filter(r => resultIds.includes(r.id));
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'No results found' });
      }
      
      const report = qaSuite.generateReport(results);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Selector Studio v2 endpoints
  app.post("/api/selector/analyze", async (req, res) => {
    try {
      const { selector, url } = req.body;
      
      if (!selector || !url) {
        return res.status(400).json({ error: 'Selector and URL are required' });
      }
      
      const analysis = await selectorStudio.analyzeSelector(selector, url);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/optimize", async (req, res) => {
    try {
      const { selector, url } = req.body;
      
      if (!selector || !url) {
        return res.status(400).json({ error: 'Selector and URL are required' });
      }
      
      const optimized = await selectorStudio.optimizeSelector(selector, url);
      res.json({ 
        original: selector,
        optimized,
        improved: selector !== optimized 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/test", async (req, res) => {
    try {
      const { selector, urls } = req.body;
      
      if (!selector || !urls || urls.length === 0) {
        return res.status(400).json({ error: 'Selector and URLs are required' });
      }
      
      const results = await selectorStudio.testSelector(selector, urls);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/generate", async (req, res) => {
    try {
      const { url, description, domain } = req.body;
      
      if (!url || !description) {
        return res.status(400).json({ error: 'URL and description are required' });
      }
      
      const suggestions = await selectorStudio.generateSelector(
        url, 
        description, 
        domain as DomainProfile
      );
      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/repair", async (req, res) => {
    try {
      const { selector, url } = req.body;
      
      if (!selector || !url) {
        return res.status(400).json({ error: 'Selector and URL are required' });
      }
      
      const repaired = await selectorStudio.repairSelector(selector, url);
      res.json({ 
        broken: selector,
        repaired,
        fixed: selector !== repaired 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/learn", async (req, res) => {
    try {
      const { selector, domain, score } = req.body;
      
      if (!selector || !domain || score === undefined) {
        return res.status(400).json({ error: 'Selector, domain, and score are required' });
      }
      
      selectorStudio.learnFromUsage(selector, domain as DomainProfile, score);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/save", async (req, res) => {
    try {
      const { name, selector } = req.body;
      
      if (!name || !selector) {
        return res.status(400).json({ error: 'Name and selector are required' });
      }
      
      selectorStudio.saveSelector(name, selector);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/selector/saved", async (req, res) => {
    try {
      const selectors = Array.from(selectorStudio.getSavedSelectors().entries())
        .map(([name, selector]) => ({ name, selector }));
      res.json(selectors);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/selector/history", async (req, res) => {
    try {
      const { url } = req.query;
      const history = selectorStudio.getHistory(url as string);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/selector/stability-report", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const report = selectorStudio.getStabilityReport(url as string);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/selector/export", async (req, res) => {
    try {
      const data = selectorStudio.exportSelectors();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/selector/import", async (req, res) => {
    try {
      const data = req.body;
      
      if (!data || !data.selectors) {
        return res.status(400).json({ error: 'Invalid import data' });
      }
      
      selectorStudio.importSelectors(data);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/selector/domain-profiles", async (req, res) => {
    try {
      const profiles = [
        {
          domain: DomainProfile.ECOMMERCE,
          name: 'E-commerce',
          description: 'Optimized for online shopping sites',
          patterns: ['product cards', 'add to cart', 'price', 'checkout']
        },
        {
          domain: DomainProfile.SOCIAL_MEDIA,
          name: 'Social Media',
          description: 'Optimized for social platforms',
          patterns: ['posts', 'likes', 'comments', 'share']
        },
        {
          domain: DomainProfile.NEWS,
          name: 'News & Media',
          description: 'Optimized for news websites',
          patterns: ['articles', 'headlines', 'authors', 'publish date']
        },
        {
          domain: DomainProfile.SAAS,
          name: 'SaaS Applications',
          description: 'Optimized for software applications',
          patterns: ['dashboard', 'forms', 'tables', 'modals']
        },
        {
          domain: DomainProfile.BANKING,
          name: 'Banking & Finance',
          description: 'Secure selectors for financial sites',
          patterns: ['account balance', 'transactions', 'transfers']
        },
        {
          domain: DomainProfile.GOVERNMENT,
          name: 'Government',
          description: 'Stable selectors for government sites',
          patterns: ['forms', 'documents', 'services']
        },
        {
          domain: DomainProfile.EDUCATIONAL,
          name: 'Educational',
          description: 'Optimized for educational platforms',
          patterns: ['courses', 'assignments', 'grades']
        },
        {
          domain: DomainProfile.HEALTHCARE,
          name: 'Healthcare',
          description: 'Reliable selectors for healthcare sites',
          patterns: ['appointments', 'records', 'prescriptions']
        },
        {
          domain: DomainProfile.CUSTOM,
          name: 'Custom',
          description: 'Custom domain profile',
          patterns: []
        }
      ];
      
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/qa/test-types", async (req, res) => {
    try {
      const testTypes = [
        {
          type: TestType.LIGHTHOUSE,
          name: 'Lighthouse Audit',
          description: 'Performance, accessibility, best practices, and SEO audits',
          categories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa']
        },
        {
          type: TestType.VISUAL_REGRESSION,
          name: 'Visual Regression',
          description: 'Compare screenshots to detect visual changes',
          features: ['baseline comparison', 'pixel diff detection', 'ignore regions']
        },
        {
          type: TestType.ACCESSIBILITY,
          name: 'Accessibility Check',
          description: 'WCAG compliance and accessibility testing',
          standards: ['wcag2a', 'wcag2aa', 'wcag21aa']
        },
        {
          type: TestType.FUNCTIONAL,
          name: 'Functional Testing',
          description: 'Test user flows and interactions'
        },
        {
          type: TestType.PERFORMANCE,
          name: 'Performance Testing',
          description: 'Load times, resource usage, and optimization'
        },
        {
          type: TestType.SECURITY,
          name: 'Security Testing',
          description: 'Basic security checks and vulnerability scanning'
        }
      ];
      
      res.json(testTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agents/capabilities", async (req, res) => {
    try {
      const capabilities = {
        agents: [
          {
            type: AgentType.PLANNER,
            name: 'Planner Agent',
            description: 'Decomposes complex tasks into manageable subtasks',
            capabilities: ['task-decomposition', 'dependency-analysis', 'resource-planning', 'timeline-estimation']
          },
          {
            type: AgentType.CRITIC,
            name: 'Critic Agent',
            description: 'Validates results and ensures quality control',
            capabilities: ['data-validation', 'quality-assessment', 'error-detection', 'compliance-checking']
          },
          {
            type: AgentType.EXECUTOR,
            name: 'Executor Agent',
            description: 'Performs browser automation and web interactions',
            capabilities: ['browser-automation', 'data-extraction', 'form-filling', 'navigation', 'screenshot-capture']
          },
          {
            type: AgentType.RESEARCHER,
            name: 'Researcher Agent',
            description: 'Gathers and analyzes information from multiple sources',
            capabilities: ['web-search', 'data-analysis', 'pattern-recognition', 'information-synthesis']
          },
          {
            type: AgentType.FIXER,
            name: 'Fixer Agent',
            description: 'Handles errors and implements recovery strategies',
            capabilities: ['error-recovery', 'retry-logic', 'fallback-execution', 'state-restoration']
          }
        ],
        modes: [
          {
            name: 'manual',
            description: 'User confirms each action before execution'
          },
          {
            name: 'copilot',
            description: 'AI assists but waits for user approval on critical decisions'
          },
          {
            name: 'autopilot',
            description: 'AI executes tasks autonomously with minimal supervision'
          },
          {
            name: 'pm',
            description: 'AI acts as project manager, coordinating complex workflows'
          }
        ],
        currentMode: agentOrchestrator.getMode()
      };
      
      res.json(capabilities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Register organization and user profile routes
  registerOrganizationRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
