import { z } from "zod"

// 3-40 chars, lowercase letters, digits and hyphens, no hyphen at the edges
export const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/

// Path segments the app already uses (or will use) at the root
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "b",
  "login",
  "painel",
  "platform",
  "convite",
  "bookings",
  "profile",
  "privacy-policy",
  "services",
  "employees",
  "_next",
  "static",
  "www",
  "app",
] as const

export const isReservedSlug = (slug: string) =>
  (RESERVED_SLUGS as readonly string[]).includes(slug)

export const slugSchema = z
  .string()
  .trim()
  .min(3, "O endereço deve ter pelo menos 3 caracteres.")
  .max(40, "O endereço deve ter no máximo 40 caracteres.")
  .regex(
    SLUG_REGEX,
    "Use apenas letras minúsculas, números e hífens, sem hífen no início ou no fim.",
  )
  .refine((slug) => !isReservedSlug(slug), {
    message: "Este endereço é reservado. Escolha outro.",
  })
