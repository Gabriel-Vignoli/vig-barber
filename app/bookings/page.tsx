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

  return (
    <>
      <Header></Header>
      <div className="space-y-3 p-4">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Confirmados
        </h2>
        {confirmedBookings.map((booking) => (
          <BookingItem key={booking.id} booking={booking}></BookingItem>
        ))}

        <h1 className="text-xl font-bold">Histórico</h1>
        <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase">
          Finalizados
        </h2>
        {concludedBookings.map((booking) => (
          <BookingItem key={booking.id} booking={booking}></BookingItem>
        ))}
      </div>
    </>
  )
}

export default Bookings
