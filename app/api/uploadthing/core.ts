import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"
import { z } from "zod"
import { assertShopRole } from "@/app/_lib/tenant"

const f = createUploadthing()

// Upload routes for shop branding. The middleware is the only gate: it runs
// before UploadThing issues an upload URL, so non-admins never get one.
export const uploadRouter = {
  shopImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(z.object({ slug: z.string().min(1) }))
    .middleware(async ({ input }) => {
      try {
        const { shop } = await assertShopRole(input.slug, ["ADMIN"])
        return { shopId: shop.id }
      } catch (error) {
        throw new UploadThingError(
          error instanceof Error ? error.message : "Sem permissão.",
        )
      }
    })
    // Never writes to the DB: the URL goes back to the form and is saved by
    // update-barbershop (scoped to the admin's shop)
    .onUploadComplete(({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
