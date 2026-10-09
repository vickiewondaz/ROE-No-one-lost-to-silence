import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: { environment: "node", include: ["lib/__tests__/**/*.test.ts"] },
  resolve: { alias: { "@": join(root) } },
});
