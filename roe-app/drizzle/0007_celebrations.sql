CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"type" text NOT NULL,
	"month" text NOT NULL,
	"day" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Milestones: owner-connection only until scoped UI matures (same posture as auth tables).
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
