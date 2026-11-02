import { isBookingBlockedRole } from "../_constants/roles"
import { prisma } from "./prisma"
import {
  getActiveShopOrThrow,
  getMembership,
  getSessionUserId,
  shopHasAccess,
  type Tenant,
} from "./tenant"
import { ActionError } from "./action-result"

// Customers see this instead of the billing reason: an unpaid shop just
// does not take bookings
export const BOOKINGS_UNAVAILABLE_MESSAGE =
  "Agendamentos indisponíveis no momento."

// For the public booking actions (and the slot lookups behind them): the
// active shop for this slug, refusing one whose subscription is pending
export const getBookableShopOrThrow = async (slug: string): Promise<Tenant> => {
  const shop = await getActiveShopOrThrow(slug)

  if (!shopHasAccess(shop)) {
    throw new ActionError(BOOKINGS_UNAVAILABLE_MESSAGE)
  }

  return shop
}

interface CustomerBookingInput {
  barbershopServiceId: string
  employeeId: string
  bookingDate: Date
}

// Shared guard for create-booking and replace-booking. Resolves the shop from
// the slug, refuses an unpaid shop, blocks staff of THIS shop, and checks in one query that the
// service, the active employee and their link all belong to the shop.
export const prepareCustomerBooking = async (
  slug: string,
  { barbershopServiceId, employeeId, bookingDate }: CustomerBookingInput,
): Promise<{ shop: Tenant; userId: string }> => {
  const userId = await getSessionUserId()

  if (!userId) {
    throw new ActionError("Usuário não autenticado")
  }

  const shop = await getBookableShopOrThrow(slug)

  const membership = await getMembership(shop.id, userId)

  if (isBookingBlockedRole(membership?.role)) {
    throw new ActionError(
      "Administradores e atendentes não podem realizar agendamentos.",
    )
  }

  if (!(bookingDate instanceof Date) || Number.isNaN(bookingDate.getTime())) {
    throw new ActionError("Data inválida.")
  }

  const link = await prisma.employeeService.findFirst({
    where: {
      serviceId: barbershopServiceId,
      employeeId,
      service: { barbershopId: shop.id },
      employee: { barbershopId: shop.id, isActive: true },
    },
    select: { id: true },
  })

  if (!link) {
    throw new ActionError(
      "Serviço ou profissional indisponível nesta barbearia.",
    )
  }

  return { shop, userId }
}

// For pages: whether the signed-in viewer holds a staff role that blocks
// customer bookings in this shop (used to show the "not allowed" dialog)
export const getViewerBookingBlocked = async (barbershopId: string) => {
  const userId = await getSessionUserId()

  if (!userId) return false

  const membership = await getMembership(barbershopId, userId)

  return isBookingBlockedRole(membership?.role)
}
