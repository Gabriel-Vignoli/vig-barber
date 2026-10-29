import { afterAll, beforeEach, vi } from "vitest"
import { mockSession } from "./helpers/session"

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  // Mimics the real cache's JSON round trip (Dates become strings), so callers
  // that forget to rehydrate fail in tests too
  unstable_cache:
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    async (...args: A) => {
      const result = await fn(...args)
      return result === undefined ? result : JSON.parse(JSON.stringify(result))
    },
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}))

vi.mock("next/navigation", async () => {
  const { NotFoundError, RedirectError } = await import("./helpers/navigation")
  return {
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url)
    }),
    permanentRedirect: vi.fn((url: string) => {
      throw new RedirectError(url)
    }),
    notFound: vi.fn(() => {
      throw new NotFoundError()
    }),
  }
})

beforeEach(async () => {
  vi.clearAllMocks()
  mockSession(null)
  // Imported lazily so tests/env.ts has already set DATABASE_URL
  const { resetDatabase } = await import("./helpers/factories")
  await resetDatabase()
})

afterAll(async () => {
  const { prisma } = await import("@/app/_lib/prisma")
  await prisma.$disconnect()
})
