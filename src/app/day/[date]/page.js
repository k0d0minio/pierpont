import prisma from "../../../lib/prisma";
import { createPDJGroup, deletePDJGroup, createHotelGuest, deleteHotelGuest, createGolfEntry, deleteGolfEntry, createEventEntry, deleteEventEntry } from "./actions";
import { Heading, Subheading } from "../../../../components/heading.jsx";
import { Badge } from "../../../../components/badge.jsx";
import { Input } from "../../../../components/input.jsx";
import { Button } from "../../../../components/button.jsx";
import { Dialog, DialogTitle, DialogBody, DialogActions } from "../../../../components/dialog.jsx";
import { isEditor } from "../../actions/auth";
import DayNav from "./DayNav.jsx";

function formatDayDisplay(date) {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date);
  const dayNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", day: "numeric" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", month: "long" }).format(date);
  const yearNum = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", year: "numeric" }).format(date);
  return `${weekday} ${dayNum} ${monthName} ${yearNum}`;
}

export default async function DayPage({ params }) {
  const dateParam = params.date; // expects YYYY-MM-DD
  const [y, m, d] = dateParam.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const day = await prisma.day.findFirst({
    where: { dateISO: date },
    include: {
      pdjGroups: true,
      hotelGuestEntries: true,
      golfEntries: true,
      eventEntries: true,
    },
  });

  const editor = await isEditor();

  return (
    <div className="font-sans min-h-screen p-6 sm:p-10">
      <div className="mb-3">
        <DayNav dateParam={dateParam} />
      </div>
      <Heading level={1} className="mb-4 text-xl sm:text-2xl">{formatDayDisplay(date)}</Heading>
      <div className="text-sm text-zinc-500 mb-4 sm:mb-6">Swipe left/right to navigate</div>
      
      <div className="space-y-6">
        <section>
          <Subheading level={2} className="mb-2">PDJ Groups</Subheading>
          <div className="flex flex-wrap gap-2">
            {day?.pdjGroups?.length ? day.pdjGroups.map((g) => (
              <Badge key={g.id}>{g.size}{g.label ? ` ${g.label}` : ''}</Badge>
            )) : <span className="text-zinc-500">None</span>}
          </div>
          <div className="mt-4">
            {editor ? (
              <form action={createPDJGroup} className="flex items-center gap-2">
                <input type="hidden" name="date" value={dateParam} />
                <Input name="size" type="number" min="0" placeholder="Size" className="max-w-24" required />
                <Input name="label" type="text" placeholder="Label (optional)" className="max-w-56" />
                <Button type="submit" color="emerald">Add</Button>
              </form>
            ) : null}
          </div>
          <div className="mt-2">
            {day?.pdjGroups?.length ? (
              <ul className="list-disc pl-5 text-sm/6">
                {day.pdjGroups.map((g) => (
                  <li key={g.id} className="flex items-center gap-2">
                    <span>#{g.id} {g.size}{g.label ? ` ${g.label}` : ''}</span>
                    {editor ? (
                      <form action={deletePDJGroup}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="date" value={dateParam} />
                        <Button type="submit" color="red" plain>Delete</Button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
        <section>
          <Subheading level={2} className="mb-2">Hotel Guests</Subheading>
          <div className="flex flex-wrap gap-2">
            {day?.hotelGuestEntries?.length ? day.hotelGuestEntries.map((g) => (
              <Badge key={g.id}>{g.size}{g.source ? ` ${g.source}` : ''}</Badge>
            )) : <span className="text-zinc-500">None</span>}
          </div>
          {editor ? (
            <div className="mt-4">
              <form action={createHotelGuest} className="flex items-center gap-2">
                <input type="hidden" name="date" value={dateParam} />
                <Input name="size" type="number" min="0" placeholder="Size" className="max-w-24" required />
                <Input name="source" type="text" placeholder="Source (optional)" className="max-w-56" />
                <Button type="submit" color="emerald">Add</Button>
              </form>
            </div>
          ) : null}
          <div className="mt-2">
            {editor && day?.hotelGuestEntries?.length ? (
              <ul className="list-disc pl-5 text-sm/6">
                {day.hotelGuestEntries.map((g) => (
                  <li key={g.id} className="flex items-center gap-2">
                    <span>#{g.id} {g.size}{g.source ? ` ${g.source}` : ''}</span>
                    <form action={deleteHotelGuest}>
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="date" value={dateParam} />
                      <Button type="submit" color="red" plain>Delete</Button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
        
        <section>
          <Subheading level={2} className="mb-2">Golf</Subheading>
          <ul className="list-disc pl-5 text-sm/6">
            {day?.golfEntries?.length ? day.golfEntries.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                <span>{g.title}{g.participantsCount ? ` (${g.participantsCount})` : ''}{g.time ? ` at ${g.time}` : ''}</span>
                {editor ? (
                  <form action={deleteGolfEntry}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="date" value={dateParam} />
                    <Button type="submit" color="red" plain>Delete</Button>
                  </form>
                ) : null}
              </li>
            )) : <span className="text-zinc-500">None</span>}
          </ul>
          {editor ? (
            <div className="mt-3">
              <form action={createGolfEntry} className="flex flex-wrap gap-2 items-center">
                <input type="hidden" name="date" value={dateParam} />
                <Input name="title" type="text" placeholder="Title" className="max-w-56" required />
                <Input name="participants" type="number" min="0" placeholder="Participants" className="max-w-32" />
                <Input name="time" type="text" placeholder="Time" className="max-w-28" />
                <Input name="notes" type="text" placeholder="Notes" className="max-w-56" />
                <Button type="submit" color="emerald">Add</Button>
              </form>
            </div>
          ) : null}
        </section>
        <section>
          <Subheading level={2} className="mb-2">Events</Subheading>
          <ul className="list-disc pl-5 text-sm/6">
            {day?.eventEntries?.length ? day.eventEntries.map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <span>{e.title}{e.startTime ? ` ${e.startTime}` : ''}{e.endTime ? ` - ${e.endTime}` : ''}{e.location ? ` @ ${e.location}` : ''}{e.capacity ? ` [${e.capacity}]` : ''}</span>
                {editor ? (
                  <form action={deleteEventEntry}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="date" value={dateParam} />
                    <Button type="submit" color="red" plain>Delete</Button>
                  </form>
                ) : null}
              </li>
            )) : <span className="text-zinc-500">None</span>}
          </ul>
          {editor ? (
            <div className="mt-3">
              <form action={createEventEntry} className="flex flex-wrap gap-2 items-center">
                <input type="hidden" name="date" value={dateParam} />
                <Input name="title" type="text" placeholder="Title" className="max-w-56" required />
                <Input name="startTime" type="text" placeholder="Start" className="max-w-28" />
                <Input name="endTime" type="text" placeholder="End" className="max-w-28" />
                <Input name="location" type="text" placeholder="Location" className="max-w-40" />
                <Input name="capacity" type="number" min="0" placeholder="Capacity" className="max-w-28" />
                <Input name="notes" type="text" placeholder="Notes" className="max-w-56" />
                <Button type="submit" color="emerald">Add</Button>
              </form>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return []
}

