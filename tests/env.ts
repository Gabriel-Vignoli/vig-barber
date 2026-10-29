import { inject } from "vitest"

const databaseUrl = inject("databaseUrl")

// Safety net: tests truncate tables, so they must never run against a remote DB
if (!/@(127\.0\.0\.1|localhost):\d+\//.test(databaseUrl)) {
  throw new Error(`Refusing to run tests against a non-local database`)
}

process.env.DATABASE_URL = databaseUrl
process.env.DIRECT_URL = databaseUrl
