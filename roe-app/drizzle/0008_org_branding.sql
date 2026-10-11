-- Org branding for dashboards + join experience (phone-first, WhatsApp contact).
-- Idempotent: safe to re-run via neon-migrate (IF NOT EXISTS / DROP NOT NULL tolerant).
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "logo_url" text;
--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "whatsapp" text;
--> statement-breakpoint
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "welcome_message" text;
--> statement-breakpoint
-- Join requests: email becomes optional (phone-first). Keep existing rows.
ALTER TABLE "join_requests" ALTER COLUMN "email" DROP NOT NULL;
