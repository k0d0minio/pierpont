"use server";

import supabase from "../../../lib/supabase";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";
import { ensureDaysRange } from "../../actions/days";
import { parseYmd, formatYmd, addDays, isDateWithinOneYear, isPastDate, getTodayBrusselsUtc, getBrusselsYmd, dateFromYmdUtc } from "../../../lib/day-utils";
import { ProgramItemInsert, ProgramItemUpdate, ReservationInsert, ReservationUpdate, HotelBookingInsert, HotelBookingUpdate, BreakfastConfigurationInsert, BreakfastConfigurationUpdate } from "../../../types/supabase";

type ActionResponse = {
  ok: boolean;
  error?: string;
  count?: number;
  data?: any;
}

type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

/**
 * Calculate the next occurrence date based on frequency
 * @param currentDate - Current date
 * @param frequency - 'weekly', 'biweekly', 'monthly', 'yearly'
 * @returns Next occurrence date
 */
function getNextOccurrenceDate(currentDate: Date, frequency: RecurrenceFrequency): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'weekly':
      return addDays(nextDate, 7);
    case 'biweekly':
      return addDays(nextDate, 14);
    case 'monthly': {
      const ymd = getBrusselsYmd(nextDate);
      let nextMonth = ymd.month + 1;
      let nextYear = ymd.year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      // Try to keep the same day of month, but handle month boundaries
      const day = Math.min(ymd.day, new Date(nextYear, nextMonth, 0).getDate());
      return dateFromYmdUtc({ year: nextYear, month: nextMonth, day });
    }
    case 'yearly': {
      const ymd = getBrusselsYmd(nextDate);
      const nextYear = ymd.year + 1;
      // Handle leap year edge case (Feb 29)
      const day = Math.min(ymd.day, new Date(nextYear, ymd.month, 0).getDate());
      return dateFromYmdUtc({ year: nextYear, month: ymd.month, day });
    }
    default:
      return addDays(nextDate, 7);
  }
}

/**
 * Generate all occurrence dates for a recurring entry
 * @param startDate - First occurrence date
 * @param frequency - 'weekly', 'biweekly', 'monthly', 'yearly'
 * @param endDate - Last date to generate occurrences (typically 1 year from start)
 * @returns Array of occurrence dates
 */
function generateRecurrenceDates(startDate: Date, frequency: RecurrenceFrequency, endDate: Date): Date[] {
  const dates = [new Date(startDate)];
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const nextDate = getNextOccurrenceDate(currentDate, frequency);
    if (nextDate <= endDate) {
      dates.push(new Date(nextDate));
      currentDate = nextDate;
    } else {
      break;
    }
  }
  
  return dates;
}

export async function createGolfEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const dateStr = formData.get("date") as string;
  if (!dateStr) {
    return { ok: false, error: 'La date est requise' };
  }
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Impossible de créer des entrées pour des dates passées' };
  }

  // Validate date is within 1 year
  if (!isDateWithinOneYear(date)) {
    return { ok: false, error: 'Date must be within 1 year from today' };
  }

  const pocValue = formData.get("poc") as string | null;
  let pocId: number | null = null;

  // Handle POC if provided - can be ID (number) or name (string)
  if (pocValue) {
    const pocNum = Number(pocValue);
    if (Number.isFinite(pocNum)) {
      // It's a POC ID
      pocId = pocNum;
    } else {
      // It's a POC name (backward compatibility) - try to find existing or create new
      const { data: existingPoc } = await supabase
        .from('PointOfContact')
        .select('id')
        .eq('name', pocValue.trim())
        .single();
      
      if (existingPoc) {
        pocId = existingPoc.id;
      } else {
        // Create new POC
        const { data: poc, error: pocError } = await supabase
          .from('PointOfContact')
          .insert({ name: pocValue.trim() })
          .select()
          .single();
        
        if (pocError) {
          console.error('POC creation failed:', pocError);
          // Continue without POC rather than failing
        } else {
          pocId = poc.id;
        }
      }
    }
  }

  // Upsert day
  const { data: day, error: dayError } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Échec de la création du jour' };
  }

  // Handle venue type
  const venueTypeValue = formData.get('venueType') as string | null;
  let venueTypeId: number | null = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring entries
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = (formData.get('recurrenceFrequency') as string) || null;
  
  const size = formData.get('size');
  const capacity = formData.get('capacity');
  const tableBreakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = tableBreakdownStr ? parseTableBreakdown(tableBreakdownStr) : null;
  const recurrenceGroupId = isRecurring && recurrenceFrequency ? crypto.randomUUID() : null;
  const itemData: ProgramItemInsert = {
    dayId: day.id,
    type: 'golf',
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    guestCount: size ? Number(size) : null,
    capacity: capacity ? Number(capacity) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    tableBreakdown: tableBreakdown && tableBreakdown.length > 0 ? tableBreakdown : null,
    isRecurring: isRecurring,
    recurrenceFrequency: (recurrenceFrequency as RecurrenceFrequency) || null,
    recurrenceGroupId,
  };

  if (isRecurring && recurrenceFrequency) {
    const oneYearFromStart = addDays(date, 365);
    const occurrenceDates = generateRecurrenceDates(date, recurrenceFrequency as RecurrenceFrequency, oneYearFromStart);
    const itemsToInsert: ProgramItemInsert[] = [];
    const datesToRevalidate = new Set<string>([dateStr]);
    for (const occurrenceDate of occurrenceDates) {
      const occurrenceDateStr = formatYmd(occurrenceDate);
      datesToRevalidate.add(occurrenceDateStr);
      const { data: occurrenceDay, error: dayErr } = await supabase
        .from('Day')
        .upsert({
          dateISO: occurrenceDate.toISOString(),
          weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(occurrenceDate)
        }, { onConflict: 'dateISO' })
        .select()
        .single();
      if (dayErr || !occurrenceDay) continue;
      itemsToInsert.push({ ...itemData, dayId: occurrenceDay.id });
    }
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('ProgramItem').insert(itemsToInsert);
      if (insertError) return { ok: false, error: insertError.message };
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: itemsToInsert.length };
    }
  } else {
    const { error: insertError } = await supabase.from('ProgramItem').insert({ ...itemData, dayId: day.id });
    if (insertError) return { ok: false, error: insertError.message };
    revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
  return { ok: false, error: 'No entries created' };
}

