"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { createShop } from "../_actions/create-shop"
import {
  createShopSchema,
  CreateShopFormValues,
} from "../_lib/validations/platform"
import { unwrap } from "../_lib/action-result"
import { showInviteLinkToast } from "./invite-link-toast"

const FIELDS: {
  name: keyof CreateShopFormValues
  label: string
  type?: string
  placeholder?: string
  hint?: string
}[] = [
  { name: "name", label: "Nome da barbearia" },
  {
    name: "slug",
    label: "Endereço (slug)",
    placeholder: "minha-barbearia",
    hint: "A página da barbearia fica em /b/<endereço>.",
  },
  { name: "address", label: "Endereço completo" },
  { name: "city", label: "Cidade" },
  { name: "phone", label: "Telefone (opcional)", type: "tel" },
  {
    name: "ownerEmail",
    label: "Email do dono",
    type: "email",
    hint: "Recebe um convite para administrar a barbearia.",
  },
]

const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)

const PlatformCreateShopDialog = () => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState, reset, setValue, getFieldState } =
    useForm<CreateShopFormValues>({
      resolver: zodResolver(createShopSchema) as never,
      defaultValues: {
        name: "",
        slug: "",
        address: "",
        city: "",
        phone: "",
        ownerEmail: "",
      },
    })

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) reset()
  }

  const onSubmit = async (values: CreateShopFormValues) => {
    setIsSubmitting(true)

    try {
      const { slug, emailSent, inviteUrl } = await unwrap(createShop(values))

      showInviteLinkToast({
        title: `Barbearia /b/${slug} criada! Convite do dono pronto.`,
        emailSent,
        inviteUrl,
      })

      setOpen(false)
      reset()
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar barbearia.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const nameField = register("name")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={(triggerProps) => (
          <Button
            className="cursor-pointer border-0 xl:p-4 xl:text-base"
            {...triggerProps}
          >
            <PlusIcon className="size-4.5 xl:size-5" />
            Nova barbearia
          </Button>
        )}
      />
      <DialogContent className="max-h-[90vh] w-[90%] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova barbearia</DialogTitle>
          <DialogDescription>
            Cria a barbearia e envia um convite por email para o dono entrar
            como administrador.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 text-left"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          {FIELDS.map((field) => {
            const id = `create-shop-${field.name}`
            const error = formState.errors[field.name]
            const registered =
              field.name === "name"
                ? {
                    ...nameField,
                    onChange: async (
                      event: React.ChangeEvent<HTMLInputElement>,
                    ) => {
                      await nameField.onChange(event)
                      // Suggest a slug until the admin edits it by hand
                      if (!getFieldState("slug").isDirty) {
                        setValue("slug", toSlug(event.target.value))
                      }
                    },
                  }
                : register(field.name)

            return (
              <div key={field.name} className="space-y-1">
                <Label htmlFor={id}>{field.label}</Label>
                <Input
                  id={id}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  aria-invalid={Boolean(error)}
                  {...registered}
                />
                {error ? (
                  <p role="alert" className="text-destructive text-xs">
                    {error.message}
                  </p>
                ) : (
                  field.hint && (
                    <p className="text-muted-foreground text-xs">
                      {field.hint}
                    </p>
                  )
                )}
              </div>
            )
          })}

          <Button
            type="submit"
            className="w-full cursor-pointer py-5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              "Criar barbearia"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PlatformCreateShopDialog
