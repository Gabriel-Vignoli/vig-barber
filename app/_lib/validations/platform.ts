import { z } from "zod"
import { slugSchema } from "./slug"

export const memberRoleSchema = z.enum(["ADMIN", "ATENDENTE", "EMPLOYEE"], {
  message: "Selecione um papel.",
})

// Invitations are matched case-insensitively, so store them lowercased
export const invitationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Email inválido."))

export const createShopSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
  slug: slugSchema,
  address: z.string().trim().min(5, "Informe o endereço completo."),
  city: z.string().trim().min(2, "Informe a cidade."),
  phone: z.union([
    z.string().trim().min(8, "Telefone inválido."),
    z.literal(""),
  ]),
  ownerEmail: invitationEmailSchema,
})

export type CreateShopFormValues = z.infer<typeof createShopSchema>

export const inviteMemberSchema = z.object({
  email: invitationEmailSchema,
  role: memberRoleSchema,
})

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>
