export const BR_TIME_ZONE = "America/Sao_Paulo"

// Brazil has used a fixed UTC-3 offset (no daylight saving) since 2019.
const BR_OFFSET = "-03:00"

export const getBrazilDateKey = (date: Date): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

const getBrazilParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date)

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value), // 1-indexed
    day: Number(parts.find((p) => p.type === "day")?.value),
    weekday: parts.find((p) => p.type === "weekday")?.value, // "Sun", "Mon", ...
  }
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const brazilMidnight = (year: number, month: number, day: number): Date => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00${BR_OFFSET}`)
}

export const getBrazilDayRange = (date: Date) => {
  const { year, month, day } = getBrazilParts(date)
  const rangeStart = brazilMidnight(year, month, day)
  const rangeEnd = new Date(rangeStart.getTime() + 24 * 60 * 60 * 1000)
  return { rangeStart, rangeEnd }
}

export const getBrazilWeekRange = (date: Date) => {
  const { year, month, day, weekday } = getBrazilParts(date)
  const dayOfWeek = WEEKDAY_INDEX[weekday ?? "Sun"]

  const todayMidnight = brazilMidnight(year, month, day)
  const rangeStart = new Date(
    todayMidnight.getTime() - dayOfWeek * 24 * 60 * 60 * 1000,
  )
  const rangeEnd = new Date(rangeStart.getTime() + 7 * 24 * 60 * 60 * 1000)

  return { rangeStart, rangeEnd }
}

export const getBrazilMonthRange = (date: Date) => {
  const { year, month } = getBrazilParts(date)
  const rangeStart = brazilMidnight(year, month, 1)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const rangeEnd = brazilMidnight(nextYear, nextMonth, 1)

  return { rangeStart, rangeEnd, year, month }
}

export const getDaysInBrazilMonth = (year: number, month: number) => {
  // month is 1-indexed here; Date.UTC's month param is 0-indexed, so
  // passing it as-is with day 0 gives the last day of the target month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}
