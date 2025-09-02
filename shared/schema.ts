import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  autonomyLevel: integer("autonomy_level").notNull().default(1), // 0=Manual, 1=Co-pilot, 2=Autopilot, 3=PM Mode
  status: text("status").notNull().default("active"), // active, paused, completed
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(), // Array of workflow steps
  tags: text("tags").array().default([]),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const automationTasks = pgTable("automation_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, paused
  currentStep: integer("current_step").default(0),
  plan: jsonb("plan"), // AI-generated plan with steps
  extractedData: jsonb("extracted_data").default([]),
  permissions: text("permissions").array().default([]),
  progress: integer("progress").default(0), // 0-100
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => automationTasks.id),
  type: text("type").notNull(), // search, extract, navigate, validate, export
  action: text("action").notNull(),
  details: jsonb("details"),
  screenshot: text("screenshot"), // Base64 or URL
  status: text("status").notNull(), // success, error, pending
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

export const extractedLeads = pgTable("extracted_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => automationTasks.id),
  company: text("company"),
  website: text("website"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  country: text("country"),
  category: text("category"),
  score: integer("score").default(0),
  validated: boolean("validated").default(false),
  source: text("source"),
  extractedAt: timestamp("extracted_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertAutomationTaskSchema = createInsertSchema(automationTasks).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export const insertExtractedLeadSchema = createInsertSchema(extractedLeads).omit({
  id: true,
  extractedAt: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type AutomationTask = typeof automationTasks.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type ExtractedLead = typeof extractedLeads.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type InsertAutomationTask = z.infer<typeof insertAutomationTaskSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertExtractedLead = z.infer<typeof insertExtractedLeadSchema>;
