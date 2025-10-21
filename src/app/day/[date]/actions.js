"use server";

import supabase from "../../../lib/supabase";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";

export async function createPDJGroup(formData) {
  console.log('createPDJGroup called with:', Object.fromEntries(formData.entries()));
  const isEditorResult = await isEditor();
  console.log('isEditor result:', isEditorResult);
  
  if (!isEditorResult) {
    console.log('Not authenticated as editor');
    return { ok: false };
  }
  const dateStr = formData.get("date");
  const guestCountStr = formData.get("guestCount");
  const guestName = formData.get("guestName") || null;
  const roomNumber = formData.get("roomNumber") || null;
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const notes = formData.get("notes") || null;
  const isTourOperator = formData.get("isTourOperator") === "on";

  const guestCount = Number(guestCountStr);
  if (!dateStr || !Number.isFinite(guestCount) || guestCount < 0) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  // Upsert day
  const { data: day } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  // Create breakfast entry
  await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'breakfast',
    size: guestCount,
    label: guestName,
    startTime,
    endTime,
    notes,
    isTourOperator,
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createHotelGuest(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const guestCountStr = formData.get("guestCount");
  const guestName = formData.get("guestName") || null;
  const roomNumber = formData.get("roomNumber") || null;
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const notes = formData.get("notes") || null;
  const isTourOperator = formData.get("isTourOperator") === "on";

  const guestCount = Number(guestCountStr);
  if (!dateStr || !Number.isFinite(guestCount) || guestCount < 0) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  // Upsert day
  const { data: day } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  // Create hotel entry
  await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'hotel',
    size: guestCount,
    label: guestName,
    startTime,
    endTime,
    notes,
    isTourOperator,
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

  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createGolfEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const title = formData.get("title");
  const description = formData.get("description") || null;
  const sizeStr = formData.get("size");
  const capacityStr = formData.get("capacity");
  const poc = formData.get("poc") || null;
  const venueType = formData.get("venueType") || null;
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const notes = formData.get("notes") || null;
  const isTourOperator = formData.get("isTourOperator") === "on";

  if (!dateStr || !title) return { ok: false };
  
  const size = sizeStr ? Number(sizeStr) : null;
  const capacity = capacityStr ? Number(capacityStr) : null;
  
  if ((sizeStr && !Number.isFinite(size)) || (capacityStr && !Number.isFinite(capacity))) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  // Upsert day
  const { data: day } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  // Create golf entry
  await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'golf',
    title,
    label: description,
    size,
    capacity,
    location: venueType,
    startTime,
    endTime,
    notes,
    isTourOperator,
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
  
  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createEventEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const title = formData.get("title");
  const description = formData.get("description") || null;
  const sizeStr = formData.get("size");
  const capacityStr = formData.get("capacity");
  const poc = formData.get("poc") || null;
  const venueType = formData.get("venueType") || null;
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const notes = formData.get("notes") || null;
  const isTourOperator = formData.get("isTourOperator") === "on";

  if (!dateStr || !title) return { ok: false };
  
  const size = sizeStr ? Number(sizeStr) : null;
  const capacity = capacityStr ? Number(capacityStr) : null;
  
  if ((sizeStr && !Number.isFinite(size)) || (capacityStr && !Number.isFinite(capacity))) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  // Upsert day
  const { data: day } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  // Create event entry
  await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'event',
    title,
    label: description,
    size,
    capacity,
    location: venueType,
    startTime,
    endTime,
    notes,
    isTourOperator,
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
  
  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}
export async function createReservationEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const dateStr = formData.get("date");
  const guestName = formData.get("guestName");
  const phoneNumber = formData.get("phoneNumber") || null;
  const email = formData.get("email") || null;
  const guestCountStr = formData.get("guestCount");
  const startTime = formData.get("startTime") || null;
  const endTime = formData.get("endTime") || null;
  const notes = formData.get("notes") || null;
  const isTourOperator = formData.get("isTourOperator") === "on";

  if (!dateStr || !guestName) return { ok: false };
  
  const guestCount = guestCountStr ? Number(guestCountStr) : null;
  if (guestCountStr && !Number.isFinite(guestCount)) {
    return { ok: false };
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

  // Upsert day
  const { data: day } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  // Create reservation entry
  await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'reservation',
    title: guestName,
    size: guestCount,
    startTime,
    endTime,
    notes,
    isTourOperator,
  });

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function deleteReservationEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  await supabase.from('Entry').delete().eq('id', id);
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

  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) {
    revalidatePath(`/day/${dateStr}`);
  }
  revalidatePath(`/`);
  return { ok: true };
}


