-- ROE pilot seed (idempotent via fixed UUIDs + ON CONFLICT DO NOTHING).
-- Run AFTER table migration (0000) and BEFORE/AFTER RLS (0001): psql $DATABASE_URL -f drizzle/seed.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO organisations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Grace Fellowship (Pilot)', 'grace-pilot')
ON CONFLICT (id) DO NOTHING;

-- NOTE (pilot hygiene): users/memberships are created via /api/setup (first
-- admin) and invites afterwards — never seeded, so the team list stays real.
-- Placeholder accounts were removed after the Better Auth migration.

INSERT INTO groups (id, org_id, name, description) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Young Adults', 'Fridays 6pm')
ON CONFLICT (id) DO NOTHING;

-- Verify: SELECT count(*) FROM people; (expect 0 until app writes)
-- Negative test OrgB fixture (run manually, expect 0 rows under OrgA context):
-- INSERT INTO people (org_id, first_name, phone, channel) VALUES ('99999999-9999-9999-9999-999999999999','Intruder','+000','Call');
