import { bigint, customType, datetime, decimal, int, mediumtext, mysqlTable, primaryKey, text, tinyint, varchar, char } from "drizzle-orm/mysql-core";

/** Drizzle mapping of migrations/*.sql. Change both together. */

const id = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();
const fk = (name: string) => bigint(name, { mode: "number", unsigned: true });
const dt = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const longblob = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "longblob" });

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 10 }).notNull().default("user"),
  emailVerifiedAt: dt("email_verified_at"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"),
  billingCycle: varchar("billing_cycle", { length: 10 }),
  planStatus: varchar("plan_status", { length: 20 }).notNull().default("active"),
  planRenewsAt: dt("plan_renews_at"),
  paddleCustomerId: varchar("paddle_customer_id", { length: 64 }),
  paddleSubscriptionId: varchar("paddle_subscription_id", { length: 64 }),
  suspendedAt: dt("suspended_at"),
  emailWeekly: tinyint("email_weekly").notNull().default(1),
  emailAlerts: tinyint("email_alerts").notNull().default(1),
  emailRuns: tinyint("email_runs").notNull().default(1),
  lastDigestAt: dt("last_digest_at"),
  lastLoginAt: dt("last_login_at"),
  createdAt: dt("created_at").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: char("id", { length: 64 }).primaryKey(),
  userId: fk("user_id").notNull(),
  expiresAt: dt("expires_at").notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: dt("created_at").notNull(),
});

