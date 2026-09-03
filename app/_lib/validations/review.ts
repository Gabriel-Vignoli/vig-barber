import { z } from "zod"

export const reviewFormSchema = z.object({
  rating: z.number().min(1, "Selecione uma nota.").max(5, "A nota máxima é 5."),
  comment: z
    .string()
    .max(500, "O comentário deve ter no máximo 500 caracteres.")
    .optional(),
})

export type ReviewFormValues = z.infer<typeof reviewFormSchema>
