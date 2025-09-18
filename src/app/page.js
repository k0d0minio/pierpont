import prisma from "../lib/prisma";
import EditGate from "./EditGate.jsx";
import { isEditor } from "./actions/auth";
import { Heading } from "../../components/heading.jsx";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../../components/table.jsx";
import { Badge } from "../../components/badge.jsx";

function getBrusselsYmd(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year").value);
  const m = Number(parts.find((p) => p.type === "month").value);
  const d = Number(parts.find((p) => p.type === "day").value);
  return { year: y, month: m, day: d };
}

function dateFromYmdUtc({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function weekdayNameBrussels(date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
}

function weekdayNumberBrussels(date) {
  const name = weekdayNameBrussels(date);
  const map = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  return map[name];
}

function getWeekRangeForBrussels(date = new Date()) {
  const ymd = getBrusselsYmd(date);
  const today = dateFromYmdUtc(ymd);
  const dow = weekdayNumberBrussels(today);
  const monday = addDays(today, -(dow - 1));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function formatDayDisplay(date) {
  const weekday = weekdayNameBrussels(date);
  const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

function formatYmd(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function summarizePDJ(pdjGroups) {
  if (!pdjGroups || pdjGroups.length === 0) return { pattern: "—", total: 0, ambiguous: false };
  const sizes = pdjGroups.map((g) => g.size).filter((n) => Number.isFinite(n));
  const pattern = sizes.length ? sizes.join("+") : "—";
  const total = sizes.reduce((a, b) => a + b, 0);
  const ambiguous = pdjGroups.some((g) => g.isAmbiguous);
  return { pattern, total, ambiguous };
}

function sumSizes(entries) {
  if (!entries || entries.length === 0) return 0;
  return entries
    .map((e) => e.size)
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0);
}

export default async function Home() {
  const range = getWeekRangeForBrussels();
  const start = range[0];
  const end = range[6];

  const days = await prisma.day.findMany({
    where: { dateISO: { gte: start, lte: end } },
    include: {
      pdjGroups: true,
      hotelGuestEntries: true,
      golfEntries: true,
      eventEntries: true,
    },
    orderBy: { dateISO: "asc" },
  });

  const editor = await isEditor();

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="flex items-center justify-between mb-4">
        <Heading level={1}>Horeca Weekly Board</Heading>
        <EditGate isEditor={editor} />
      </div>
      <Table striped>
        <TableHead>
          <TableRow>
            <TableHeader className="w-[28%]">Date</TableHeader>
            <TableHeader>PDJ</TableHeader>
            <TableHeader className="hidden sm:table-cell">HTL Guests</TableHeader>
            <TableHeader className="hidden sm:table-cell">Golf</TableHeader>
            <TableHeader className="hidden sm:table-cell">Event</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {days.map((d) => {
            const pdj = summarizePDJ(d.pdjGroups);
            const hotel = sumSizes(d.hotelGuestEntries);
            const golfTitle = d.golfEntries?.[0]?.title || "";
            const eventTitle = d.eventEntries?.[0]?.title || "";
            return (
              <TableRow key={d.id} href={`/day/${formatYmd(d.dateISO)}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{formatDayDisplay(d.dateISO)}</span>
                    {golfTitle ? <Badge color="emerald">Golf</Badge> : null}
                    {eventTitle ? <Badge color="sky">Event</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge color={pdj.ambiguous ? "amber" : "zinc"}>{pdj.pattern}</Badge>
                    <span className="text-zinc-500">Total {pdj.total}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {hotel > 0 ? <Badge color="zinc">{hotel}</Badge> : <span className="text-zinc-500">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {golfTitle ? <span>{golfTitle}</span> : <span className="text-zinc-500">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {eventTitle ? <span>{eventTitle}</span> : <span className="text-zinc-500">—</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
