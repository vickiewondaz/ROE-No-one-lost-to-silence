-- ROE pilot seed (idempotent via fixed UUIDs + ON CONFLICT DO NOTHING).
-- Run AFTER table migration (0000) and BEFORE/AFTER RLS (0001): psql $DATABASE_URL -f drizzle/seed.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO organisations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Grace Fellowship (Pilot)', 'grace-pilot')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin@grace-pilot.test', 'Pilot Admin'),
  ('33333333-3333-3333-3333-333333333333', 'worker@grace-pilot.test', 'Follow-up Worker')
ON CONFLICT (id) DO NOTHING;

INSERT INTO memberships (id, user_id, org_id, role, status) VALUES
  ('a1a1a1a1-0000-4000-8000-000000000001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin', 'active'),
  ('a1a1a1a1-0000-4000-8000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'worker', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO groups (id, org_id, name, description) VALUES
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Young Adults', 'Fridays 6pm')
ON CONFLICT (id) DO NOTHING;

-- Verify: SELECT count(*) FROM people; (expect 0 until app writes)
-- Negative test OrgB fixture (run manually, expect 0 rows under OrgA context):
-- INSERT INTO people (org_id, first_name, phone, channel) VALUES ('99999999-9999-9999-9999-999999999999','Intruder','+000','Call');
