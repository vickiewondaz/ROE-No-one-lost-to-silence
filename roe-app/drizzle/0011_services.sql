-- Service days directory (admin-managed, per org).
-- kind weekly: weekday 0 (Sun)–6 (Sat), repeats every week.
-- kind special: date YYYY-MM-DD, one-off (Easter, vigil, carol night…).
-- Owner-connection only (same posture as invitations/join_requests).
CREATE TABLE "services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL,
  "name" text NOT NULL,
  "kind" text DEFAULT 'weekly' NOT NULL,
  "weekday" integer,
  "date" text,
  "time" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
