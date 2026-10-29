import { defineConfig } from "vitest/config"

export default defineConfig({
  // Resolves the "@/*" alias from tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // env.ts must run first: it points DATABASE_URL at the test database
    // before anything imports the Prisma singleton
    setupFiles: ["tests/env.ts", "tests/setup.ts"],
    // One shared database, truncated between tests
    fileParallelism: false,
    hookTimeout: 30_000,
  },
})
