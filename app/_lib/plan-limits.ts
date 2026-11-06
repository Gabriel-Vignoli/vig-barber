import type { Plan } from "@/app/generated/prisma/enums"
import { prisma } from "./prisma"
import { DEFAULT_PLAN, PLANS, type PlanConfig } from "./plans"
import { ActionError } from "./action-result"
import { emailEquals } from "./email-match"

// Staff limits per plan, read from PLANS (plans.ts). null = unlimited.
//
// What counts toward a limit:
// - "employees": the shop's active barbers (Employee rows with isActive,
//   including an ADMIN who also cuts hair) plus pending EMPLOYEE invitations
// - "atendentes": ATENDENTE memberships plus pending ATENDENTE invitations
// A pending invitation is unaccepted and unexpired. Re-inviting an email
// replaces its pending invitation, so pass that email to leave its current
// invitation out of the count.
//
// The count and the write are not one transaction: two admins adding staff at
// the same instant could pass one over the limit. Acceptable for a soft
// commercial limit.

export type LimitedResource = "employees" | "atendentes"

const LIMIT_KEYS = {
  employees: "maxEmployees",
  atendentes: "maxAtendentes",
} as const satisfies Record<LimitedResource, keyof PlanConfig["limits"]>

const LIMIT_MESSAGES: Record<LimitedResource, (max: number) => string> = {
  employees: (max) =>
    `O plano da barbearia permite até ${max} funcionário${max !== 1 ? "s" : ""}.`,
  atendentes: (max) =>
    `O plano da barbearia permite até ${max} atendente${max !== 1 ? "s" : ""}.`,
}

// A plan missing from PLANS (the leftover TRIAL value, or a plan whose config
// was removed) gets the default plan's limits instead of blocking the shop
const getPlanLimits = (plan: Plan): PlanConfig["limits"] => {
  const plans: Partial<Record<Plan, PlanConfig>> = PLANS
  const config = Object.hasOwn(plans, plan) ? plans[plan] : undefined

  return (config ?? PLANS[DEFAULT_PLAN]).limits
}

export const getPlanLimit = (plan: Plan, resource: LimitedResource) =>
  getPlanLimits(plan)[LIMIT_KEYS[resource]]

const countStaff = async (
  shopId: string,
  resource: LimitedResource,
  excludeInvitationEmail?: string,
) => {
  const pendingInvitations = prisma.invitation.count({
    where: {
      barbershopId: shopId,
      role: resource === "employees" ? "EMPLOYEE" : "ATENDENTE",
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      ...(excludeInvitationEmail && {
        NOT: { email: emailEquals(excludeInvitationEmail) },
      }),
    },
  })

  const members =
    resource === "employees"
      ? prisma.employee.count({
          where: { barbershopId: shopId, isActive: true },
        })
      : prisma.membership.count({
          where: { barbershopId: shopId, role: "ATENDENTE" },
        })

  const [memberCount, invitationCount] = await Promise.all([
    members,
    pendingInvitations,
  ])

  return memberCount + invitationCount
}

// Throws a pt-BR ActionError when adding one more of `resource` would exceed
// the shop's plan. Call it right before the write that adds the staff member
// (or the invitation). Unlimited plans return without querying.
export const assertPlanLimit = async (
  shop: { id: string; plan: Plan },
  resource: LimitedResource,
  options: { invitationEmail?: string } = {},
) => {
  const max = getPlanLimit(shop.plan, resource)

  if (max === null) return

  const current = await countStaff(shop.id, resource, options.invitationEmail)

  if (current >= max) {
    throw new ActionError(LIMIT_MESSAGES[resource](max))
  }
}
