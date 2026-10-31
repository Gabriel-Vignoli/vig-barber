import { createHash, randomBytes } from "crypto"
import type { MemberRole } from "@/app/generated/prisma/enums"
import { MEMBER_ROLE_LABELS } from "../_constants/roles"
import { getAppOrigin } from "./app-url"
import { prisma } from "./prisma"
import { EMAIL_FROM, resend } from "./resend"

export const INVITATION_TTL_DAYS = 7

const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000

// 32 random bytes in base64url (43 characters). Only the sha256 hash is
// stored, so a database leak never exposes a usable link.
export const generateInvitationToken = () => {
  const token = randomBytes(32).toString("base64url")

  return { token, tokenHash: hashInvitationToken(token) }
}

export const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export const getInvitationExpiry = (from: Date = new Date()) =>
  new Date(from.getTime() + INVITATION_TTL_MS)

export const isInvitationExpired = (
  invitation: { expiresAt: Date },
  now: Date = new Date(),
) => invitation.expiresAt.getTime() <= now.getTime()

// Case-insensitive email lookup: accounts keep the email as it was typed
export const findUserByEmail = (email: string) =>
  prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  })

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const sendInvitationEmail = async ({
  email,
  shopName,
  role,
  token,
}: {
  email: string
  shopName: string
  role: MemberRole
  token: string
}) => {
  const link = `${await getAppOrigin()}/convite/${token}`
  const safeShopName = escapeHtml(shopName)
  const roleLabel = MEMBER_ROLE_LABELS[role].toLowerCase()

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Convite para a equipe da ${shopName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Você foi convidado!</h2>
        <p>A barbearia <strong>${safeShopName}</strong> convidou você para entrar na equipe como <strong>${roleLabel}</strong>.</p>
        <p>
          <a href="${link}" style="display: inline-block; padding: 12px 20px; background: #171717; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Aceitar convite</a>
        </p>
        <p>Entre (ou crie sua conta) com este email: <strong>${escapeHtml(email)}</strong>. O convite expira em ${INVITATION_TTL_DAYS} dias.</p>
        <p style="color: #666; font-size: 12px;">Se o botão não funcionar, copie este link no navegador:<br />${link}</p>
        <p style="color: #666; font-size: 12px;">Se você não esperava este convite, pode ignorar este email.</p>
      </div>
    `,
  })

  return !error
}

// Creates (or replaces) the pending invitation of this email to this shop and
// emails the link. The caller has already checked who may invite.
// Returns false when the email could not be sent (the invitation is removed).
export const createInvitation = async ({
  shop,
  email,
  role,
  invitedById,
}: {
  shop: { id: string; name: string }
  email: string
  role: MemberRole
  invitedById: string | null
}): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase()
  const { token, tokenHash } = generateInvitationToken()

  const [, invitation] = await prisma.$transaction([
    // Re-inviting replaces the pending invitation (its old link stops working)
    prisma.invitation.deleteMany({
      where: {
        barbershopId: shop.id,
        email: { equals: normalizedEmail, mode: "insensitive" },
        acceptedAt: null,
      },
    }),
    prisma.invitation.create({
      data: {
        email: normalizedEmail,
        barbershopId: shop.id,
        role,
        tokenHash,
        expiresAt: getInvitationExpiry(),
        invitedById,
      },
      select: { id: true },
    }),
  ])

  let sent = false
  try {
    sent = await sendInvitationEmail({
      email: normalizedEmail,
      shopName: shop.name,
      role,
      token,
    })
  } catch {
    sent = false
  }

  if (!sent) {
    await prisma.invitation.deleteMany({
      where: { id: invitation.id, barbershopId: shop.id },
    })
  }

  return sent
}
