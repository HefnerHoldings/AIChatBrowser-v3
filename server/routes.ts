import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { windowsAPI } from "./windows-api";
import { browserManager } from "./browser-manager";
import { BrowserEngineType } from "./browser-engine";
import { 
  insertProjectSchema, 
  insertWorkflowSchema, 
  insertAutomationTaskSchema, 
  insertActivityLogSchema,
  insertSessionReplaySchema,
  insertWorkOrderSchema,
  insertPrivacyLedgerSchema,
  insertAdrRecordSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  const httpServer = createServer(app);
  return httpServer;
}
