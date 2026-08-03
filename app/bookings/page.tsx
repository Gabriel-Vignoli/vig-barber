import { getServerSession } from "next-auth"
import { prisma } from "../_lib/prisma"
import Header from "../components/header"
import { authOptions } from "../_lib/auth"
import { notFound } from "next/navigation"
import BookingItem from "../components/booking-item"

const Bookings = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return notFound()
  }
  const confirmedBookings = await prisma.booking.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session?.user as any).id,
      bookingDate: {
        gte: new Date(),
      },
    },
    include: {
      barbershopService: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      bookingDate: "asc",
    },
  })

  const concludedBookings = await prisma.booking.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId: (session?.user as any).id,
      bookingDate: {
        lt: new Date(),
      },
    },
    include: {
      barbershopService: {
        include: {
          barbershop: true,
        },
      },
    },
    orderBy: {
      bookingDate: "desc",
    },
  })

  // Prisma's Decimal fields can't be passed from Server to Client Components,
  // so we convert price to a plain number before rendering <BookingItem>.
  const serializedConfirmedBookings = confirmedBookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))

  const serializedConcludedBookings = concludedBookings.map((booking) => ({
    ...booking,
    barbershopService: {
      ...booking.barbershopService,
      price: Number(booking.barbershopService.price),
    },
  }))

  return (
    <>
      <Header></Header>
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        {confirmedBookings.length !== 0 ? (
          <>
            <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
              Confirmados
            </h2>
            {serializedConfirmedBookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking}></BookingItem>
            ))}
          </>
        ) : (
          <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
            Você ainda não possui nenhum agendamento.
          </h2>
        )}

        <h1 className="text-xl font-bold">Histórico</h1>
        {concludedBookings.length === 0 ? (
          <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
            Você ainda não possui agendamentos finalizados.
          </h2>
        ) : (
          <>
            <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
              Finalizados
            </h2>
            {serializedConcludedBookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking}></BookingItem>
            ))}
          </>
        )}
      </div>
    </>
  )
}

export default Bookings
