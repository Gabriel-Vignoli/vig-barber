import { z } from "zod"
import { passwordSchema } from "../_lib/validations/auth"

export const requestResetCodeSchema = z.object({
  email: z.string().email("Email inválido.").min(1, "O email é obrigatório."),
})

export type RequestResetCodeFormValues = z.infer<typeof requestResetCodeSchema>

export const resetPasswordSchema = z
  .object({
    email: z.email("Email inválido."),
    code: z
      .string()
      .length(6, "O código deve ter 6 dígitos.")
      .regex(/^\d+$/, "O código deve conter apenas números."),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmNewPassword"],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
