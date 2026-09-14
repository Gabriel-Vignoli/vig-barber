import { z } from "zod"

export const phoneFormSchema = z.object({
  phone: z
    .string()
    .min(10, "Informe um telefone válido com DDD.")
    .max(15, "Telefone inválido.")
    .regex(/^[\d\s()+-]+$/, "Use apenas números e símbolos de telefone."),
})

export type PhoneFormValues = z.infer<typeof phoneFormSchema>
