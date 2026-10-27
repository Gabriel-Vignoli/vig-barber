import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // The CLI (migrations) goes through the session-mode pooler
  datasource: {
    url: env("DIRECT_URL"),
  },
})
