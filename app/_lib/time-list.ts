const SLOT_STEP_MINUTES = 30

interface BookingWithDuration {
  bookingDate: Date
  barbershopService: { durationInMinutes: number }
}

interface EmployeeScheduleForDay {
  startTime: string
  endTime: string
  isDayOff: boolean
}

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export const getTimeList = (
  bookings: BookingWithDuration[],
  selectedDay: Date,
  serviceDurationMinutes: number,
  schedule: EmployeeScheduleForDay | null,
) => {
  if (!schedule || schedule.isDayOff) return []

  const now = new Date()
  const isToday =
    selectedDay.getDate() === now.getDate() &&
    selectedDay.getMonth() === now.getMonth() &&
    selectedDay.getFullYear() === now.getFullYear()

  const scheduleStartMinutes = parseTimeToMinutes(schedule.startTime)
  const scheduleEndMinutes = parseTimeToMinutes(schedule.endTime)

  // Existing bookings as [start, end) minute ranges, so a candidate slot
  // spanning the full service duration can be checked for real overlap —
  // not just whether its exact start time matches an existing booking.
  const bookedRanges = bookings.map((booking) => {
    const start =
      booking.bookingDate.getHours() * 60 + booking.bookingDate.getMinutes()
    return { start, end: start + booking.barbershopService.durationInMinutes }
  })

  const slots: string[] = []

  for (
    let slotStart = scheduleStartMinutes;
    slotStart + serviceDurationMinutes <= scheduleEndMinutes;
    slotStart += SLOT_STEP_MINUTES
  ) {
    const slotEnd = slotStart + serviceDurationMinutes

    // A slot is invalid if the service's full duration would overlap any
    // existing booking's occupied range, even partially.
    const overlapsExistingBooking = bookedRanges.some(
      (range) => slotStart < range.end && slotEnd > range.start,
    )

    if (overlapsExistingBooking) continue

    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      if (slotStart <= nowMinutes) continue
    }

    slots.push(minutesToTime(slotStart))
  }

  return slots
}
