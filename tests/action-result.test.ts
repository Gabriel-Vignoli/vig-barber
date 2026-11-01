import { afterEach, describe, expect, it, vi } from "vitest"
import {
  action,
  ActionError,
  GENERIC_ACTION_ERROR,
  unwrap,
} from "@/app/_lib/action-result"
import { deleteService } from "@/app/_actions/delete-service"
import { createService } from "@/app/_actions/create-service"
import {
  createMembership,
  createService as createServiceRow,
  createShop,
  createUser,
} from "./helpers/factories"
import { mockSession } from "./helpers/session"
import { NotFoundError, RedirectError } from "./helpers/navigation"
import { notFound, redirect } from "next/navigation"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("action wrapper", () => {
  it("returns the data on success", async () => {
    const run = action(async (a: number, b: number) => a + b)
    expect(await run(2, 3)).toEqual({ ok: true, data: 5 })
  })

  it("returns the pt-BR message of an ActionError", async () => {
    const run = action(async () => {
      throw new ActionError("Horário indisponível.")
    })
    expect(await run()).toEqual({ ok: false, error: "Horário indisponível." })
  })

  it("hides unexpected errors behind the generic message and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const run = action(async () => {
      throw new Error("connection refused at 10.0.0.1:5432")
    })

    expect(await run()).toEqual({ ok: false, error: GENERIC_ACTION_ERROR })
    expect(log).toHaveBeenCalledOnce()
  })

  it("lets redirect() and notFound() propagate", async () => {
    await expect(action(async () => redirect("/login"))()).rejects.toThrow(
      RedirectError,
    )
    await expect(action(async () => notFound())()).rejects.toThrow(
      NotFoundError,
    )
  })

  it("unwrap throws the message of a failed result", async () => {
    await expect(
      unwrap({ ok: false, error: "Sem permissão." }),
    ).rejects.toThrow("Sem permissão.")
    expect(await unwrap({ ok: true, data: "ok" })).toBe("ok")
  })
})

describe("mutation actions return results instead of throwing", () => {
  it("returns the error as data for an expected failure", async () => {
    const shop = await createShop({ slug: "barbearia-a" })
    const admin = await createUser()
    await createMembership(admin.id, shop.id, "ADMIN")
    const service = await createServiceRow(shop.id)
    await createShop({ slug: "barbearia-b" })
    mockSession(admin.id)

    // Foreign shop: the guard's pt-BR message reaches the client
    expect(await deleteService("barbearia-b", service.id)).toEqual({
      ok: false,
      error: "Sem permissão.",
    })

    // Invalid input: the zod message reaches the client
    const invalid = await createService("barbearia-a", {
      name: "",
      description: "",
      price: -1,
      durationInMinutes: 0,
      imageUrl: "",
    })
    expect(invalid.ok).toBe(false)

    // Own shop: success with no data
    expect(await deleteService("barbearia-a", service.id)).toEqual({
      ok: true,
      data: undefined,
    })
  })
})
