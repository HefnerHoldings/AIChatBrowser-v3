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

// Session Replay table
export const sessionReplays = pgTable("session_replays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  startUrl: text("start_url").notNull(),
  endUrl: text("end_url"),
  duration: integer("duration"), // in milliseconds
  status: text("status").notNull().default("recording"), // recording, paused, completed, error
  recordingData: jsonb("recording_data"), // DOM snapshots, events, network requests
  metadata: jsonb("metadata"), // browser info, viewport size, etc.
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

// Work Orders table
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // scraping, data-extraction, form-filling, workflow-automation
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  status: text("status").notNull().default("pending"),
  assignee: text("assignee"), // AI agent or user
  requirements: jsonb("requirements"), // specific requirements for the task
  deliverables: jsonb("deliverables"), // expected outputs
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

// Privacy Ledger table
export const privacyLedger = pgTable("privacy_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  eventType: text("event_type").notNull(), // cookie-set, data-collected, permission-granted, etc.
  domain: text("domain").notNull(),
  dataType: text("data_type"), // cookie, localStorage, form-data, etc.
  dataValue: text("data_value"), // encrypted/hashed sensitive data
  purpose: text("purpose"), // analytics, authentication, preferences, etc.
  consentStatus: text("consent_status"), // granted, denied, pending
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  metadata: jsonb("metadata"),
});

// ADR (Architecture Decision Records) table
export const adrRecords = pgTable("adr_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("proposed"), // proposed, accepted, rejected, deprecated, superseded
  decisionDate: timestamp("decision_date"),
  context: text("context").notNull(),
  decision: text("decision").notNull(),
  consequences: text("consequences"),
  alternatives: jsonb("alternatives"), // other options considered
  relatedRecords: text().array(), // IDs of related ADRs
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Insert schemas for new tables
export const insertSessionReplaySchema = createInsertSchema(sessionReplays).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertPrivacyLedgerSchema = createInsertSchema(privacyLedger).omit({
  id: true,
  timestamp: true,
});

export const insertAdrRecordSchema = createInsertSchema(adrRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type SessionReplay = typeof sessionReplays.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type PrivacyLedger = typeof privacyLedger.$inferSelect;
export type AdrRecord = typeof adrRecords.$inferSelect;

export type InsertSessionReplay = z.infer<typeof insertSessionReplaySchema>;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type InsertPrivacyLedger = z.infer<typeof insertPrivacyLedgerSchema>;
export type InsertAdrRecord = z.infer<typeof insertAdrRecordSchema>;

// Browser bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  favicon: text("favicon"),
  folder: text("folder"), // For organizing bookmarks
  position: integer("position").default(0), // For ordering
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Browser history table
export const browserHistory = pgTable("browser_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  url: text("url").notNull(),
  favicon: text("favicon"),
  visitCount: integer("visit_count").default(1),
  lastVisited: timestamp("last_visited").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas for browser tables
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
  position: true,
});

export const insertBrowserHistorySchema = createInsertSchema(browserHistory).omit({
  id: true,
  createdAt: true,
  lastVisited: true,
  visitCount: true,
});

// Types for browser tables
export type Bookmark = typeof bookmarks.$inferSelect;
export type BrowserHistory = typeof browserHistory.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type InsertBrowserHistory = z.infer<typeof insertBrowserHistorySchema>;
