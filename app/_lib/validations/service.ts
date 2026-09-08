import { z } from "zod"

export const serviceFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  description: z
    .string()
    .min(5, "A descrição deve ter pelo menos 5 caracteres."),
  price: z.coerce.number().positive("O preço deve ser maior que zero."),
  durationInMinutes: z.coerce
    .number()
    .int()
    .positive("A duração deve ser maior que zero."),
  imageUrl: z.url("URL da imagem inválida."),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
