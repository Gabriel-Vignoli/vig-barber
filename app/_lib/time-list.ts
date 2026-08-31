import { Booking } from "@prisma/client"

export const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

export const getTimeList = (bookings: Booking[], selectedDay: Date) => {
  const now = new Date()
  const isToday =
    selectedDay.getDate() === now.getDate() &&
    selectedDay.getMonth() === now.getMonth() &&
    selectedDay.getFullYear() === now.getFullYear()

  return TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const hasBookingOnCurrentTime = bookings.some(
      (booking) =>
        booking.bookingDate.getHours() === hour &&
        booking.bookingDate.getMinutes() === minutes,
    )

    if (hasBookingOnCurrentTime) return false

    if (isToday) {
      const timeIsInThePast =
        hour < now.getHours() ||
        (hour === now.getHours() && minutes <= now.getMinutes())

      if (timeIsInThePast) return false
    }

    return true
  })
}
