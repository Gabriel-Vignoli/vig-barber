import { prisma } from "../_lib/prisma"
import { hashInvitationToken } from "../_lib/invitation"

// The invitation behind a /convite link, looked up by the hash of its token
export const getInvitationByToken = (token: string) => {
  if (token.length === 0 || token.length > 128) return null

  return prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      barbershop: {
        select: {
          name: true,
          slug: true,
          city: true,
          logoUrl: true,
          status: true,
        },
      },
    },
  })
}
