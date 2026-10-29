// Fields a client's own booking card needs. Kept narrow so nothing private
// (user emails, password hashes, Stripe ids) reaches a Client Component.
export const clientBookingSelect = {
  id: true,
  bookingDate: true,
  paymentMethod: true,
  barbershop: {
    select: {
      name: true,
      slug: true,
      address: true,
      phones: true,
    },
  },
  barbershopService: {
    select: {
      name: true,
      price: true,
      durationInMinutes: true,
    },
  },
  employee: {
    select: {
      imageUrl: true,
      user: { select: { name: true, image: true } },
    },
  },
} as const
