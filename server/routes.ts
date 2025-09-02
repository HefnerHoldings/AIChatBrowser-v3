import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
        status: "running", 
        startedAt: new Date() 
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

  const httpServer = createServer(app);
  return httpServer;
}
