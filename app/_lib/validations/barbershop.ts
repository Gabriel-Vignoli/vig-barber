import { z } from "zod"

// http(s) only, so values rendered in href/src can't be javascript: URLs
const httpUrl = (message: string) => z.url({ protocol: /^https?$/, message })

// Shop images go through next/image, which only loads the hosts allowed in
// next.config.ts (keep both lists in sync)
const IMAGE_HOSTNAME = /^(utfs\.io|images\.unsplash\.com|[a-z0-9-]+\.ufs\.sh)$/

const IMAGE_URL_MESSAGE =
  "Envie uma imagem ou informe uma URL do UploadThing ou do Unsplash."

const imageUrl = z.url({
  protocol: /^https$/,
  hostname: IMAGE_HOSTNAME,
  message: IMAGE_URL_MESSAGE,
})

// Coordinates are typed as text (comma or dot); empty means "not set"
const coordinate = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") return true
      const parsed = parseCoordinate(value)
      return parsed !== null && parsed >= min && parsed <= max
    }, message)

export const parseCoordinate = (value: string): number | null => {
  const normalized = value.trim().replace(",", ".")
  if (normalized === "" || !/^-?\d+(\.\d+)?$/.test(normalized)) return null
  return Number(normalized)
}

export const updateBarbershopSchema = z
  .object({
    name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres."),
    description: z.string().trim().min(1, "Informe a descrição."),
    address: z.string().trim().min(5, "Informe o endereço completo."),
    city: z.string().trim().min(2, "Informe a cidade."),
    latitude: coordinate(-90, 90, "Latitude inválida (entre -90 e 90)."),
    longitude: coordinate(-180, 180, "Longitude inválida (entre -180 e 180)."),
    logoUrl: z.union([imageUrl, z.literal("")]),
    bannerUrl: imageUrl,
    instagramUrl: z.union([
      httpUrl("Informe uma URL válida (http ou https)."),
      z.literal(""),
    ]),
    phones: z
      .array(z.string().trim().min(8, "Telefone inválido."))
      .min(1, "Informe pelo menos um telefone.")
      .max(5, "Máximo de 5 telefones."),
  })
  // A pin needs both coordinates; one alone would be ignored by the map
  .refine((data) => (data.latitude === "") === (data.longitude === ""), {
    message: "Informe a latitude e a longitude, ou deixe as duas em branco.",
    path: ["longitude"],
  })

export type UpdateBarbershopFormValues = z.infer<typeof updateBarbershopSchema>
