-- Keyword pass on seeded group descriptions (typeahead + interest matching).
-- Idempotent plain UPDATEs; safe to re-run.
UPDATE groups SET description = 'Worship & production · music, praise, worship and ministration in song' WHERE id = 'f0130677-0463-40d9-91a1-5fc86dd7ea73';
--> statement-breakpoint
UPDATE groups SET description = 'Worship & production · music instruments: keyboard, drums, guitar and all instruments' WHERE id = '129fd660-4a9d-44b6-9fa0-32f004a832d4';
