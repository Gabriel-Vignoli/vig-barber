import { z } from "zod"
import { passwordSchema } from "./auth"

export const createEmployeeSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.email("Email inválido."),
  password: passwordSchema,
  bio: z.string().optional(),
  imageUrl: z
    .union([z.url("URL da imagem inválida."), z.literal("")])
    .optional(),
  phone: z.string().optional(),
})

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>

export const updateEmployeeSchema = z.object({
  bio: z.string().optional(),
  imageUrl: z
    .union([z.url("URL da imagem inválida."), z.literal("")])
    .optional(),
  phone: z.string().optional(),
})

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>
