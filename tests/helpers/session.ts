import { getServerSession } from "next-auth"
import { vi } from "vitest"

// next-auth is mocked in tests/setup.ts. null = signed out.
export const mockSession = (userId: string | null) => {
  vi.mocked(getServerSession).mockResolvedValue(
    userId
      ? {
          user: { id: userId },
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      : null,
  )
}
