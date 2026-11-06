import { prisma } from "./prisma"

// Prisma sends an insensitive equals as ILIKE without escaping, so "_" and "%"
// in an email act as wildcards ("a_b@x.com" would match "axb@x.com"). Use this
// for every case-insensitive email comparison. Backslash is Postgres' default
// LIKE escape.
export const emailEquals = (email: string) => ({
  equals: email.trim().replace(/[\\%_]/g, (char) => `\\${char}`),
  mode: "insensitive" as const,
})

// For login and password reset: accounts keep the email as it was typed, so a
// different case must still find them. The exact match comes first because
// old accounts may differ only by case.
export const findAccountByEmail = async (email: string) =>
  (await prisma.user.findUnique({ where: { email } })) ??
  prisma.user.findFirst({ where: { email: emailEquals(email) } })
