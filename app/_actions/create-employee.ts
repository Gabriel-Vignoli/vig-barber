"use server"

import bcrypt from "bcryptjs"
import { prisma } from "../_lib/prisma"
import { assertShopRole } from "../_lib/tenant"
import { revalidateShop } from "../_lib/revalidate"
import { createEmployeeSchema } from "../_lib/validations/employee"

// Adds a barber to the shop. An email that already has an account is attached
// through a Membership (and an Employee row) and keeps its own name, password
// and every other global field. Only a brand-new user gets name and password.
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
): Promise<{ attached: boolean }> => {
  const { shop } = await assertShopRole(slug, ["ADMIN"])

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

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

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

    // One role per shop: an atendente cannot also be a barber here. An ADMIN
    // who cuts hair keeps the ADMIN membership and gets an Employee row.
    if (membership?.role === "ATENDENTE") {
      throw new Error("Este usuário já é atendente desta barbearia.")
    }

    await prisma.$transaction(async (tx) => {
      if (employee) {
        // A barber removed earlier (kept inactive for their history) is back
        await tx.employee.updateMany({
          where: { id: employee.id, barbershopId: shop.id },
          data: { ...profile, isActive: true },
        })
      } else {
        await tx.employee.create({
          data: { userId: existingUser.id, barbershopId: shop.id, ...profile },
        })
      }

      if (!membership) {
        await tx.membership.create({
          data: {
            userId: existingUser.id,
            barbershopId: shop.id,
            role: "EMPLOYEE",
          },
        })
      }
    })

    revalidateShop(shop)

    return { attached: true }
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

  return { attached: false }
}
