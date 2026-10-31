"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { createInvitation, findUserByEmail } from "../_lib/invitation"
import { createEmployeeSchema } from "../_lib/validations/employee"

// Adds a barber to the shop. An email that already has an account is never
// attached without consent: it gets an invitation (accepted at /convite).
// Only a brand-new user is created here, with name and password. The one
// exception is the shop's own ADMIN, who already belongs to the shop and just
// gets an Employee row (an owner who cuts hair).
export const createEmployee = async (
  slug: string,
  input: {
    name?: string
    email: string
    password?: string
    bio?: string
    imageUrl?: string
    phone?: string
  },
): Promise<{ invited: boolean }> => {
  const { shop, userId } = await assertShopRole(slug, ["ADMIN"])

  const parsed = createEmployeeSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { name, email, password } = parsed.data
  const profile = {
    bio: parsed.data.bio || null,
    imageUrl: parsed.data.imageUrl || null,
    phone: parsed.data.phone || null,
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    const [membership, employee] = await Promise.all([
      prisma.membership.findUnique({
        where: {
          userId_barbershopId: {
            userId: existingUser.id,
            barbershopId: shop.id,
          },
        },
        select: { role: true },
      }),
      prisma.employee.findUnique({
        where: {
          userId_barbershopId: {
            userId: existingUser.id,
            barbershopId: shop.id,
          },
        },
        select: { id: true, isActive: true },
      }),
    ])

    if (employee?.isActive) {
      throw new Error("Este usuário já é funcionário desta barbearia.")
    }

    // One role per shop: an atendente cannot also be a barber here
    if (membership?.role === "ATENDENTE") {
      throw new Error("Este usuário já é atendente desta barbearia.")
    }

    if (membership) {
      // Already staff here (ADMIN, or a leftover EMPLOYEE membership): no
      // consent needed to add or reactivate the Employee row
      if (employee) {
        await prisma.employee.updateMany({
          where: { id: employee.id, barbershopId: shop.id },
          data: { ...profile, isActive: true },
        })
      } else {
        await prisma.employee.create({
          data: { userId: existingUser.id, barbershopId: shop.id, ...profile },
        })
      }

      revalidateShop(shop)

      return { invited: false }
    }

    const sent = await createInvitation({
      shop,
      email,
      role: "EMPLOYEE",
      invitedById: userId,
    })

    if (!sent) {
      throw new Error("Não foi possível enviar o convite. Tente novamente.")
    }

    return { invited: true }
  }

  if (!name || !password) {
    throw new Error("Informe nome e senha para criar um novo usuário.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      employees: {
        create: { barbershopId: shop.id, ...profile },
      },
      memberships: {
        create: { barbershopId: shop.id, role: "EMPLOYEE" },
      },
    },
  })

  revalidateShop(shop)

  return { invited: false }
}
