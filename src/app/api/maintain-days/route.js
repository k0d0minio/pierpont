import { NextResponse } from 'next/server'
import prisma from '../../lib/prisma'

export const runtime = 'nodejs'

function getBrusselsYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const y = Number(parts.find((p) => p.type === 'year').value)
  const m = Number(parts.find((p) => p.type === 'month').value)
  const d = Number(parts.find((p) => p.type === 'day').value)
  return { year: y, month: m, day: d }
}

function dateFromYmdUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', weekday: 'long' }).format(date)
}

async function maintainDays() {
  const todayYmd = getBrusselsYmd(new Date())
  const todayUtc = dateFromYmdUtc(todayYmd)

  // Delete all days strictly before today (Brussels)
  const del = await prisma.day.deleteMany({ where: { dateISO: { lt: todayUtc } } })

  // Ensure today + 13 days exist (2 weeks ahead including today) => total 14 days
  let created = 0
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayUtc)
    d.setUTCDate(d.getUTCDate() + i)
    const weekday = weekdayNameBrussels(d)
    await prisma.day.upsert({
      where: { dateISO: d },
      update: { weekday },
      create: { dateISO: d, weekday },
    })
    created++
  }

  return { deleted: del.count, ensured: created }
}

function isAuthorized(req) {
  const headerCode = req.headers.get('x-maintenance-code') || req.headers.get('x-edit-code')
  const url = new URL(req.url)
  const queryCode = url.searchParams.get('code')
  const expected = process.env.NEXT_PUBLIC_EDIT_CODE || ''
  return expected && (headerCode === expected || queryCode === expected)
}

export async function GET(req) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const result = await maintainDays()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}

export async function POST(req) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 })
  try {
    const result = await maintainDays()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}


