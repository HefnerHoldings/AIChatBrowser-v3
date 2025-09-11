import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, real, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  type: varchar("type", { length: 50 }).notNull().default('data-extraction'), // data-extraction, form-filling, monitoring, research, testing
  status: varchar("status", { length: 50 }).notNull().default('draft'), // draft, active, paused, completed
  steps: jsonb("steps").notNull(), // Array of workflow steps
  config: jsonb("config").default({}), // Sources, selectors, extraction rules, schedules
  metrics: jsonb("metrics").default({}), // Runtime metrics
  tags: text("tags").array().default([]),
  isTemplate: boolean("is_template").default(false),
  aiGenerated: boolean("ai_generated").default(false),
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

// Workflow Suggestions
export const workflowSuggestions = pgTable('workflow_suggestions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title').notNull(),
  description: text('description'),
  category: varchar('category').notNull(),
  confidence: real('confidence').default(0),
  estimatedTime: varchar('estimated_time'),
  triggers: jsonb('triggers').$type<string[]>().default([]),
  actions: jsonb('actions').$type<string[]>().default([]),
  relevance: varchar('relevance').default('medium'),
  usageCount: integer('usage_count').default(0),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const insertWorkflowSuggestionSchema = createInsertSchema(workflowSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type WorkflowSuggestion = typeof workflowSuggestions.$inferSelect;
export type InsertWorkflowSuggestion = z.infer<typeof insertWorkflowSuggestionSchema>;

// Workflow Usage History
export const workflowUsageHistory = pgTable('workflow_usage_history', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar('workflow_id').notNull(),
  userId: varchar('user_id'),
  url: text('url'),
  context: jsonb('context').$type<Record<string, any>>().default({}),
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  status: varchar('status').notNull().default('started'),
  results: jsonb('results').$type<any>(),
  createdAt: timestamp('created_at').defaultNow()
});

export const insertWorkflowUsageHistorySchema = createInsertSchema(workflowUsageHistory).omit({
  id: true,
  createdAt: true
});

export type WorkflowUsageHistory = typeof workflowUsageHistory.$inferSelect;
export type InsertWorkflowUsageHistory = z.infer<typeof insertWorkflowUsageHistorySchema>;

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

// Downloads table
export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  path: text("path"), // Local file path
  size: integer("size"), // File size in bytes
  mimeType: text("mime_type"),
  status: text("status").notNull().default("pending"), // pending, downloading, completed, failed, cancelled
  progress: integer("progress").default(0), // 0-100
  error: text("error"),
  startedAt: timestamp("started_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

// Saved passwords table
export const savedPasswords = pgTable("saved_passwords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(), // In production, this should be encrypted
  title: text("title"),
  favicon: text("favicon"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  lastUsed: timestamp("last_used"),
});

// Insert schema for downloads
export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  startedAt: true,
});

// Insert schema for saved passwords
export const insertSavedPasswordSchema = createInsertSchema(savedPasswords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastUsed: true,
});

// Types for browser tables
export type Bookmark = typeof bookmarks.$inferSelect;
export type BrowserHistory = typeof browserHistory.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type SavedPassword = typeof savedPasswords.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type InsertBrowserHistory = z.infer<typeof insertBrowserHistorySchema>;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type InsertSavedPassword = z.infer<typeof insertSavedPasswordSchema>;

// Workflow AI Chat table
export const workflowAIChats = pgTable("workflow_ai_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  userId: varchar("user_id"),
  sessionId: varchar("session_id").notNull(),
  inputType: varchar("input_type", { length: 50 }).notNull(), // text, voice-to-text, voice-to-voice
  userMessage: text("user_message").notNull(),
  aiResponse: text("ai_response"),
  parsedIntent: jsonb("parsed_intent"), // Extracted workflow config from natural language
  audioUrl: text("audio_url"), // For voice messages
  createdWorkflowId: varchar("created_workflow_id"), // If a workflow was created
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Workflow Voice Sessions table
export const workflowVoiceSessions = pgTable("workflow_voice_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default('active'), // active, completed, interrupted
  mode: varchar("mode", { length: 50 }).notNull(), // voice-to-text, voice-to-voice
  language: varchar("language", { length: 10 }).default('en'),
  transcripts: jsonb("transcripts").default([]), // Array of transcriptions
  audioFiles: jsonb("audio_files").default([]), // URLs to audio recordings
  duration: integer("duration"), // Total duration in seconds
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  endedAt: timestamp("ended_at"),
});

