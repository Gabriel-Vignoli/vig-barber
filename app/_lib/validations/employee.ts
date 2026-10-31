import { z } from "zod"
import { passwordSchema } from "./auth"

export const createEmployeeSchema = z.object({
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
  bio: z.string().optional(),
  imageUrl: z
    .union([z.url("URL da imagem inválida."), z.literal("")])
    .optional(),
  phone: z.string().optional(),
})

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>

// Employee profile fields only. The account (name, password) is global and
// never edited by a shop: staff use "Esqueci minha senha" on the login.
export const updateEmployeeSchema = z.object({
  bio: z.string().optional(),
  imageUrl: z
    .union([z.url("URL da imagem inválida."), z.literal("")])
    .optional(),
  phone: z.string().optional(),
})

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>

// The service ids picked in the "Serviços" dialog. Ownership (every id is a
// service of this shop) is checked in the action.
export const employeeServiceIdsSchema = z
  .array(z.string().min(1, "Serviço inválido."), "Serviços inválidos.")
  .max(100, "Serviços demais.")
