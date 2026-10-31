import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Stripe from "stripe"
import { POST } from "@/app/api/stripe/webhook/route"
import { isProtectedPath } from "@/app/_lib/protected-paths"
import { config as proxyConfig } from "@/proxy"
import { prisma } from "@/app/_lib/prisma"
import { createShop } from "./helpers/factories"

const WEBHOOK_SECRET = "whsec_test_secret"
const WEBHOOK_URL = "http://localhost:3000/api/stripe/webhook"

const EVENT_PAYLOAD = JSON.stringify({
  id: "evt_test_1",
  object: "event",
  type: "customer.subscription.updated",
  data: { object: { id: "sub_test_1", object: "subscription" } },
})

const sign = (payload: string, secret = WEBHOOK_SECRET) =>
  Stripe.webhooks.generateTestHeaderString({ payload, secret })

const webhookRequest = (payload: string, signature?: string) =>
  new Request(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(signature && { "stripe-signature": signature }),
    },
    body: payload,
  })

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy")
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET)
    vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it.each(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"])(
    "answers 503 while %s is unset",
    async (name) => {
      vi.stubEnv(name, "")

      const response = await POST(
        webhookRequest(EVENT_PAYLOAD, sign(EVENT_PAYLOAD)),
      )

      expect(response.status).toBe(503)
    },
  )

  it("rejects a missing signature with 400", async () => {
    const response = await POST(webhookRequest(EVENT_PAYLOAD))

    expect(response.status).toBe(400)
  })

  it("rejects a signature made with another secret with 400", async () => {
    const response = await POST(
      webhookRequest(EVENT_PAYLOAD, sign(EVENT_PAYLOAD, "whsec_other")),
    )

    expect(response.status).toBe(400)
  })

  it("rejects a body changed after signing with 400", async () => {
    const tampered = EVENT_PAYLOAD.replace("sub_test_1", "sub_test_2")

    const response = await POST(webhookRequest(tampered, sign(EVENT_PAYLOAD)))

    expect(response.status).toBe(400)
  })

  it("accepts a valid signature, logs the event type and writes nothing", async () => {
    const shop = await createShop()

    const response = await POST(
      webhookRequest(EVENT_PAYLOAD, sign(EVENT_PAYLOAD)),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining("customer.subscription.updated"),
    )

    // Stub: the subscription fields stay untouched until billing ships
    const unchanged = await prisma.barbershop.findUniqueOrThrow({
      where: { id: shop.id },
    })
    expect(unchanged).toEqual(shop)
  })

  it("is never behind the session check of proxy.ts", () => {
    const [matcher] = proxyConfig.matcher
    const runsProxy = new RegExp(`^${matcher}$`)

    expect(runsProxy.test("/api/stripe/webhook")).toBe(false)
    expect(isProtectedPath("/api/stripe/webhook")).toBe(false)
    // Sanity check: the matcher does run on pages
    expect(runsProxy.test("/b/barbearia-a/admin")).toBe(true)
  })
})
