"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "./ui/button"
import { Input } from "./ui/input"

const formSchema = z.object({
  search: z.string().trim().min(1, {
    message: "Digite algo para buscar",
  }),
})

type FormData = z.infer<typeof formSchema>

const Search = () => {
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: "",
    },
  })

  const handleSubmit = (data: FormData) => {
    router.push(`/barbershops?search=${encodeURIComponent(data.search)}`)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="flex gap-2">
      <div className="w-full">
        <Input
          placeholder="Faça sua busca..."
          className="w-full"
          {...form.register("search")}
        />

        {form.formState.errors.search && (
          <p className="text-destructive mt-1 text-sm">
            {form.formState.errors.search.message}
          </p>
        )}
      </div>

      <Button type="submit">
        <SearchIcon />
      </Button>
    </form>
  )
}

export default Search
