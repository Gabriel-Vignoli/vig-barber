import { vi } from "vitest"
import { resend } from "@/app/_lib/resend"

// resend is mocked in tests/setup.ts
export const sendEmailMock = () => vi.mocked(resend.emails.send)

type SentEmail = { to: string; subject: string; html: string }

export const getSentEmails = () =>
  sendEmailMock().mock.calls.map(([payload]) => payload as SentEmail)

// The token in the /convite/<token> link of the last email sent
export const getLastInvitationToken = () => {
  const emails = getSentEmails()
  const last = emails[emails.length - 1]
  const match = last?.html.match(/\/convite\/([A-Za-z0-9_-]+)/)

  if (!match) throw new Error("No invitation email was sent")

  return match[1]
}

// Makes the next email fail the way the Resend SDK does (it returns an error
// instead of throwing)
export const failNextEmail = () => {
  sendEmailMock().mockResolvedValueOnce({
    data: null,
    error: { name: "application_error", message: "Falhou" },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}