export const authTokens = mysqlTable("auth_tokens", {
  id: char("id", { length: 64 }).primaryKey(),
  userId: fk("user_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull(),
  expiresAt: dt("expires_at").notNull(),
  usedAt: dt("used_at"),
  createdAt: dt("created_at").notNull(),
});

export const projects = mysqlTable("projects", {
  id: id(),
  userId: fk("user_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  country: varchar("country", { length: 80 }).notNull().default("United States"),
  language: varchar("language", { length: 40 }).notNull().default("English"),
  competitors: text("competitors"),
  autoAudit: varchar("auto_audit", { length: 10 }).notNull().default("monthly"),
  rankFrequency: varchar("rank_frequency", { length: 10 }).notNull().default("weekly"),
  lastScore: int("last_score"),
  lastAuditAt: dt("last_audit_at"),
  nextAuditAt: dt("next_audit_at"),
  createdAt: dt("created_at").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export const runs = mysqlTable("runs", {
  id: varchar("id", { length: 100 }).primaryKey(),
  userId: fk("user_id").notNull(),
  projectId: fk("project_id"),
  kind: varchar("kind", { length: 10 }).notNull(),
  triggerType: varchar("trigger_type", { length: 10 }).notNull().default("manual"),
  status: varchar("status", { length: 12 }).notNull().default("queued"),
  title: varchar("title", { length: 300 }).notNull().default(""),
  input: text("input").notNull(),
  summary: mediumtext("summary"),
  score: int("score"),
  costUsd: decimal("cost_usd", { precision: 10, scale: 4, mode: "number" }),
  turns: int("turns"),
  error: text("error"),
  worker: varchar("worker", { length: 64 }),
  heartbeatAt: dt("heartbeat_at"),
  createdAt: dt("created_at").notNull(),
  startedAt: dt("started_at"),
  finishedAt: dt("finished_at"),
});

export const keywords = mysqlTable("keywords", {
  id: id(),
  userId: fk("user_id").notNull(),
  projectId: fk("project_id").notNull(),
  keyword: varchar("keyword", { length: 200 }).notNull(),
  targetUrl: varchar("target_url", { length: 500 }),
  position: int("position"),
  previousPosition: int("previous_position"),
  bestPosition: int("best_position"),
  rankingUrl: varchar("ranking_url", { length: 500 }),
  lastCheckedAt: dt("last_checked_at"),
  nextCheckAt: dt("next_check_at"),
  createdAt: dt("created_at").notNull(),
});

export const rankChecks = mysqlTable("rank_checks", {
  id: id(),
  keywordId: fk("keyword_id").notNull(),
  position: int("position"),
  url: varchar("url", { length: 500 }),
  topResults: mediumtext("top_results"),
  source: varchar("source", { length: 20 }).notNull(),
  costUsd: decimal("cost_usd", { precision: 10, scale: 5, mode: "number" }),
  checkedAt: dt("checked_at").notNull(),
});

export const posts = mysqlTable("posts", {
  id: id(),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  excerpt: varchar("excerpt", { length: 400 }).notNull().default(""),
  content: mediumtext("content").notNull(),
  coverImage: varchar("cover_image", { length: 500 }),
  metaTitle: varchar("meta_title", { length: 200 }),
  metaDescription: varchar("meta_description", { length: 300 }),
  focusKeyword: varchar("focus_keyword", { length: 120 }),
  tags: varchar("tags", { length: 300 }),
  authorName: varchar("author_name", { length: 120 }).notNull().default("SEOKaroAI Team"),
  status: varchar("status", { length: 12 }).notNull().default("draft"),
  publishedAt: dt("published_at"),
  createdAt: dt("created_at").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export const billingEvents = mysqlTable("billing_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  occurredAt: dt("occurred_at"),
  payload: mediumtext("payload").notNull(),
  processedAt: dt("processed_at"),
  error: text("error"),
  createdAt: dt("created_at").notNull(),
});

export const emailLog = mysqlTable("email_log", {
  id: id(),
  userId: fk("user_id"),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  status: varchar("status", { length: 12 }).notNull(),
  error: text("error"),
  createdAt: dt("created_at").notNull(),
});

export const contactMessages = mysqlTable("contact_messages", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 160 }),
  message: text("message").notNull(),
  handledAt: dt("handled_at"),
  createdAt: dt("created_at").notNull(),
});

export const adminLog = mysqlTable("admin_log", {
  id: id(),
  adminId: fk("admin_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  target: varchar("target", { length: 200 }).notNull().default(""),
  detail: text("detail"),
  createdAt: dt("created_at").notNull(),
});

export const appKv = mysqlTable("app_kv", {
  k: varchar("k", { length: 64 }).primaryKey(),
  v: text("v").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Keyword = typeof keywords.$inferSelect;
export type Post = typeof posts.$inferSelect;

export const connectors = mysqlTable("connectors", {
  id: id(),
  userId: fk("user_id").notNull(),
  projectId: fk("project_id").notNull(),
  kind: varchar("kind", { length: 12 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  config: text("config").notNull(),
  secret: text("secret"),
  status: varchar("status", { length: 12 }).notNull().default("untested"),
  lastError: text("last_error"),
  lastTestedAt: dt("last_tested_at"),
  createdAt: dt("created_at").notNull(),
});

export const fixChanges = mysqlTable("fix_changes", {
  id: id(),
  runId: varchar("run_id", { length: 100 }).notNull(),
  connectorId: fk("connector_id"),
  resourceType: varchar("resource_type", { length: 20 }).notNull(),
  resourceId: varchar("resource_id", { length: 300 }).notNull(),
  resourceLabel: varchar("resource_label", { length: 300 }).notNull().default(""),
  field: varchar("field", { length: 60 }).notNull(),
  oldValue: mediumtext("old_value"),
  newValue: mediumtext("new_value"),
  reason: text("reason"),
  severity: varchar("severity", { length: 12 }).notNull().default("Medium"),
  status: varchar("status", { length: 12 }).notNull().default("proposed"),
  error: text("error"),
  appliedAt: dt("applied_at"),
  createdAt: dt("created_at").notNull(),
});

export const runFiles = mysqlTable(
  "run_files",
  {
    runId: varchar("run_id", { length: 100 }).notNull(),
    path: varchar("path", { length: 255 }).notNull(),
    content: longblob("content").notNull(),
    size: int("size", { unsigned: true }).notNull().default(0),
    updatedAt: dt("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.runId, t.path] })],
);

export const userAddons = mysqlTable("user_addons", {
  id: id(),
  userId: fk("user_id").notNull(),
  addonCode: varchar("addon_code", { length: 40 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  paddleSubscriptionId: varchar("paddle_subscription_id", { length: 64 }),
  renewsAt: dt("renews_at"),
  createdAt: dt("created_at").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export const outreachItems = mysqlTable("outreach_items", {
  id: id(),
  userId: fk("user_id").notNull(),
  projectId: fk("project_id").notNull(),
  platform: varchar("platform", { length: 16 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  url: varchar("url", { length: 700 }).notNull(),
  community: varchar("community", { length: 140 }).notNull().default(""),
  snippet: text("snippet"),
  draftReply: mediumtext("draft_reply"),
  status: varchar("status", { length: 16 }).notNull().default("found"),
  postedUrl: varchar("posted_url", { length: 700 }),
  createdAt: dt("created_at").notNull(),
  updatedAt: dt("updated_at").notNull(),
});

export type Connector = typeof connectors.$inferSelect;
export type FixChange = typeof fixChanges.$inferSelect;
export type RunFile = typeof runFiles.$inferSelect;
export type UserAddon = typeof userAddons.$inferSelect;
export type OutreachItem = typeof outreachItems.$inferSelect;
