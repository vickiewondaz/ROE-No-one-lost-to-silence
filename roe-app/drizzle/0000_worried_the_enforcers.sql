CREATE TYPE "public"."action_status" AS ENUM('Open', 'In Progress', 'Completed', 'Paused');--> statement-breakpoint
CREATE TYPE "public"."channel" AS ENUM('Call', 'WhatsApp', 'Visit', 'Other');--> statement-breakpoint
CREATE TYPE "public"."conn_status" AS ENUM('Suggested', 'Introduced', 'ParticipationRecorded', 'Confirmed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'worker', 'group_leader', 'member', 'care', 'senior');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text NOT NULL,
	"assignee" uuid NOT NULL,
	"creator" uuid,
	"due_at" timestamp NOT NULL,
	"status" "action_status" DEFAULT 'Open' NOT NULL,
	"outcome" text
);
--> statement-breakpoint
CREATE TABLE "assignment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_id" uuid NOT NULL,
	"from_user" uuid,
	"to_user" uuid NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"actor" uuid,
	"op" text NOT NULL,
	"ref" text,
	"allowed" boolean NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"opt_in" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"status" "conn_status" DEFAULT 'Suggested' NOT NULL,
	"outcome" text,
	"at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text DEFAULT 'contact' NOT NULL,
	"granted" boolean NOT NULL,
	"at" timestamp DEFAULT now() NOT NULL,
	"by_user" uuid
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"role" text DEFAULT 'member',
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"action_id" uuid,
	"date" timestamp DEFAULT now() NOT NULL,
	"channel" "channel" NOT NULL,
	"outcome" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"status" text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"ref_id" uuid,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text DEFAULT '',
	"phone" text NOT NULL,
	"channel" "channel" NOT NULL,
	"interests" text,
	"how_connected" text,
	"sensitivity" text DEFAULT 'personal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
