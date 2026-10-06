import { z } from "zod"

// http(s) only, so values rendered in href/src can't be javascript: URLs
const httpUrl = (message: string) => z.url({ protocol: /^https?$/, message })

export const updateBarbershopSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
  description: z.string().trim().min(1, "Informe a descrição."),
  address: z.string().trim().min(5, "Informe o endereço completo."),
  imageUrl: httpUrl("Informe uma URL de imagem válida (http ou https)."),
  instagramUrl: z.union([
    httpUrl("Informe uma URL válida (http ou https)."),
    z.literal(""),
  ]),
  phones: z
    .array(z.string().trim().min(8, "Telefone inválido."))
    .min(1, "Informe pelo menos um telefone.")
    .max(5, "Máximo de 5 telefones."),
})

export type UpdateBarbershopFormValues = z.infer<typeof updateBarbershopSchema>
