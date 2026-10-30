import { z } from "zod"
import { passwordSchema } from "./auth"

export const createAtendenteSchema = z.object({
  // Name and password only apply when the email has no account yet. An
  // existing user is attached to the shop and keeps their own.
  name: z
    .union([
      z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
      z.literal(""),
    ])
    .optional(),
  email: z.email("Email inválido."),
  password: z.union([passwordSchema, z.literal("")]).optional(),
})

export type CreateAtendenteFormValues = z.infer<typeof createAtendenteSchema>
