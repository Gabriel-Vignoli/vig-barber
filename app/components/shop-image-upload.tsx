"use client"

import { useRef } from "react"
import { toast } from "sonner"
import { ImageUpIcon, Loader2Icon, Trash2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { useUploadThing } from "../_lib/uploadthing"
import { cn } from "../_lib/utils"

interface ShopImageUploadProps {
  slug: string
  value: string
  onChange: (url: string) => void
  alt: string
  previewClassName?: string
  removable?: boolean
}

// Uploads one image to UploadThing (the route checks that the user is ADMIN of
// this shop) and hands the URL back to the form. Nothing is saved until the
// admin submits the form.
const ShopImageUpload = ({
  slug,
  value,
  onChange,
  alt,
  previewClassName,
  removable = false,
}: ShopImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("shopImage", {
    onUploadError: (error) => {
      toast.error(error.message || "Erro ao enviar a imagem.")
    },
  })

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    event.target.value = "" // lets the same file be picked again
    if (!file) return

    try {
      const result = await startUpload([file], { slug })
      const uploaded = result?.[0]
      const url = uploaded?.serverData?.url ?? uploaded?.ufsUrl

      if (!url) return

      onChange(url)
      toast.success("Imagem enviada! Salve as alterações para publicar.")
    } catch {
      toast.error("Erro ao enviar a imagem.")
    }
  }

  const hasPreview = /^https?:\/\//.test(value)

  return (
    <div className="space-y-3">
      {hasPreview && (
        <div className={cn("bg-muted overflow-hidden", previewClassName)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={alt}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-2"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2Icon size={14} className="animate-spin" />
          ) : (
            <ImageUpIcon size={14} />
          )}
          {isUploading ? "Enviando..." : "Enviar imagem"}
        </Button>

        {removable && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive cursor-pointer gap-2"
            disabled={isUploading}
            onClick={() => onChange("")}
          >
            <Trash2Icon size={14} />
            Remover
          </Button>
        )}
      </div>
    </div>
  )
}

export default ShopImageUpload
