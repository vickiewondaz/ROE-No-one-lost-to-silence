// Postgres-uuid validation (matches the DB, not just RFC-4122 variants).
// Seed fixture ids (e.g. all-4s) are legal Postgres uuids but fail zod .uuid().
import { z } from "zod";

export const dbUuid = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid id."
  );
