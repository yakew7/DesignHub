import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["lib/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    environment: "node",
    setupFiles: ["./lib/i18n/test-setup.ts"],
  },
});
