// TRD §19 — RLS migration. Apply with psql / drizzle-kit migrate.
// Service-role key never reaches the browser. App sets app.org_id +
// app.user_id per transaction from the server session (never client input).

-- Enable RLS on all tenant tables
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation pattern (repeat per table with org_id)
-- People
DROP POLICY IF EXISTS tenant_isolation ON people;
CREATE POLICY tenant_isolation ON people
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);
-- Restricted care rows: workers/group_leaders see nothing
DROP POLICY IF EXISTS restricted_deny ON people;
CREATE POLICY restricted_deny ON people
  AS RESTRICTIVE
  FOR ALL
  TO PUBLIC
  USING (sensitivity IS DISTINCT FROM 'restricted' OR current_setting('app.role', true) IN ('care','admin'));

-- Actions / interactions / connections / notifications / audit: same tenant USING
DROP POLICY IF EXISTS tenant_isolation ON actions;
CREATE POLICY tenant_isolation ON actions FOR ALL USING (org_id = current_setting('app.org_id', true)::uuid);
DROP POLICY IF EXISTS tenant_isolation ON interactions;
CREATE POLICY tenant_isolation ON interactions FOR ALL USING (org_id = current_setting('app.org_id', true)::uuid);
DROP POLICY IF EXISTS tenant_isolation ON connections;
CREATE POLICY tenant_isolation ON connections FOR ALL USING (org_id = current_setting('app.org_id', true)::uuid);
DROP POLICY IF EXISTS tenant_isolation ON notifications;
CREATE POLICY tenant_isolation ON notifications FOR ALL USING (org_id = current_setting('app.org_id', true)::uuid);
DROP POLICY IF EXISTS tenant_isolation ON audit_logs;
CREATE POLICY tenant_isolation ON audit_logs FOR ALL USING (org_id = current_setting('app.org_id', true)::uuid);

-- Negative-test checklist (TRD §11, must all deny / return 0 rows):
-- 1. OrgA session reads OrgB person id directly
-- 2. Forged org_id in request body (ignored server-side)
-- 3. Group leader selects restricted sensitivity row
-- 4. AI tool call without session context
