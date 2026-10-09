// TRD §16 — Drizzle schema (Postgres). Every tenant row carries org_id.
// RLS policies live in drizzle/0001_init.sql; this file is app-level types.
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "admin",
  "worker",
  "group_leader",
  "member",
  "care",
  "senior",
]);
export const channelEnum = pgEnum("channel", [
  "Call",
  "WhatsApp",
  "Visit",
  "Other",
]);
export const actionStatusEnum = pgEnum("action_status", [
  "Open",
  "In Progress",
  "Completed",
  "Paused",
]);
export const connStatusEnum = pgEnum("conn_status", [
  "Suggested",
  "Introduced",
  "ParticipationRecorded",
  "Confirmed",
]);

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  // Better Auth core columns (drizzleAdapter maps this table as `user`)
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Better Auth core tables (managed sessions; RLS: owner-connection only, never client)
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  orgId: uuid("org_id").notNull(),
  role: roleEnum("role").notNull(),
  status: text("status").notNull().default("active"),
});

export const people = pgTable("people", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  // Link to login account for member self-service (PRD §20). Null until claimed.
  userId: uuid("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").default(""),
  phone: text("phone").notNull(),
  channel: channelEnum("channel").notNull(),
  interests: text("interests"),
  howConnected: text("how_connected"),
  sensitivity: text("sensitivity").notNull().default("personal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personId: uuid("person_id").notNull(),
  type: text("type").notNull().default("contact"),
  granted: boolean("granted").notNull(),
  at: timestamp("at").defaultNow().notNull(),
  byUser: uuid("by_user"),
});

export const communicationPreferences = pgTable(
  "communication_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    personId: uuid("person_id").notNull(),
    channel: channelEnum("channel").notNull(),
    optIn: boolean("opt_in").notNull().default(true),
  }
);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

export const groupMemberships = pgTable("group_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personId: uuid("person_id").notNull(),
  groupId: uuid("group_id").notNull(),
  role: text("role").default("member"),
  status: text("status").default("active"),
});

export const actions = pgTable("actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personId: uuid("person_id").notNull(),
  type: text("type").notNull(),
  assignee: uuid("assignee").notNull(),
  creator: uuid("creator"),
  dueAt: timestamp("due_at").notNull(),
  status: actionStatusEnum("status").notNull().default("Open"),
  outcome: text("outcome"),
});

export const assignmentHistory = pgTable("assignment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  actionId: uuid("action_id").notNull(),
  fromUser: uuid("from_user"),
  toUser: uuid("to_user").notNull(),
  at: timestamp("at").defaultNow().notNull(),
  reason: text("reason"),
});

export const interactions = pgTable("interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personId: uuid("person_id").notNull(),
  actionId: uuid("action_id"),
  date: timestamp("date").defaultNow().notNull(),
  channel: channelEnum("channel").notNull(),
  outcome: text("outcome").notNull(),
  notes: text("notes"),
});

export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  personId: uuid("person_id").notNull(),
  groupId: uuid("group_id").notNull(),
  status: connStatusEnum("status").notNull().default("Suggested"),
  outcome: text("outcome"),
  at: timestamp("at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  userId: uuid("user_id").notNull(),
  type: text("type").notNull(),
  refId: uuid("ref_id"),
  readAt: timestamp("read_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id"),
  actor: uuid("actor"),
  op: text("op").notNull(),
  ref: text("ref"),
  allowed: boolean("allowed").notNull(),
  at: timestamp("at").defaultNow().notNull(),
});
