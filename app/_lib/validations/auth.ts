import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(6, "A senha deve ter pelo menos 6 caracteres.")
  .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula.")
  .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula.")
  .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
  .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um símbolo.")

export const loginSchema = z.object({
  email: z.email("Email inválido.").min(1, "O email é obrigatório."),
  password: z.string().min(1, "A senha é obrigatória."),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const signUpSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.email("Email inválido.").min(1, "O email é obrigatório."),
  password: passwordSchema,
})

export const signUpFormSchema = signUpSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirme sua senha."),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.acceptTerms === true, {
    message: "Você precisa aceitar a política de privacidade.",
    path: ["acceptTerms"],
  })

export type SignUpFormValues = z.infer<typeof signUpFormSchema>
