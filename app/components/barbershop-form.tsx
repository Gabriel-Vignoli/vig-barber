"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent } from "./ui/card"
import ShopImageUpload from "./shop-image-upload"
import { updateBarbershop } from "../_actions/update-barbershop"
import {
  updateBarbershopSchema,
  UpdateBarbershopFormValues,
} from "../_lib/validations/barbershop"

interface BarbershopFormProps {
  slug: string
  barbershop: {
    name: string
    description: string
    address: string
    city: string | null
    latitude: number | null
    longitude: number | null
    logoUrl: string | null
    bannerUrl: string | null
    instagramUrl: string | null
    phones: string[]
  }
}

const MAX_PHONES = 5

const BarbershopForm = ({ slug, barbershop }: BarbershopFormProps) => {
  const router = useRouter()

  const defaultValues: UpdateBarbershopFormValues = {
    name: barbershop.name,
    description: barbershop.description,
    address: barbershop.address,
    city: barbershop.city ?? "",
    latitude: barbershop.latitude?.toString() ?? "",
    longitude: barbershop.longitude?.toString() ?? "",
    logoUrl: barbershop.logoUrl ?? "",
    bannerUrl: barbershop.bannerUrl ?? "",
    instagramUrl: barbershop.instagramUrl ?? "",
    phones: barbershop.phones.length > 0 ? barbershop.phones : [""],
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = useForm<UpdateBarbershopFormValues>({
    resolver: zodResolver(updateBarbershopSchema) as never,
    defaultValues,
  })

  const phones = watch("phones")
  const logoUrl = watch("logoUrl")
  const bannerUrl = watch("bannerUrl")

  const setImage = (field: "logoUrl" | "bannerUrl", url: string) => {
    setValue(field, url, { shouldDirty: true, shouldValidate: true })
  }

  const handlePhoneChange = (index: number, value: string) => {
    setValue(`phones.${index}`, value, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    })
  }

  const handleAddPhone = () => {
    if (phones.length >= MAX_PHONES) return
    setValue("phones", [...phones, ""], { shouldDirty: true })
  }

  const handleRemovePhone = (index: number) => {
    if (phones.length <= 1) return
    setValue(
      "phones",
      phones.filter((_, i) => i !== index),
      { shouldDirty: true },
    )
  }

  const onSubmit = async (values: UpdateBarbershopFormValues) => {
    try {
      await updateBarbershop(slug, values)
      toast.success("Informações da barbearia atualizadas!")
      reset(values) // new baseline, so the save button disables again
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar alterações.",
      )
    }
  }

  const phonesError = errors.phones?.message ?? errors.phones?.root?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Card className="border-0 shadow-md">
        <CardContent className="space-y-4 p-4 lg:p-6">
          <h2 className="font-semibold">Informações gerais</h2>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-name">Nome</Label>
            <Input id="barbershop-name" {...register("name")} />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-description">Descrição</Label>
            <Textarea
              id="barbershop-description"
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="space-y-4 p-4 lg:p-6">
          <h2 className="font-semibold">Imagens</h2>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-logo">
              Logo{" "}
              <span className="text-muted-foreground font-normal">
                (opcional, de preferência quadrada)
              </span>
            </Label>
            <ShopImageUpload
              slug={slug}
              value={logoUrl}
              onChange={(url) => setImage("logoUrl", url)}
              alt="Pré-visualização da logo"
              previewClassName="size-24 rounded-full"
              removable
            />
            <Input
              id="barbershop-logo"
              placeholder="ou cole a URL da imagem"
              {...register("logoUrl")}
            />
            {errors.logoUrl && (
              <p className="text-destructive text-xs">
                {errors.logoUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-image">Banner</Label>
            <ShopImageUpload
              slug={slug}
              value={bannerUrl}
              onChange={(url) => setImage("bannerUrl", url)}
              alt="Pré-visualização do banner"
              previewClassName="h-40 rounded-lg lg:h-56"
            />
            <Input
              id="barbershop-image"
              placeholder="ou cole a URL da imagem"
              {...register("bannerUrl")}
            />
            {errors.bannerUrl && (
              <p className="text-destructive text-xs">
                {errors.bannerUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardContent className="space-y-4 p-4 lg:p-6">
          <h2 className="font-semibold">Contato</h2>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-address">Endereço</Label>
            <Input id="barbershop-address" {...register("address")} />
            {errors.address && (
              <p className="text-destructive text-xs">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-city">Cidade</Label>
            <Input
              id="barbershop-city"
              placeholder="São Paulo"
              {...register("city")}
            />
            {errors.city && (
              <p className="text-destructive text-xs">{errors.city.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Coordenadas{" "}
              <span className="text-muted-foreground font-normal">
                (opcional, deixam o pino do mapa exato)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label
                  htmlFor="barbershop-latitude"
                  className="text-muted-foreground text-xs"
                >
                  Latitude
                </Label>
                <Input
                  id="barbershop-latitude"
                  inputMode="decimal"
                  placeholder="-23.5568"
                  {...register("latitude")}
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="barbershop-longitude"
                  className="text-muted-foreground text-xs"
                >
                  Longitude
                </Label>
                <Input
                  id="barbershop-longitude"
                  inputMode="decimal"
                  placeholder="-46.6608"
                  {...register("longitude")}
                />
              </div>
            </div>
            {(errors.latitude || errors.longitude) && (
              <p className="text-destructive text-xs">
                {errors.latitude?.message ?? errors.longitude?.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              No Google Maps, clique com o botão direito no local da barbearia e
              copie os números que aparecem no topo do menu.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Telefones</Label>
            <div className="space-y-2">
              {phones.map((phone, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="tel"
                      inputMode="tel"
                      aria-label={`Telefone ${index + 1}`}
                      placeholder="(11) 91234-5678"
                      value={phone}
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remover telefone ${index + 1}`}
                      className="text-destructive shrink-0 cursor-pointer"
                      disabled={phones.length <= 1}
                      onClick={() => handleRemovePhone(index)}
                    >
                      <Trash2Icon size={16} />
                    </Button>
                  </div>
                  {errors.phones?.[index]?.message && (
                    <p className="text-destructive text-xs">
                      {errors.phones[index]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {phonesError && (
              <p className="text-destructive text-xs">{phonesError}</p>
            )}

            {phones.length < MAX_PHONES && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer gap-2"
                onClick={handleAddPhone}
              >
                <PlusIcon size={14} />
                Adicionar telefone
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barbershop-instagram">
              Instagram{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="barbershop-instagram"
              placeholder="https://instagram.com/..."
              {...register("instagramUrl")}
            />
            {errors.instagramUrl && (
              <p className="text-destructive text-xs">
                {errors.instagramUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full cursor-pointer gap-2 py-6 text-base"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <SaveIcon className="size-4" />
            Salvar alterações
          </>
        )}
      </Button>
    </form>
  )
}

export default BarbershopForm
