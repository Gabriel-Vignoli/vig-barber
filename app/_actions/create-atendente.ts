"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { createInvitation, findUserByEmail } from "../_lib/invitation"
import { createAtendenteSchema } from "../_lib/validations/atendente"
import { action, ActionError } from "../_lib/action-result"

// Adds an atendente to the shop. An email that already has an account is
// never attached without consent: it gets an invitation (accepted at
// /convite). Only a brand-new user is created here, with name and password.
export const createAtendente = action(
  async (
    slug: string,
    input: {
      name?: string
      email: string
      password?: string
    },
  ): Promise<{ invited: boolean }> => {
    const { shop, userId } = await assertShopRole(slug, ["ADMIN"])

    const parsed = createAtendenteSchema.safeParse(input)

    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0].message)
    }

    const { name, email, password } = parsed.data

    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_barbershopId: {
            userId: existingUser.id,
            barbershopId: shop.id,
          },
        },
        select: { role: true },
      })

      if (membership?.role === "ATENDENTE") {
        throw new ActionError("Este usuário já é atendente desta barbearia.")
      }

      // One role per shop: remove the current role first to change it
      if (membership) {
        throw new ActionError(
          "Este usuário já faz parte da equipe desta barbearia.",
        )
      }

      const sent = await createInvitation({
        shop,
        email,
        role: "ATENDENTE",
        invitedById: userId,
      })

      if (!sent) {
        throw new ActionError(
          "Não foi possível enviar o convite. Tente novamente.",
        )
      }

      return { invited: true }
    }

    if (!name || !password) {
      throw new ActionError("Informe nome e senha para criar um novo usuário.")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        memberships: {
          create: { barbershopId: shop.id, role: "ATENDENTE" },
        },
      },
    })

    revalidateShop(shop)

    return { invited: false }
  },
)
