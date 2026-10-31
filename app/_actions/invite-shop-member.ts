"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "../_lib/prisma"
import { assertPlatformAdmin } from "../_lib/platform-admin"
import { createInvitation, findUserByEmail } from "../_lib/invitation"
import { inviteMemberSchema } from "../_lib/validations/platform"

// Platform only: invites someone to a shop with a role (e.g. a new owner).
// Re-inviting the same email replaces the pending invitation.
export const inviteShopMember = async (
  shopId: string,
  input: { email: string; role: string },
) => {
  const { userId } = await assertPlatformAdmin()

  const parsed = inviteMemberSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { email, role } = parsed.data

  const shop = await prisma.barbershop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true },
  })

  if (!shop) {
    throw new Error("Barbearia não encontrada.")
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_barbershopId: { userId: existingUser.id, barbershopId: shop.id },
      },
      select: { id: true },
    })

    if (membership) {
      throw new Error("Este usuário já faz parte da equipe desta barbearia.")
    }
  }

  const sent = await createInvitation({
    shop,
    email,
    role,
    invitedById: userId,
  })

  if (!sent) {
    throw new Error("Não foi possível enviar o convite. Tente novamente.")
  }

  revalidatePath("/platform")
}
