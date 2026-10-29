import { execSync } from "node:child_process"
import { mkdirSync, rmSync } from "node:fs"
import { createServer } from "node:net"
import path from "node:path"
import EmbeddedPostgres from "embedded-postgres"
import type { TestProject } from "vitest/node"

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string
  }
}

const ROOT = path.resolve(import.meta.dirname, "..")
const BASE_DIR = path.join(ROOT, ".tmp", "test-pg")
const USER = "postgres"
const PASSWORD = "postgres"
const DATABASE = "vig_barber_test"

const getFreePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        reject(new Error("Could not get a free port"))
        return
      }
      server.close(() => resolve(address.port))
    })
  })

// Starts a throwaway local Postgres, applies the migrations and hands the URL
// to the test workers. Nothing here ever touches the remote (Supabase) database.
export default async function setup(project: TestProject) {
  // Leftovers from a crashed run
  rmSync(BASE_DIR, { recursive: true, force: true })
  const databaseDir = path.join(BASE_DIR, String(Date.now()))
  mkdirSync(BASE_DIR, { recursive: true })

  const port = await getFreePort()
  const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user: USER,
    password: PASSWORD,
    persistent: false,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: (error) => console.error("[embedded-postgres]", error),
  })

  await pg.initialise()
  await pg.start()
  await pg.createDatabase(DATABASE)

  const databaseUrl = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${port}/${DATABASE}`

  execSync("npx prisma migrate deploy", {
    cwd: ROOT,
    stdio: "pipe",
    // DIRECT_URL is what prisma.config.ts gives the CLI; dotenv never
    // overrides variables that are already set
    env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl },
  })

  project.provide("databaseUrl", databaseUrl)

  return async () => {
    await pg.stop()
    rmSync(BASE_DIR, { recursive: true, force: true })
  }
}
