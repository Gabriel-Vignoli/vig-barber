import { getServerSession } from "next-auth"
import Header from "../components/header"
import { authOptions } from "../_lib/auth"
import { notFound } from "next/navigation"
import BookingItem from "../components/booking-item"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import { getConcludedBookings } from "../_data/get-concluded-bookings"

const Bookings = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return notFound()
  }

  const confirmedBookings = await getConfirmedBookings()
  const concludedBookings = await getConcludedBookings()

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
            {confirmedBookings.map((booking) => (
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
            {concludedBookings.map((booking) => (
              <BookingItem key={booking.id} booking={booking}></BookingItem>
            ))}
          </>
        )}
      </div>
    </>
  )
}

export default Bookings
