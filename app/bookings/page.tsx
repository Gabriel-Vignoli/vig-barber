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
      <div className="space-y-3 p-4 lg:mx-auto lg:max-w-5xl lg:space-y-6 lg:p-8 xl:py-12">
        <h1 className="text-xl font-bold lg:text-2xl">Agendamentos</h1>
        {confirmedBookings.length !== 0 ? (
          <>
            <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase lg:mt-0 lg:text-sm">
              Confirmados
            </h2>
            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking}></BookingItem>
              ))}
            </div>
          </>
        ) : (
          <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase lg:mt-0 lg:text-sm">
            Você ainda não possui nenhum agendamento.
          </h2>
        )}

        <h1 className="mt-8 text-xl font-bold lg:mt-12 lg:text-2xl">
          Histórico
        </h1>
        {concludedBookings.length === 0 ? (
          <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase lg:mt-0 lg:text-sm">
            Você ainda não possui agendamentos finalizados.
          </h2>
        ) : (
          <>
            <h2 className="mt-8 text-xs font-bold text-gray-400 uppercase lg:mt-0 lg:text-sm">
              Finalizados
            </h2>
            <div className="lg:grid lg:grid-cols-2 lg:gap-4">
              {concludedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking}></BookingItem>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Bookings
