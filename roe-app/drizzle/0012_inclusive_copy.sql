-- Inclusive copy pass on the seeded directory (descriptions are user-visible
-- in the suggest typeahead). Idempotent plain UPDATE; safe to re-run.
UPDATE groups SET description = 'Administration · fliers, announcements and community publications' WHERE id = '8bc3d018-1af8-40df-bef8-d06f3872bdb6';
