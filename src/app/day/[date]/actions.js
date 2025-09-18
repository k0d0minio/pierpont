"use server";

import prisma from "../../../lib/prisma";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";

export async function createPDJGroup(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const sizeStr = formData.get("size");
  const label = formData.get("label") || null;

  const size = Number(sizeStr);
  if (!dateStr || !Number.isFinite(size) || size < 0) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const day = await prisma.day.upsert({
    where: { dateISO: date },
    update: {},
    create: { dateISO: date, weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date) },
  });

  await prisma.pDJGroup.create({
    data: {
      dayId: day.id,
      size,
      label,
    },
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createHotelGuest(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const sizeStr = formData.get("size");
  const source = formData.get("source") || null;
  const size = Number(sizeStr);
  if (!dateStr || !Number.isFinite(size) || size < 0) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const day = await prisma.day.upsert({
    where: { dateISO: date },
    update: {},
    create: { dateISO: date, weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date) },
  });

  await prisma.hotelGuestEntry.create({
    data: { dayId: day.id, size, source },
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function deleteHotelGuest(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };

  await prisma.hotelGuestEntry.delete({ where: { id } });
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createGolfEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const title = formData.get("title");
  const participantsStr = formData.get("participants");
  const time = formData.get("time") || null;
  const notes = formData.get("notes") || null;
  if (!dateStr || !title) return { ok: false };
  const participantsCount = participantsStr ? Number(participantsStr) : null;
  if (participantsStr && !Number.isFinite(participantsCount)) return { ok: false };

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const day = await prisma.day.upsert({
    where: { dateISO: date },
    update: {},
    create: { dateISO: date, weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date) },
  });

  await prisma.golfEntry.create({
    data: { dayId: day.id, title, participantsCount, time, notes },
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function deleteGolfEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  await prisma.golfEntry.delete({ where: { id } });
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createEventEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const title = formData.get("title");
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const location = formData.get("location") || null;
  const capacityStr = formData.get("capacity");
  const notes = formData.get("notes") || null;
  if (!dateStr || !title) return { ok: false };
  const capacity = capacityStr ? Number(capacityStr) : null;
  if (capacityStr && !Number.isFinite(capacity)) return { ok: false };

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  const day = await prisma.day.upsert({
    where: { dateISO: date },
    update: {},
    create: { dateISO: date, weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date) },
  });

  await prisma.eventEntry.create({
    data: { dayId: day.id, title, startTime, endTime, location, capacity, notes },
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function deleteEventEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  await prisma.eventEntry.delete({ where: { id } });
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}
export async function deletePDJGroup(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false };
  }

  await prisma.pDJGroup.delete({ where: { id } });
  if (dateStr) {
    revalidatePath(`/day/${dateStr}`);
  }
  revalidatePath(`/`);
  return { ok: true };
}