async function findRecurringOccurrences(
  itemId: number,
  itemType: 'golf' | 'event'
): Promise<{ occurrences: Array<{ id: number; dayId: number; Day?: { dateISO: string } }>; recurrenceGroupId: string | null }> {
  const { data: item, error: itemError } = await supabase
    .from('ProgramItem')
    .select('*')
    .eq('id', itemId)
    .single();
  if (itemError || !item || !item.isRecurring) return { occurrences: [], recurrenceGroupId: null };
  let query = supabase
    .from('ProgramItem')
    .select('id, dayId, Day!inner(dateISO)')
    .eq('type', itemType)
    .eq('isRecurring', true);
  if (item.recurrenceGroupId) {
    query = query.eq('recurrenceGroupId', item.recurrenceGroupId);
  } else {
    query = query.eq('recurrenceFrequency', item.recurrenceFrequency);
    if (item.title) query = query.eq('title', item.title);
  }
  const { data: occurrences, error } = await query;
  if (error) return { occurrences: [], recurrenceGroupId: null };
  return { occurrences: occurrences || [], recurrenceGroupId: item.recurrenceGroupId ?? null };
}

export async function countRecurringOccurrences(itemId: number, itemType: 'golf' | 'event'): Promise<number> {
  const { occurrences } = await findRecurringOccurrences(itemId, itemType);
  return Math.max(0, occurrences.length - 1);
}

export async function deleteGolfEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id") as string;
  const dateStr = formData.get("date") as string | null;
  const deleteAllRecurring = formData.get("deleteAllRecurring") === 'true';
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  if (deleteAllRecurring) {
    const { occurrences, recurrenceGroupId } = await findRecurringOccurrences(id, 'golf');
    if (occurrences.length > 0) {
      const { error } = recurrenceGroupId
        ? await supabase.from('ProgramItem').delete().eq('recurrenceGroupId', recurrenceGroupId)
        : await supabase.from('ProgramItem').delete().in('id', occurrences.map(o => o.id));
      if (error) return { ok: false, error: error.message };
      const datesToRevalidate = new Set<string>(dateStr ? [dateStr] : []);
      for (const occ of occurrences) {
        if (occ.Day?.dateISO) datesToRevalidate.add(occ.Day.dateISO.split('T')[0]);
      }
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: occurrences.length };
    }
  }
  await supabase.from('ProgramItem').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createEventEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const dateStr = formData.get("date") as string;
  if (!dateStr) {
    return { ok: false, error: 'La date est requise' };
  }
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Impossible de créer des entrées pour des dates passées' };
  }

  // Validate date is within 1 year
  if (!isDateWithinOneYear(date)) {
    return { ok: false, error: 'Date must be within 1 year from today' };
  }

  const pocValue = formData.get("poc") as string | null;
  let pocId: number | null = null;

  // Handle POC if provided - can be ID (number) or name (string)
  if (pocValue) {
    const pocNum = Number(pocValue);
    if (Number.isFinite(pocNum)) {
      // It's a POC ID
      pocId = pocNum;
    } else {
      // It's a POC name (backward compatibility) - try to find existing or create new
      const { data: existingPoc } = await supabase
        .from('PointOfContact')
        .select('id')
        .eq('name', pocValue.trim())
        .single();
      
      if (existingPoc) {
        pocId = existingPoc.id;
      } else {
        // Create new POC
        const { data: poc, error: pocError } = await supabase
          .from('PointOfContact')
          .insert({ name: pocValue.trim() })
          .select()
          .single();
        
        if (pocError) {
          console.error('POC creation failed:', pocError);
          // Continue without POC rather than failing
        } else {
          pocId = poc.id;
        }
      }
    }
  }

  // Upsert day
  const { data: day, error: dayError } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Échec de la création du jour' };
  }

  // Handle venue type
  const venueTypeValue = formData.get('venueType') as string | null;
  let venueTypeId: number | null = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring entries
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = (formData.get('recurrenceFrequency') as string) || null;
  
  const size = formData.get('size');
  const capacity = formData.get('capacity');
  const tableBreakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = tableBreakdownStr ? parseTableBreakdown(tableBreakdownStr) : null;
  const recurrenceGroupId = isRecurring && recurrenceFrequency ? crypto.randomUUID() : null;
  const itemData: ProgramItemInsert = {
    dayId: day.id,
    type: 'event',
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    guestCount: size ? Number(size) : null,
    capacity: capacity ? Number(capacity) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    tableBreakdown: tableBreakdown && tableBreakdown.length > 0 ? tableBreakdown : null,
    isRecurring: isRecurring,
    recurrenceFrequency: (recurrenceFrequency as RecurrenceFrequency) || null,
    recurrenceGroupId,
  };

  if (isRecurring && recurrenceFrequency) {
    const oneYearFromStart = addDays(date, 365);
    const occurrenceDates = generateRecurrenceDates(date, recurrenceFrequency as RecurrenceFrequency, oneYearFromStart);
    const itemsToInsert: ProgramItemInsert[] = [];
    const datesToRevalidate = new Set<string>([dateStr]);
    for (const occurrenceDate of occurrenceDates) {
      const occurrenceDateStr = formatYmd(occurrenceDate);
      datesToRevalidate.add(occurrenceDateStr);
      const { data: occurrenceDay, error: dayErr } = await supabase
        .from('Day')
        .upsert({
          dateISO: occurrenceDate.toISOString(),
          weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(occurrenceDate)
        }, { onConflict: 'dateISO' })
        .select()
        .single();
      if (dayErr || !occurrenceDay) continue;
      itemsToInsert.push({ ...itemData, dayId: occurrenceDay.id });
    }
    if (itemsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('ProgramItem').insert(itemsToInsert);
      if (insertError) return { ok: false, error: insertError.message };
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: itemsToInsert.length };
    }
  } else {
    const { error: insertError } = await supabase.from('ProgramItem').insert({ ...itemData, dayId: day.id });
    if (insertError) return { ok: false, error: insertError.message };
    revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
  return { ok: false, error: 'No entries created' };
}

