/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const TZ = 'Europe/Brussels'

function getBrusselsYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const y = Number(parts.find((p) => p.type === 'year').value)
  const m = Number(parts.find((p) => p.type === 'month').value)
  const d = Number(parts.find((p) => p.type === 'day').value)
  return { year: y, month: m, day: d }
}

function dateFromYmdUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long' }).format(date)
}

function weekdayNumberBrussels(date) {
  const name = weekdayNameBrussels(date)
  const map = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }
  return map[name]
}

function getWeekRangeForBrussels(date = new Date()) {
  const ymd = getBrusselsYmd(date)
  const today = dateFromYmdUtc(ymd)
  const dow = weekdayNumberBrussels(today) // 1..7
  const monday = addDays(today, -(dow - 1))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

async function main() {
  const days = getWeekRangeForBrussels()
  for (const d of days) {
    const weekday = weekdayNameBrussels(d)
    await prisma.day.upsert({
      where: { dateISO: d },
      update: { weekday },
      create: { dateISO: d, weekday }
    })
  }
  const count = await prisma.day.count({ where: { dateISO: { gte: days[0], lte: days[6] } } })
  console.log(`Seeded Days for Brussels week: ${count} rows.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


