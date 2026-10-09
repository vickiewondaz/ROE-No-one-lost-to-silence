CREATE TABLE "group_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_leads" ADD CONSTRAINT "group_leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_leads" ADD CONSTRAINT "group_leads_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Lead mappings: owner-connection only until UI matures (same posture as auth tables).
ALTER TABLE "group_leads" ENABLE ROW LEVEL SECURITY;