// Workflow Step Configurations table
export const workflowStepConfigs = pgTable("workflow_step_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  stepIndex: integer("step_index").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // navigate, extract, click, fill, wait, condition, loop
  name: text("name").notNull(),
  config: jsonb("config").notNull().default({}), // Step-specific configuration
  selectors: jsonb("selectors").default({}), // CSS selectors, XPath
  extractionRules: jsonb("extraction_rules").default({}), // Data extraction rules
  validationRules: jsonb("validation_rules").default({}), // Data validation rules
  errorHandling: jsonb("error_handling").default({}), // What to do on error
  conditions: jsonb("conditions").default({}), // Conditional logic
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas for new workflow tables
export const insertWorkflowAIChatSchema = createInsertSchema(workflowAIChats).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowVoiceSessionSchema = createInsertSchema(workflowVoiceSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertWorkflowStepConfigSchema = createInsertSchema(workflowStepConfigs).omit({
  id: true,
  createdAt: true,
});

// Types for new workflow tables
export type WorkflowAIChat = typeof workflowAIChats.$inferSelect;
export type WorkflowVoiceSession = typeof workflowVoiceSessions.$inferSelect;
export type WorkflowStepConfig = typeof workflowStepConfigs.$inferSelect;

export type InsertWorkflowAIChat = z.infer<typeof insertWorkflowAIChatSchema>;
export type InsertWorkflowVoiceSession = z.infer<typeof insertWorkflowVoiceSessionSchema>;
export type InsertWorkflowStepConfig = z.infer<typeof insertWorkflowStepConfigSchema>;

// ========== User Profile & Organization Tables ==========

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Organizations (Companies) table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  size: varchar("size"), // small, medium, large, enterprise
  logo: text("logo"),
  address: text("address"),
  country: text("country"),
  timezone: varchar("timezone").default("Europe/Oslo"),
  billingEmail: text("billing_email"),
  plan: varchar("plan").default("basic"), // basic, professional, enterprise
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User storage table with extended profile support
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").default("personal"), // personal, employee, admin
  organizationId: varchar("organization_id").references(() => organizations.id),
  department: varchar("department"),
  position: varchar("position"),
  phoneNumber: varchar("phone_number"),
  timezone: varchar("timezone").default("Europe/Oslo"),
  language: varchar("language").default("no"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work schedules for employees
export const workSchedules = pgTable("work_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  startTime: varchar("start_time").notNull(), // HH:MM format
  endTime: varchar("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Activity tracking for employees
export const activityTracking = pgTable("activity_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  url: text("url"),
  domain: text("domain"),
  title: text("title"),
  category: varchar("category"), // work, social, entertainment, news, shopping, etc.
  timeSpent: integer("time_spent"), // in seconds
  isWorkRelated: boolean("is_work_related").default(false),
  isDuringWorkHours: boolean("is_during_work_hours").default(false),
  trackingBlocked: boolean("tracking_blocked").default(false),
  blockedReason: text("blocked_reason"),
  keystrokes: integer("keystrokes").default(0),
  mouseClicks: integer("mouse_clicks").default(0),
  scrollDistance: integer("scroll_distance").default(0),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
});

// Productivity metrics
export const productivityMetrics = pgTable("productivity_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  date: timestamp("date").notNull(),
  productivityScore: real("productivity_score").default(0), // 0-100
  focusTime: integer("focus_time").default(0), // in seconds
  breakTime: integer("break_time").default(0),
  totalActiveTime: integer("total_active_time").default(0),
  categorySummary: jsonb("category_summary").default({}), // time per category
  topSites: jsonb("top_sites").default([]), // most visited sites
  aiInsights: jsonb("ai_insights"), // AI-generated insights
  goals: jsonb("goals").default([]),
  achievements: jsonb("achievements").default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Privacy settings for users
export const privacySettings = pgTable("privacy_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  allowTracking: boolean("allow_tracking").default(true),
  allowScreenshots: boolean("allow_screenshots").default(false),
  allowKeyLogging: boolean("allow_key_logging").default(false),
  shareWithManager: boolean("share_with_manager").default(true),
  shareProductivityScore: boolean("share_productivity_score").default(true),
  blurSensitiveContent: boolean("blur_sensitive_content").default(true),
  blockedDomains: jsonb("blocked_domains").default([]),
  notifyOnTracking: boolean("notify_on_tracking").default(true),
  pauseReasons: jsonb("pause_reasons").default([]), // History of pause reasons
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Tracking notifications log
export const trackingNotifications = pgTable("tracking_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  type: varchar("type").notNull(), // tracking_started, tracking_stopped, privacy_breach, etc.
  message: text("message").notNull(),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas for new tables
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertActivityTrackingSchema = createInsertSchema(activityTracking).omit({
  id: true,
  timestamp: true,
});

export const insertProductivityMetricSchema = createInsertSchema(productivityMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertPrivacySettingsSchema = createInsertSchema(privacySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackingNotificationSchema = createInsertSchema(trackingNotifications).omit({
  id: true,
  createdAt: true,
});

// Types for new tables
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type WorkSchedule = typeof workSchedules.$inferSelect;
export type ActivityTracking = typeof activityTracking.$inferSelect;
export type ProductivityMetric = typeof productivityMetrics.$inferSelect;
export type PrivacySettings = typeof privacySettings.$inferSelect;
export type TrackingNotification = typeof trackingNotifications.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type InsertActivityTracking = z.infer<typeof insertActivityTrackingSchema>;
export type InsertProductivityMetric = z.infer<typeof insertProductivityMetricSchema>;
export type InsertPrivacySettings = z.infer<typeof insertPrivacySettingsSchema>;
export type InsertTrackingNotification = z.infer<typeof insertTrackingNotificationSchema>;

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  workSchedules: many(workSchedules),
  activityTracking: many(activityTracking),
  productivityMetrics: many(productivityMetrics),
  privacySettings: one(privacySettings),
  trackingNotifications: many(trackingNotifications),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  workSchedules: many(workSchedules),
  activityTracking: many(activityTracking),
  productivityMetrics: many(productivityMetrics),
  trackingNotifications: many(trackingNotifications),
}));

// ========== OUTREACH ENGINE TABLES ==========

// Evidence Store table
export const evidence = pgTable("evidence", {
  evidence_id: varchar("evidence_id").primaryKey().default(sql`gen_random_uuid()`),
  prospect_id: varchar("prospect_id").notNull(),
  source: varchar("source").notNull(), // google_review, trustpilot, news, etc.
  url: text("url").notNull(),
  title: text("title").notNull(),
  snippet: text("snippet").notNull(),
  published_at: timestamp("published_at").notNull(),
  language: varchar("language").default("no"),
  authority: real("authority").default(0.5), // 0-1 authority score
  hash: varchar("hash").notNull().unique(), // For deduplication
  quotes: jsonb("quotes").default([]),
  raw_data: jsonb("raw_data").default({}),
  classification: jsonb("classification"), // Event classification data
  processed_at: timestamp("processed_at").default(sql`now()`),
  created_at: timestamp("created_at").notNull().default(sql`now()`)
});

// Prospects table
export const outreachProspects = pgTable("outreach_prospects", {
  prospect_id: varchar("prospect_id").primaryKey().default(sql`gen_random_uuid()`),
  company: text("company").notNull(),
  domain: text("domain").notNull(),
  contact_name: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  linkedin_url: text("linkedin_url"),
  industry: text("industry"),
  size: varchar("size"), // small, medium, large, enterprise
  location: text("location"),
  score: real("score").default(0), // Lead score 0-1
  status: varchar("status").default("active"), // active, paused, blacklisted
  tags: jsonb("tags").default([]),
  custom_fields: jsonb("custom_fields").default({}),
  last_contacted: timestamp("last_contacted"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_at: timestamp("updated_at").notNull().default(sql`now()`)
});

// Hooks (Engagement Opportunities) table
export const hooks = pgTable("hooks", {
  hook_id: varchar("hook_id").primaryKey().default(sql`gen_random_uuid()`),
  prospect_id: varchar("prospect_id").notNull().references(() => outreachProspects.prospect_id),
  hook_type: varchar("hook_type").notNull(), // review_win, award, product_launch, etc.
  headline: text("headline").notNull(),
  quote: text("quote"),
  evidence_refs: jsonb("evidence_refs").default([]), // Array of evidence IDs
  freshness_days: integer("freshness_days").notNull(),
  score: real("score").default(0), // Relevance score 0-1
  confidence: real("confidence").default(0.5),
  status: varchar("status").default("pending"), // pending, used, expired
  created_at: timestamp("created_at").notNull().default(sql`now()`)
});

// Campaigns table
export const outreachCampaigns = pgTable("outreach_campaigns", {
  campaign_id: varchar("campaign_id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: varchar("status").default("draft"), // draft, active, paused, completed
  type: varchar("type").default("outbound"), // outbound, nurture, re-engagement
  target_criteria: jsonb("target_criteria").default({}), // Filtering criteria for prospects
  channels: jsonb("channels").default([]), // ['email', 'sms', 'linkedin']
  schedule_config: jsonb("schedule_config").default({}),
  message_templates: jsonb("message_templates").default([]),
  ab_tests: jsonb("ab_tests").default([]),
  metrics: jsonb("metrics").default({}),
  budget: real("budget"),
  max_prospects: integer("max_prospects"),
  daily_limit: integer("daily_limit"),
  created_by: varchar("created_by"),
  started_at: timestamp("started_at"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_at: timestamp("updated_at").notNull().default(sql`now()`)
});

// Message Variants table
export const messageVariants = pgTable("message_variants", {
  variant_id: varchar("variant_id").primaryKey().default(sql`gen_random_uuid()`),
  campaign_id: varchar("campaign_id").references(() => outreachCampaigns.campaign_id),
  hook_id: varchar("hook_id").references(() => hooks.hook_id),
  channel: varchar("channel").notNull(), // email, sms, linkedin, slack, whatsapp
  variant_name: text("variant_name"),
  subject: text("subject"), // For email
  body_text: text("body_text").notNull(),
  body_html: text("body_html"), // For email
  language: varchar("language").default("no"),
  voice_profile: jsonb("voice_profile").default({}),
  personalization_tokens: jsonb("personalization_tokens").default([]),
  generator_meta: jsonb("generator_meta").default({}),
  test_group: varchar("test_group"), // A, B, C for A/B testing
  confidence: real("confidence").default(0.8),
  performance_metrics: jsonb("performance_metrics").default({}),
  created_at: timestamp("created_at").notNull().default(sql`now()`)
});

// Send Schedules table
export const sendSchedules = pgTable("send_schedules", {
  schedule_id: varchar("schedule_id").primaryKey().default(sql`gen_random_uuid()`),
  prospect_id: varchar("prospect_id").notNull().references(() => outreachProspects.prospect_id),
  campaign_id: varchar("campaign_id").notNull().references(() => outreachCampaigns.campaign_id),
  steps: jsonb("steps").notNull().default([]), // Array of send steps
  caps: jsonb("caps").default({}), // Send limits
  consent_ok: boolean("consent_ok").default(false),
  status: varchar("status").default("pending"), // pending, active, completed, cancelled
  started_at: timestamp("started_at"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").notNull().default(sql`now()`)
});

// Outreach Messages (Sent) table
export const outreachMessages = pgTable("outreach_messages", {
  message_id: varchar("message_id").primaryKey().default(sql`gen_random_uuid()`),
  campaign_id: varchar("campaign_id").references(() => outreachCampaigns.campaign_id),
  prospect_id: varchar("prospect_id").references(() => outreachProspects.prospect_id),
  variant_id: varchar("variant_id").references(() => messageVariants.variant_id),
  schedule_id: varchar("schedule_id").references(() => sendSchedules.schedule_id),
  channel: varchar("channel").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: varchar("status").default("queued"), // queued, sent, delivered, bounced, failed
  provider_id: text("provider_id"), // External provider message ID
  delivered_at: timestamp("delivered_at"),
  opened_at: timestamp("opened_at"),
  clicked_at: timestamp("clicked_at"),
  replied_at: timestamp("replied_at"),
  bounced_at: timestamp("bounced_at"),
  unsubscribed_at: timestamp("unsubscribed_at"),
  error_message: text("error_message"),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").notNull().default(sql`now()`)
});

// Insert schemas for outreach tables
export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  evidence_id: true,
  created_at: true,
  processed_at: true
});

export const insertOutreachProspectSchema = createInsertSchema(outreachProspects).omit({
  prospect_id: true,
  created_at: true,
  updated_at: true
});

export const insertHookSchema = createInsertSchema(hooks).omit({
  hook_id: true,
  created_at: true
});

export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).omit({
  campaign_id: true,
  created_at: true,
  updated_at: true
});

export const insertMessageVariantSchema = createInsertSchema(messageVariants).omit({
  variant_id: true,
  created_at: true
});

export const insertSendScheduleSchema = createInsertSchema(sendSchedules).omit({
  schedule_id: true,
  created_at: true
});

export const insertOutreachMessageSchema = createInsertSchema(outreachMessages).omit({
  message_id: true,
  created_at: true
});

// Types for outreach tables
export type Evidence = typeof evidence.$inferSelect;
export type OutreachProspect = typeof outreachProspects.$inferSelect;
export type Hook = typeof hooks.$inferSelect;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type MessageVariant = typeof messageVariants.$inferSelect;
export type SendSchedule = typeof sendSchedules.$inferSelect;
export type OutreachMessage = typeof outreachMessages.$inferSelect;

export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type InsertOutreachProspect = z.infer<typeof insertOutreachProspectSchema>;
export type InsertHook = z.infer<typeof insertHookSchema>;
export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;
export type InsertMessageVariant = z.infer<typeof insertMessageVariantSchema>;
export type InsertSendSchedule = z.infer<typeof insertSendScheduleSchema>;
export type InsertOutreachMessage = z.infer<typeof insertOutreachMessageSchema>;
