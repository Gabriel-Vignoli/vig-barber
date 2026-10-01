import { z } from "zod"
import { passwordSchema } from "./auth"

export const createAtendenteSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.email("Email inválido."),
  password: passwordSchema,
})

export type CreateAtendenteFormValues = z.infer<typeof createAtendenteSchema>
