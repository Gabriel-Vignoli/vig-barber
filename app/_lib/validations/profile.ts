import { z } from "zod"
import { passwordSchema } from "./auth"

export const updateNameSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
})

export type UpdateNameFormValues = z.infer<typeof updateNameSchema>

export const updatePasswordFormSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmNewPassword"],
  })

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>