export async function deleteEventEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id") as string;
  const dateStr = formData.get("date") as string | null;
  const deleteAllRecurring = formData.get("deleteAllRecurring") === 'true';
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  if (deleteAllRecurring) {
    const { occurrences, recurrenceGroupId } = await findRecurringOccurrences(id, 'event');
    if (occurrences.length > 0) {
      const { error } = recurrenceGroupId
        ? await supabase.from('ProgramItem').delete().eq('recurrenceGroupId', recurrenceGroupId)
        : await supabase.from('ProgramItem').delete().in('id', occurrences.map(o => o.id));
      if (error) return { ok: false, error: error.message };
      const datesToRevalidate = new Set<string>(dateStr ? [dateStr] : []);
      for (const occ of occurrences) {
        if (occ.Day?.dateISO) datesToRevalidate.add(occ.Day.dateISO.split('T')[0]);
      }
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: occurrences.length };
    }
  }
  await supabase.from('ProgramItem').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createReservationEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const dateStr = formData.get("date") as string;
  if (!dateStr) {
    return { ok: false, error: 'La date est requise' };
  }
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Impossible de créer des entrées pour des dates passées' };
  }

  // Validate date is within 1 year
  if (!isDateWithinOneYear(date)) {
    return { ok: false, error: 'Date must be within 1 year from today' };
  }

  // Upsert day
  const { data: day, error: dayError } = await supabase
    .from('Day')
    .upsert({
      dateISO: date.toISOString(),
      weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Échec de la création du jour' };
  }

  const guestCount = formData.get('guestCount');
  const programItemIdStr = formData.get('eventEntryId') as string | null;
  const programItemId = programItemIdStr && Number.isFinite(Number(programItemIdStr)) ? Number(programItemIdStr) : null;
  const tableIndexStr = formData.get('tableIndex') as string | null;
  const tableIndex = tableIndexStr !== null && tableIndexStr !== '' && Number.isFinite(Number(tableIndexStr)) ? Number(tableIndexStr) : null;
  const hotelBookingIdStr = formData.get('hotelBookingId') as string | null;
  const hotelBookingId = hotelBookingIdStr && Number.isFinite(Number(hotelBookingIdStr)) ? Number(hotelBookingIdStr) : null;
  const reservationData: ReservationInsert = {
    dayId: day.id,
    guestName: (formData.get('guestName') as string) || null,
    phoneNumber: (formData.get('phoneNumber') as string) || null,
    email: (formData.get('email') as string) || null,
    guestCount: guestCount ? Number(guestCount) : null,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    programItemId: programItemId || null,
    tableIndex: tableIndex !== null ? tableIndex : null,
    hotelBookingId: hotelBookingId || null,
  };

  const { error: insertError } = await supabase.from('Reservation').insert(reservationData);

  if (insertError) {
    console.error('Reservation insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function deleteReservationEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id") as string;
  const dateStr = formData.get("date") as string | null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  await supabase.from('Reservation').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateGolfEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const { data: currentItem, error: itemError } = await supabase
    .from('ProgramItem')
    .select('*')
    .eq('id', id)
    .single();
  if (itemError || !currentItem) return { ok: false, error: 'Entry not found' };

  const dateStr = formData.get("date") as string | null;
  const pocValue = formData.get("poc") as string | null;
  let pocId: number | null = null;
  if (pocValue) {
    const pocNum = Number(pocValue);
    if (Number.isFinite(pocNum)) pocId = pocNum;
    else {
      const { data: existingPoc } = await supabase.from('PointOfContact').select('id').eq('name', pocValue.trim()).single();
      if (existingPoc) pocId = existingPoc.id;
      else {
        const { data: poc, error: pocError } = await supabase.from('PointOfContact').insert({ name: pocValue.trim() }).select().single();
        if (!pocError && poc) pocId = poc.id;
      }
    }
  }
  const venueTypeValue = formData.get('venueType') as string | null;
  let venueTypeId: number | null = null;
  if (venueTypeValue && Number.isFinite(Number(venueTypeValue))) venueTypeId = Number(venueTypeValue);
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = (formData.get('recurrenceFrequency') as string) || null;
  const size = formData.get('size');
  const capacity = formData.get('capacity');
  const tableBreakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = tableBreakdownStr ? parseTableBreakdown(tableBreakdownStr) : null;

  const updateData: ProgramItemUpdate = {
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    guestCount: size ? Number(size) : null,
    capacity: capacity ? Number(capacity) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    isRecurring: isRecurring,
    recurrenceFrequency: recurrenceFrequency as RecurrenceFrequency | null,
    tableBreakdown: tableBreakdown && tableBreakdown.length > 0 ? tableBreakdown : null,
  };

  const applyToRecurring = formData.get('applyToRecurring') as string | null;
  if (currentItem.isRecurring && applyToRecurring === 'all') {
    const { occurrences } = await findRecurringOccurrences(id, 'golf');
    const allIds = [...new Set([id, ...occurrences.map(o => o.id)])];
    const byGroup = currentItem.recurrenceGroupId
      ? supabase.from('ProgramItem').update(updateData).eq('recurrenceGroupId', currentItem.recurrenceGroupId)
      : (() => {
          const q = supabase.from('ProgramItem').update(updateData);
          return allIds.length > 0 ? q.in('id', allIds) : q.eq('id', id);
        })();
    const { error: updateError } = await byGroup;
    if (updateError) return { ok: false, error: updateError.message };
    const datesToRevalidate = new Set<string>(dateStr ? [dateStr] : []);
    occurrences.forEach(occ => { if (occ.Day?.dateISO) datesToRevalidate.add(formatYmd(new Date(occ.Day.dateISO))); });
    datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
    revalidatePath(`/`);
    return { ok: true, count: allIds.length };
  }
  if (currentItem.isRecurring && applyToRecurring !== 'all') {
    const { error: updateError } = await supabase.from('ProgramItem').update(updateData).eq('id', id);
    if (updateError) return { ok: false, error: updateError.message };
    if (dateStr) revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
  const { error: updateError } = await supabase.from('ProgramItem').update(updateData).eq('id', id);
  if (updateError) return { ok: false, error: updateError.message };
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateEventEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const { data: currentItem, error: itemError } = await supabase
    .from('ProgramItem')
    .select('*')
    .eq('id', id)
    .single();
  if (itemError || !currentItem) return { ok: false, error: 'Entry not found' };

  const dateStr = formData.get("date") as string | null;
  const pocValue = formData.get("poc") as string | null;
  let pocId: number | null = null;
  if (pocValue) {
    const pocNum = Number(pocValue);
    if (Number.isFinite(pocNum)) pocId = pocNum;
    else {
      const { data: existingPoc } = await supabase.from('PointOfContact').select('id').eq('name', pocValue.trim()).single();
      if (existingPoc) pocId = existingPoc.id;
      else {
        const { data: poc, error: pocError } = await supabase.from('PointOfContact').insert({ name: pocValue.trim() }).select().single();
        if (!pocError && poc) pocId = poc.id;
      }
    }
  }
  const venueTypeValue = formData.get('venueType') as string | null;
  let venueTypeId: number | null = null;
  if (venueTypeValue && Number.isFinite(Number(venueTypeValue))) venueTypeId = Number(venueTypeValue);
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = (formData.get('recurrenceFrequency') as string) || null;
  const size = formData.get('size');
  const capacity = formData.get('capacity');
  const tableBreakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = tableBreakdownStr ? parseTableBreakdown(tableBreakdownStr) : null;

  const updateData: ProgramItemUpdate = {
    title: (formData.get('title') as string) || null,
    description: (formData.get('description') as string) || null,
    guestCount: size ? Number(size) : null,
    capacity: capacity ? Number(capacity) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    isRecurring: isRecurring,
    recurrenceFrequency: recurrenceFrequency as RecurrenceFrequency | null,
    tableBreakdown: tableBreakdown && tableBreakdown.length > 0 ? tableBreakdown : null,
  };

  const applyToRecurring = formData.get('applyToRecurring') as string | null;
  if (currentItem.isRecurring && applyToRecurring === 'all') {
    const { occurrences } = await findRecurringOccurrences(id, 'event');
    const allIds = [...new Set([id, ...occurrences.map(o => o.id)])];
    const byGroup = currentItem.recurrenceGroupId
      ? supabase.from('ProgramItem').update(updateData).eq('recurrenceGroupId', currentItem.recurrenceGroupId)
      : (() => {
          const q = supabase.from('ProgramItem').update(updateData);
          return allIds.length > 0 ? q.in('id', allIds) : q.eq('id', id);
        })();
    const { error: updateError } = await byGroup;
    if (updateError) return { ok: false, error: updateError.message };
    const datesToRevalidate = new Set<string>(dateStr ? [dateStr] : []);
    occurrences.forEach(occ => { if (occ.Day?.dateISO) datesToRevalidate.add(formatYmd(new Date(occ.Day.dateISO))); });
    datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
    revalidatePath(`/`);
    return { ok: true, count: allIds.length };
  }
  if (currentItem.isRecurring && applyToRecurring !== 'all') {
    const { error: updateError } = await supabase.from('ProgramItem').update(updateData).eq('id', id);
    if (updateError) return { ok: false, error: updateError.message };
    if (dateStr) revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
  const { error: updateError } = await supabase.from('ProgramItem').update(updateData).eq('id', id);
  if (updateError) return { ok: false, error: updateError.message };
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateReservationEntry(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date") as string | null;
  const guestCount = formData.get('guestCount');
  const programItemIdStr = formData.get('eventEntryId') as string | null;
  const programItemId = programItemIdStr && Number.isFinite(Number(programItemIdStr)) ? Number(programItemIdStr) : null;
  const tableIndexStr = formData.get('tableIndex') as string | null;
  const tableIndex = tableIndexStr !== null && tableIndexStr !== '' && Number.isFinite(Number(tableIndexStr)) ? Number(tableIndexStr) : null;

  const updateData: ReservationUpdate = {
    guestName: (formData.get('guestName') as string) || null,
    phoneNumber: (formData.get('phoneNumber') as string) || null,
    email: (formData.get('email') as string) || null,
    guestCount: guestCount ? Number(guestCount) : null,
    startTime: (formData.get('startTime') as string) || null,
    endTime: (formData.get('endTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    programItemId: programItemId ?? null,
    tableIndex: tableIndex !== null ? tableIndex : null,
  };

  const { error: updateError } = await supabase
    .from('Reservation')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  if (dateStr) {
    revalidatePath(`/day/${dateStr}`);
  }
  revalidatePath(`/`);
  return { ok: true };
}

// Hotel Booking Actions
export async function createHotelBooking(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const checkInStr = formData.get("checkInDate") as string;
  const checkOutStr = formData.get("checkOutDate") as string;
  
  if (!checkInStr || !checkOutStr) {
    return { ok: false, error: 'Les dates d\'arrivée et de départ sont requises' };
  }

  const checkInDate = parseYmd(checkInStr);
  const checkOutDate = parseYmd(checkOutStr);

  // Validate dates are not in the past
  if (isPastDate(checkInDate)) {
    return { ok: false, error: 'Check-in date cannot be in the past' };
  }

  // Validate dates are within 1 year
  if (!isDateWithinOneYear(checkInDate)) {
    return { ok: false, error: 'Check-in date must be within 1 year from today' };
  }
  if (!isDateWithinOneYear(checkOutDate)) {
    return { ok: false, error: 'Check-out date must be within 1 year from today' };
  }

  if (checkOutDate <= checkInDate) {
    return { ok: false, error: 'Check-out date must be after check-in date' };
  }

  // Ensure all days in the booking range exist
  const endDateInclusive = addDays(checkOutDate, -1); // checkOutDate is exclusive
  const daysResult = await ensureDaysRange(checkInDate, endDateInclusive);
  if (!daysResult.ok) {
    return { ok: false, error: daysResult.error || 'Échec de la création des jours' };
  }

  // Insert hotel booking (without room number)
  const guestCount = formData.get('guestCount');
  const bookingData: HotelBookingInsert = {
    guestName: (formData.get('guestName') as string) || null,
    guestCount: guestCount ? Number(guestCount) : null,
    checkInDate: checkInStr,
    checkOutDate: checkOutStr,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
  };

  const { data: booking, error: insertError } = await supabase
    .from('HotelBooking')
    .insert(bookingData)
    .select()
    .single();

  if (insertError) {
    console.error('Hotel booking insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

  const bookingId = booking.id;

  // Create breakfast configurations for relevant days
  const breakfastDays = getBreakfastDays(checkInDate, checkOutDate);
  for (let i = 0; i < breakfastDays.length; i++) {
    const breakfastDate = breakfastDays[i];
    const breakfastDateStr = formatYmd(breakfastDate);
    
    // Check if breakfast config exists in form data
    const breakfastDateKey = `breakfast_${i}_date`;
    const breakfastBreakdownKey = `breakfast_${i}_tableBreakdown`;
    const breakfastNotesKey = `breakfast_${i}_notes`;
    
    const formBreakfastDate = formData.get(breakfastDateKey) as string;
    if (formBreakfastDate === breakfastDateStr) {
      const breakdownStr = formData.get(breakfastBreakdownKey) as string;
      if (breakdownStr) {
        const tableBreakdown = parseTableBreakdown(breakdownStr);
        if (tableBreakdown.length > 0) {
          // Ensure the day exists
          const { data: day, error: dayError } = await supabase
            .from('Day')
            .upsert({
              dateISO: breakfastDate.toISOString(),
              weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(breakfastDate)
            }, { onConflict: 'dateISO' })
            .select()
            .single();

          if (dayError || !day) {
            console.error('Day upsert failed:', dayError);
            continue;
          }

          // Get table times if provided (first table's time becomes startTime)
          const tableTimesKey = `breakfast_${i}_tableTimes`;
          const tableTimesStr = formData.get(tableTimesKey) as string | null;
          let startTime: string | null = null;
          if (tableTimesStr) {
            const tableTimes = tableTimesStr.split('+').filter(t => t && t.trim());
            if (tableTimes.length > 0) {
              startTime = tableTimes[0].trim(); // Use first table's time as startTime
            }
          }

          const configData: BreakfastConfigurationInsert = {
            hotelBookingId: bookingId,
            breakfastDate: breakfastDateStr,
            tableBreakdown: tableBreakdown,
            startTime: startTime,
            notes: (formData.get(breakfastNotesKey) as string) || null,
          };

          const { error: configError } = await supabase
            .from('BreakfastConfiguration')
            .insert(configData);

          if (configError) {
            console.error('Breakfast configuration insert failed:', configError);
          }
        }
      }
    }
  }

  // Create reservation entries for relevant days
  const reservationDays = getReservationDays(checkInDate, checkOutDate);
  for (let i = 0; i < reservationDays.length; i++) {
    const reservationDate = reservationDays[i];
    const reservationDateStr = formatYmd(reservationDate);
    
    // Check if reservation config exists in form data
    const reservationDateKey = `reservation_${i}_date`;
    const reservationGuestCountKey = `reservation_${i}_guestCount`;
    const reservationStartTimeKey = `reservation_${i}_startTime`;
    const reservationEndTimeKey = `reservation_${i}_endTime`;
    const reservationNotesKey = `reservation_${i}_notes`;
    
    const formReservationDate = formData.get(reservationDateKey) as string;
    if (formReservationDate === reservationDateStr) {
      // Ensure the day exists
      const { data: day, error: dayError } = await supabase
        .from('Day')
        .upsert({
          dateISO: reservationDate.toISOString(),
          weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(reservationDate)
        }, { onConflict: 'dateISO' })
        .select()
        .single();

      if (dayError || !day) {
        console.error('Day upsert failed:', dayError);
        continue;
      }

      const guestCountStr = formData.get(reservationGuestCountKey) as string;
      const startTime = formData.get(reservationStartTimeKey) as string | null;
      const endTime = formData.get(reservationEndTimeKey) as string | null;
      const reservationData: ReservationInsert = {
        dayId: day.id,
        hotelBookingId: bookingId,
        guestName: booking.guestName,
        guestCount: guestCountStr ? Number(guestCountStr) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: (formData.get(reservationNotesKey) as string) || null,
        isTourOperator: booking.isTourOperator || false,
      };

      const { error: entryError } = await supabase
        .from('Reservation')
        .insert(reservationData);

      if (entryError) {
        console.error('Reservation entry insert failed:', entryError);
      }
    }
  }

  // Revalidate all affected days
  const current = new Date(checkInDate);
  while (current < checkOutDate) {
    revalidatePath(`/day/${formatYmd(current)}`);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  revalidatePath(`/`);
  
  return { ok: true, data: booking };
}

export async function updateHotelBooking(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid booking ID' };
  }

  const checkInStr = formData.get("checkInDate") as string;
  const checkOutStr = formData.get("checkOutDate") as string;
  
  if (!checkInStr || !checkOutStr) {
    return { ok: false, error: 'Les dates d\'arrivée et de départ sont requises' };
  }

  const checkInDate = parseYmd(checkInStr);
  const checkOutDate = parseYmd(checkOutStr);

  // Validate dates are not in the past
  if (isPastDate(checkInDate)) {
    return { ok: false, error: 'Check-in date cannot be in the past' };
  }

  // Validate dates are within 1 year
  if (!isDateWithinOneYear(checkInDate)) {
    return { ok: false, error: 'Check-in date must be within 1 year from today' };
  }
  if (!isDateWithinOneYear(checkOutDate)) {
    return { ok: false, error: 'Check-out date must be within 1 year from today' };
  }

  if (checkOutDate <= checkInDate) {
    return { ok: false, error: 'Check-out date must be after check-in date' };
  }

  // Get existing booking to determine which days to revalidate
  const { data: existingBooking } = await supabase
    .from('HotelBooking')
    .select('checkInDate, checkOutDate')
    .eq('id', id)
    .single();

  // Ensure all days in the new booking range exist
  const endDateInclusive = addDays(checkOutDate, -1);
  const daysResult = await ensureDaysRange(checkInDate, endDateInclusive);
  if (!daysResult.ok) {
    return { ok: false, error: daysResult.error || 'Échec de la création des jours' };
  }

  // Update hotel booking (without room number)
  const guestCount = formData.get('guestCount');
  const updateData: HotelBookingUpdate = {
    guestName: (formData.get('guestName') as string) || null,
    guestCount: guestCount ? Number(guestCount) : null,
    checkInDate: checkInStr,
    checkOutDate: checkOutStr,
    notes: (formData.get('notes') as string) || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    updatedAt: new Date().toISOString(),
  };

  const { data: updatedBooking, error: updateError } = await supabase
    .from('HotelBooking')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Hotel booking update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  // Delete existing breakfast configurations and reservations for this booking
  await supabase
    .from('BreakfastConfiguration')
    .delete()
    .eq('hotelBookingId', id);

  await supabase.from('Reservation').delete().eq('hotelBookingId', id);

  // Recreate breakfast configurations for relevant days
  const breakfastDays = getBreakfastDays(checkInDate, checkOutDate);
  for (let i = 0; i < breakfastDays.length; i++) {
    const breakfastDate = breakfastDays[i];
    const breakfastDateStr = formatYmd(breakfastDate);
    
    const breakfastDateKey = `breakfast_${i}_date`;
    const breakfastBreakdownKey = `breakfast_${i}_tableBreakdown`;
    const breakfastNotesKey = `breakfast_${i}_notes`;
    
    const formBreakfastDate = formData.get(breakfastDateKey) as string;
    if (formBreakfastDate === breakfastDateStr) {
      const breakdownStr = formData.get(breakfastBreakdownKey) as string;
      if (breakdownStr) {
        const tableBreakdown = parseTableBreakdown(breakdownStr);
        if (tableBreakdown.length > 0) {
          const { data: day, error: dayError } = await supabase
            .from('Day')
            .upsert({
              dateISO: breakfastDate.toISOString(),
              weekday: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Brussels", weekday: "long" }).format(breakfastDate)
            }, { onConflict: 'dateISO' })
            .select()
            .single();

          if (dayError || !day) {
            console.error('Day upsert failed:', dayError);
            continue;
          }

          // Get table times if provided (first table's time becomes startTime)
          const tableTimesKey = `breakfast_${i}_tableTimes`;
          const tableTimesStr = formData.get(tableTimesKey) as string | null;
          let startTime: string | null = null;
          if (tableTimesStr) {
            const tableTimes = tableTimesStr.split('+').filter(t => t && t.trim());
            if (tableTimes.length > 0) {
              startTime = tableTimes[0].trim(); // Use first table's time as startTime
            }
          }

          const configData: BreakfastConfigurationInsert = {
            hotelBookingId: id,
            breakfastDate: breakfastDateStr,
            tableBreakdown: tableBreakdown,
            startTime: startTime,
            notes: (formData.get(breakfastNotesKey) as string) || null,
          };

          const { error: configError } = await supabase
            .from('BreakfastConfiguration')
            .insert(configData);

          if (configError) {
            console.error('Breakfast configuration insert failed:', configError);
          }
        }
      }
    }
  }

  // Recreate reservation entries for relevant days
  // Process all reservation entries from form data (they're indexed as reservation_0_date, reservation_1_date, etc.)
  let reservationIndex = 0
  while (true) {
    const reservationDateKey = `reservation_${reservationIndex}_date`
    const reservationGuestCountKey = `reservation_${reservationIndex}_guestCount`
    const reservationStartTimeKey = `reservation_${reservationIndex}_startTime`
    const reservationEndTimeKey = `reservation_${reservationIndex}_endTime`
    const reservationNotesKey = `reservation_${reservationIndex}_notes`
    
    const formReservationDate = formData.get(reservationDateKey) as string | null
    if (!formReservationDate) {
      // No more reservation entries
      break
    }
    
    // Validate the reservation date is within the booking range
    const reservationDate = parseYmd(formReservationDate)
    if (reservationDate < checkInDate || reservationDate > checkOutDate) {
      reservationIndex++
      continue
    }
    
    const { data: day, error: dayError } = await supabase
      .from('Day')
      .upsert({
        dateISO: reservationDate.toISOString(),
        weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(reservationDate)
      }, { onConflict: 'dateISO' })
      .select()
      .single();

    if (dayError || !day) {
      console.error('Day upsert failed:', dayError);
      reservationIndex++
      continue
    }

    const guestCountStr = formData.get(reservationGuestCountKey) as string | null
    const startTime = formData.get(reservationStartTimeKey) as string | null
    const endTime = formData.get(reservationEndTimeKey) as string | null
    const notes = formData.get(reservationNotesKey) as string | null
    
    // Process reservation: if guestCount is 0 or not provided, skip (reservation cleared)
    // Only create reservation if guest count is provided and > 0
    const guestCount = guestCountStr ? Number(guestCountStr) : 0
    if (guestCount > 0) {
      const reservationData: ReservationInsert = {
        dayId: day.id,
        hotelBookingId: id,
        guestName: updatedBooking?.guestName || null,
        guestCount: guestCount,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
        isTourOperator: updatedBooking?.isTourOperator || false,
      };

      const { error: entryError } = await supabase.from('Reservation').insert(reservationData);

      if (entryError) {
        return { ok: false, error: `Échec de la création de la réservation pour ${formReservationDate} : ${entryError.message}` };
      }
    }
    
    reservationIndex++
  }

  // Revalidate all affected days (old range + new range)
  const datesToRevalidate = new Set<string>();
  
  if (existingBooking) {
    const oldCheckIn = parseYmd(existingBooking.checkInDate);
    const oldCheckOut = parseYmd(existingBooking.checkOutDate);
    let current = new Date(oldCheckIn);
    while (current < oldCheckOut) {
      datesToRevalidate.add(formatYmd(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  
  let current = new Date(checkInDate);
  while (current < checkOutDate) {
    datesToRevalidate.add(formatYmd(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  datesToRevalidate.forEach(dateStr => {
    revalidatePath(`/day/${dateStr}`);
  });
  revalidatePath(`/`);
  
  return { ok: true };
}

export async function deleteHotelBooking(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid booking ID' };
  }

  // Get booking to determine which days to revalidate
  const { data: booking } = await supabase
    .from('HotelBooking')
    .select('checkInDate, checkOutDate')
    .eq('id', id)
    .single();

  // Delete booking (breakfast configs will cascade delete)
  const { error: deleteError } = await supabase
    .from('HotelBooking')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Hotel booking delete failed:', deleteError);
    return { ok: false, error: deleteError.message };
  }

  // Revalidate all affected days
  if (booking) {
    const checkInDate = parseYmd(booking.checkInDate);
    const checkOutDate = parseYmd(booking.checkOutDate);
    let current = new Date(checkInDate);
    while (current < checkOutDate) {
      revalidatePath(`/day/${formatYmd(current)}`);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  revalidatePath(`/`);
  
  return { ok: true };
}

export async function getHotelBookingsForDateRange(startDate: string, endDate: string): Promise<ActionResponse> {
  // Get all bookings that overlap with the date range
  // A booking overlaps if: checkInDate < endDate AND checkOutDate > startDate
  const { data: bookings, error } = await supabase
    .from('HotelBooking')
    .select('*')
    .lt('checkInDate', endDate)
    .gt('checkOutDate', startDate)
    .order('checkInDate', { ascending: true });

  if (error) {
    console.error('Failed to fetch hotel bookings:', error);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: bookings || [] };
}

// Helper functions for hotel booking date calculations
/**
 * Calculate breakfast days (excluding first day, including last day)
 * @param checkInDate - Check-in date
 * @param checkOutDate - Check-out date (exclusive)
 * @returns Array of dates for breakfast configuration
 */
function getBreakfastDays(checkInDate: Date, checkOutDate: Date): Date[] {
  const days: Date[] = []
  let current = addDays(checkInDate, 1) // Start from day after check-in
  while (current <= checkOutDate) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }
  return days
}

/**
 * Calculate reservation days (including first day and check-out day)
 * @param checkInDate - Check-in date
 * @param checkOutDate - Check-out date (exclusive, but reservation includes it)
 * @returns Array of dates for reservation configuration
 */
function getReservationDays(checkInDate: Date, checkOutDate: Date): Date[] {
  const days: Date[] = []
  let current = new Date(checkInDate)
  const lastReservationDate = checkOutDate // Include check-out day
  while (current <= lastReservationDate) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }
  return days
}

// Breakfast Configuration Actions
function parseTableBreakdown(breakdownStr: string | null): number[] {
  if (!breakdownStr || breakdownStr.trim() === '') {
    return [];
  }
  
  // Parse "3+2+1" format into array of numbers
  return breakdownStr
    .split('+')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => {
      const num = Number(s);
      return Number.isFinite(num) && num > 0 ? num : null;
    })
    .filter((n): n is number => n !== null);
}

export async function createBreakfastConfiguration(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const hotelBookingIdStr = formData.get("hotelBookingId") as string;
  if (!hotelBookingIdStr) {
    return { ok: false, error: 'La réservation d\'hôtel est requise' };
  }
  
  const hotelBookingId = Number(hotelBookingIdStr);
  if (!Number.isFinite(hotelBookingId) || hotelBookingId <= 0) {
    return { ok: false, error: 'ID de réservation d\'hôtel invalide' };
  }

  const breakfastDateStr = formData.get("breakfastDate") as string;
  if (!breakfastDateStr) {
    return { ok: false, error: 'La date du petit-déjeuner est requise' };
  }

  // Verify the booking exists and the breakfast date is within the booking range
  const { data: booking, error: bookingError } = await supabase
    .from('HotelBooking')
    .select('checkInDate, checkOutDate')
    .eq('id', hotelBookingId)
    .single();

  if (bookingError) {
    console.error('Error fetching hotel booking:', bookingError);
    return { ok: false, error: `Hotel booking not found: ${bookingError.message}` };
  }
  
  if (!booking) {
    return { ok: false, error: 'Hotel booking not found' };
  }

  const breakfastDate = parseYmd(breakfastDateStr);
  const checkInDate = parseYmd(booking.checkInDate);
  const checkOutDate = parseYmd(booking.checkOutDate);

  if (breakfastDate < checkInDate || breakfastDate >= checkOutDate) {
    return { ok: false, error: 'La date du petit-déjeuner doit être dans la plage de dates de réservation' };
  }

  // Parse table breakdown
  const breakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = parseTableBreakdown(breakdownStr);
  
  if (tableBreakdown.length === 0 && breakdownStr.trim() !== '') {
    return { ok: false, error: 'Format de répartition de table invalide. Utilisez un format comme "3+2+1"' };
  }

  // Ensure the day exists
  const { data: day, error: dayError } = await supabase
    .from('Day')
    .upsert({
      dateISO: breakfastDate.toISOString(),
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(breakfastDate)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Échec de la création du jour' };
  }

  // Insert breakfast configuration (totalGuests will be calculated by trigger)
  // Pass array directly - Supabase will convert to JSONB array
  const configData: BreakfastConfigurationInsert = {
    hotelBookingId: hotelBookingId,
    breakfastDate: breakfastDateStr,
    tableBreakdown: tableBreakdown, // Pass array directly, not stringified
    startTime: (formData.get('startTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };

  const { data: config, error: insertError } = await supabase
    .from('BreakfastConfiguration')
    .insert(configData)
    .select()
    .single();

  if (insertError) {
    console.error('Breakfast configuration insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

  revalidatePath(`/day/${breakfastDateStr}`);
  revalidatePath(`/`);
  
  return { ok: true, data: config };
}

export async function updateBreakfastConfiguration(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de configuration de petit-déjeuner invalide' };
  }

  const breakfastDateStr = formData.get("breakfastDate") as string;
  if (!breakfastDateStr) {
    return { ok: false, error: 'La date du petit-déjeuner est requise' };
  }

  // Get existing config to check booking
  const { data: existingConfig, error: fetchError } = await supabase
    .from('BreakfastConfiguration')
    .select('hotelBookingId, breakfastDate, hotelBooking:HotelBooking(checkInDate, checkOutDate)')
    .eq('id', id)
    .single();

  if (fetchError || !existingConfig) {
    return { ok: false, error: 'Breakfast configuration not found' };
  }

  const hotelBookingId = existingConfig.hotelBookingId;
  const booking = existingConfig.hotelBooking as { checkInDate: string; checkOutDate: string } | null;

  if (!booking) {
    return { ok: false, error: 'Hotel booking not found' };
  }

  // Verify the breakfast date is within the booking range
  const breakfastDate = parseYmd(breakfastDateStr);
  const checkInDate = parseYmd(booking.checkInDate);
  const checkOutDate = parseYmd(booking.checkOutDate);

  if (breakfastDate < checkInDate || breakfastDate >= checkOutDate) {
    return { ok: false, error: 'La date du petit-déjeuner doit être dans la plage de dates de réservation' };
  }

  // Parse table breakdown
  const breakdownStr = (formData.get('tableBreakdown') as string) || '';
  const tableBreakdown = parseTableBreakdown(breakdownStr);
  
  if (tableBreakdown.length === 0 && breakdownStr.trim() !== '') {
    return { ok: false, error: 'Format de répartition de table invalide. Utilisez un format comme "3+2+1"' };
  }

  // Update breakfast configuration
  // Pass array directly - Supabase will convert to JSONB array
  const updateData: BreakfastConfigurationUpdate = {
    breakfastDate: breakfastDateStr,
    tableBreakdown: tableBreakdown, // Pass array directly, not stringified
    startTime: (formData.get('startTime') as string) || null,
    notes: (formData.get('notes') as string) || null,
    updatedAt: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('BreakfastConfiguration')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('Breakfast configuration update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  // Revalidate old and new dates
  const oldDateStr = existingConfig.breakfastDate;
  revalidatePath(`/day/${oldDateStr}`);
  if (oldDateStr !== breakfastDateStr) {
    revalidatePath(`/day/${breakfastDateStr}`);
  }
  revalidatePath(`/`);
  
  return { ok: true };
}

export async function deleteBreakfastConfiguration(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get("id") as string;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de configuration de petit-déjeuner invalide' };
  }

  // Get config to determine which day to revalidate
  const { data: config } = await supabase
    .from('BreakfastConfiguration')
    .select('breakfastDate')
    .eq('id', id)
    .single();

  // Delete breakfast configuration
  const { error: deleteError } = await supabase
    .from('BreakfastConfiguration')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Breakfast configuration delete failed:', deleteError);
    return { ok: false, error: deleteError.message };
  }

  // Revalidate affected day
  if (config) {
    revalidatePath(`/day/${config.breakfastDate}`);
  }
  revalidatePath(`/`);
  
  return { ok: true };
}

export async function getBreakfastConfigurationsForDay(dateStr: string): Promise<ActionResponse> {
  const { data: configs, error } = await supabase
    .from('BreakfastConfiguration')
    .select('*, hotelBooking:HotelBooking(*)')
    .eq('breakfastDate', dateStr)
    .order('startTime', { ascending: true, nullsFirst: true });

  if (error) {
    console.error('Failed to fetch breakfast configurations:', error);
    return { ok: false, error: error.message, data: [] };
  }

  return { ok: true, data: configs || [] };
}
