"use server";

import supabase from "../../../lib/supabase";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";
import { ensureDaysRange } from "../../actions/days";
import { parseYmd, formatYmd, addDays, isDateWithinOneYear, isPastDate, getTodayBrusselsUtc, getBrusselsYmd, dateFromYmdUtc } from "../../../lib/day-utils";

/**
 * Calculate the next occurrence date based on frequency
 * @param {Date} currentDate - Current date
 * @param {string} frequency - 'weekly', 'biweekly', 'monthly', 'yearly'
 * @returns {Date} Next occurrence date
 */
function getNextOccurrenceDate(currentDate, frequency) {
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
 * @param {Date} startDate - First occurrence date
 * @param {string} frequency - 'weekly', 'biweekly', 'monthly', 'yearly'
 * @param {Date} endDate - Last date to generate occurrences (typically 1 year from start)
 * @returns {Date[]} Array of occurrence dates
 */
function generateRecurrenceDates(startDate, frequency, endDate) {
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

export async function createPDJGroup(formData) {
  console.log('createPDJGroup called with:', Object.fromEntries(formData.entries()));
  const isEditorResult = await isEditor();
  console.log('isEditor result:', isEditorResult);
  
  if (!isEditorResult) {
    console.log('Not authenticated as editor');
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Cannot create entries for past dates' };
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
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Insert entry - direct field mapping
  const { data: entry, error: insertError } = await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'breakfast',
    guestName: formData.get('guestName') || null,
    roomNumber: formData.get('roomNumber') || null,
    guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    notes: formData.get('notes') || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
  });

  if (insertError) {
    console.error('Entry insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createHotelGuest(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Cannot create entries for past dates' };
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
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Insert entry - direct field mapping
  const { data: entry, error: insertError } = await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'hotel',
    guestName: formData.get('guestName') || null,
    roomNumber: formData.get('roomNumber') || null,
    guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    notes: formData.get('notes') || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
  });

  if (insertError) {
    console.error('Entry insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

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
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Cannot create entries for past dates' };
  }

  // Validate date is within 1 year
  if (!isDateWithinOneYear(date)) {
    return { ok: false, error: 'Date must be within 1 year from today' };
  }

  const pocValue = formData.get("poc");
  let pocId = null;

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
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Handle venue type
  const venueTypeValue = formData.get('venueType');
  let venueTypeId = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring entries
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = formData.get('recurrenceFrequency') || null;
  
  const entryData = {
    type: 'golf',
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    guestCount: formData.get('size') ? Number(formData.get('size')) : null,
    capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    notes: formData.get('notes') || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    isRecurring: isRecurring,
    recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
  };

  if (isRecurring && recurrenceFrequency) {
    // Generate all occurrence dates up to 1 year from start date
    const oneYearFromStart = addDays(date, 365);
    const occurrenceDates = generateRecurrenceDates(date, recurrenceFrequency, oneYearFromStart);
    
    // Create entries for all occurrences
    const entriesToInsert = [];
    const datesToRevalidate = new Set([dateStr]);
    
    for (const occurrenceDate of occurrenceDates) {
      const occurrenceDateStr = formatYmd(occurrenceDate);
      datesToRevalidate.add(occurrenceDateStr);
      
      // Upsert day for this occurrence
      const { data: occurrenceDay, error: dayErr } = await supabase
        .from('Day')
        .upsert({
          dateISO: occurrenceDate.toISOString(),
          weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(occurrenceDate)
        }, { onConflict: 'dateISO' })
        .select()
        .single();
      
      if (dayErr || !occurrenceDay) {
        console.error(`Day upsert failed for ${occurrenceDateStr}:`, dayErr);
        continue; // Skip this occurrence but continue with others
      }
      
      entriesToInsert.push({
        ...entryData,
        dayId: occurrenceDay.id,
      });
    }
    
    // Insert all entries in a batch
    if (entriesToInsert.length > 0) {
      const { error: insertError } = await supabase.from('Entry').insert(entriesToInsert);
      
      if (insertError) {
        console.error('Recurring entries insert failed:', insertError);
        return { ok: false, error: insertError.message };
      }
      
      // Revalidate all affected dates
      datesToRevalidate.forEach(dateStr => {
        revalidatePath(`/day/${dateStr}`);
      });
      revalidatePath(`/`);
      
      return { ok: true, count: entriesToInsert.length };
    }
  } else {
    // Single entry (non-recurring)
    const { data: entry, error: insertError } = await supabase.from('Entry').insert({
      ...entryData,
      dayId: day.id,
    });

    if (insertError) {
      console.error('Entry insert failed:', insertError);
      return { ok: false, error: insertError.message };
    }

    revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
}

// Helper function to find all occurrences of a recurring entry
async function findRecurringOccurrences(entryId, entryType) {
  // First, get the entry to find its identifying fields
  const { data: entry, error: entryError } = await supabase
    .from('Entry')
    .select('*')
    .eq('id', entryId)
    .single();

  if (entryError || !entry || !entry.isRecurring) {
    return [];
  }

  // Build query to find all matching recurring entries
  let query = supabase
    .from('Entry')
    .select('id, dayId, Day!inner(dateISO)')
    .eq('type', entryType)
    .eq('isRecurring', true)
    .eq('recurrenceFrequency', entry.recurrenceFrequency);

  // Match on identifying fields based on entry type
  if (entryType === 'event') {
    if (entry.title) query = query.eq('title', entry.title);
    if (entry.pocId) query = query.eq('pocId', entry.pocId);
    if (entry.venueTypeId) query = query.eq('venueTypeId', entry.venueTypeId);
    if (entry.startTime) query = query.eq('startTime', entry.startTime);
    if (entry.endTime) query = query.eq('endTime', entry.endTime);
  } else if (entryType === 'golf') {
    if (entry.label) query = query.eq('label', entry.label);
    if (entry.pocId) query = query.eq('pocId', entry.pocId);
    if (entry.time) query = query.eq('time', entry.time);
  }

  const { data: occurrences, error } = await query;

  if (error) {
    console.error('Error finding recurring occurrences:', error);
    return [];
  }

  return occurrences || [];
}

// Count recurring occurrences (excluding the current entry)
export async function countRecurringOccurrences(entryId, entryType) {
  const occurrences = await findRecurringOccurrences(entryId, entryType);
  // Exclude the current entry from the count
  return Math.max(0, occurrences.length - 1);
}

export async function deleteGolfEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const deleteAllRecurring = formData.get("deleteAllRecurring") === 'true';
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  if (deleteAllRecurring) {
    // Delete all occurrences of this recurring entry
    const occurrences = await findRecurringOccurrences(id, 'golf');
    const idsToDelete = occurrences.map(o => o.id);
    
    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from('Entry')
        .delete()
        .in('id', idsToDelete);
      
      if (error) {
        console.error('Error deleting recurring occurrences:', error);
        return { ok: false, error: error.message };
      }

      // Revalidate all affected dates
      const datesToRevalidate = new Set([dateStr]);
      for (const occ of occurrences) {
        if (occ.Day?.dateISO) {
          const dateStr = occ.Day.dateISO.split('T')[0];
          datesToRevalidate.add(dateStr);
        }
      }
      
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: idsToDelete.length };
    }
  }
  
  // Delete single entry
  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function createEventEntry(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Cannot create entries for past dates' };
  }

  // Validate date is within 1 year
  if (!isDateWithinOneYear(date)) {
    return { ok: false, error: 'Date must be within 1 year from today' };
  }

  const pocValue = formData.get("poc");
  let pocId = null;

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
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Handle venue type
  const venueTypeValue = formData.get('venueType');
  let venueTypeId = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring entries
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = formData.get('recurrenceFrequency') || null;
  
  const entryData = {
    type: 'event',
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    guestCount: formData.get('size') ? Number(formData.get('size')) : null,
    capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
    venueTypeId: venueTypeId,
    pocId: pocId,
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    notes: formData.get('notes') || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
    isRecurring: isRecurring,
    recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
  };

  if (isRecurring && recurrenceFrequency) {
    // Generate all occurrence dates up to 1 year from start date
    const oneYearFromStart = addDays(date, 365);
    const occurrenceDates = generateRecurrenceDates(date, recurrenceFrequency, oneYearFromStart);
    
    // Create entries for all occurrences
    const entriesToInsert = [];
    const datesToRevalidate = new Set([dateStr]);
    
    for (const occurrenceDate of occurrenceDates) {
      const occurrenceDateStr = formatYmd(occurrenceDate);
      datesToRevalidate.add(occurrenceDateStr);
      
      // Upsert day for this occurrence
      const { data: occurrenceDay, error: dayErr } = await supabase
        .from('Day')
        .upsert({
          dateISO: occurrenceDate.toISOString(),
          weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(occurrenceDate)
        }, { onConflict: 'dateISO' })
        .select()
        .single();
      
      if (dayErr || !occurrenceDay) {
        console.error(`Day upsert failed for ${occurrenceDateStr}:`, dayErr);
        continue; // Skip this occurrence but continue with others
      }
      
      entriesToInsert.push({
        ...entryData,
        dayId: occurrenceDay.id,
      });
    }
    
    // Insert all entries in a batch
    if (entriesToInsert.length > 0) {
      const { error: insertError } = await supabase.from('Entry').insert(entriesToInsert);
      
      if (insertError) {
        console.error('Recurring entries insert failed:', insertError);
        return { ok: false, error: insertError.message };
      }
      
      // Revalidate all affected dates
      datesToRevalidate.forEach(dateStr => {
        revalidatePath(`/day/${dateStr}`);
      });
      revalidatePath(`/`);
      
      return { ok: true, count: entriesToInsert.length };
    }
  } else {
    // Single entry (non-recurring)
    const { data: entry, error: insertError } = await supabase.from('Entry').insert({
      ...entryData,
      dayId: day.id,
    });

    if (insertError) {
      console.error('Entry insert failed:', insertError);
      return { ok: false, error: insertError.message };
    }

    revalidatePath(`/day/${dateStr}`);
    revalidatePath(`/`);
    return { ok: true };
  }
}

export async function deleteEventEntry(formData) {
  if (!(await isEditor())) return { ok: false };
  const idStr = formData.get("id");
  const dateStr = formData.get("date");
  const deleteAllRecurring = formData.get("deleteAllRecurring") === 'true';
  const id = Number(idStr);
  if (!Number.isFinite(id)) return { ok: false };
  
  if (deleteAllRecurring) {
    // Delete all occurrences of this recurring entry
    const occurrences = await findRecurringOccurrences(id, 'event');
    const idsToDelete = occurrences.map(o => o.id);
    
    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from('Entry')
        .delete()
        .in('id', idsToDelete);
      
      if (error) {
        console.error('Error deleting recurring occurrences:', error);
        return { ok: false, error: error.message };
      }

      // Revalidate all affected dates
      const datesToRevalidate = new Set([dateStr]);
      for (const occ of occurrences) {
        if (occ.Day?.dateISO) {
          const dateStr = occ.Day.dateISO.split('T')[0];
          datesToRevalidate.add(dateStr);
        }
      }
      
      datesToRevalidate.forEach(d => revalidatePath(`/day/${d}`));
      revalidatePath(`/`);
      return { ok: true, count: idsToDelete.length };
    }
  }
  
  // Delete single entry
  await supabase.from('Entry').delete().eq('id', id);
  if (dateStr) revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}
export async function createReservationEntry(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const date = parseYmd(dateStr);

  // Validate date is not in the past
  if (isPastDate(date)) {
    return { ok: false, error: 'Cannot create entries for past dates' };
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
      weekday: new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "long" }).format(date)
    }, { onConflict: 'dateISO' })
    .select()
    .single();

  if (dayError || !day) {
    console.error('Day upsert failed:', dayError);
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Insert entry - direct field mapping
  const { data: entry, error: insertError } = await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'reservation',
    guestName: formData.get('guestName') || null,
    phoneNumber: formData.get('phoneNumber') || null,
    email: formData.get('email') || null,
    guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
    startTime: formData.get('startTime') || null,
    endTime: formData.get('endTime') || null,
    notes: formData.get('notes') || null,
    isTourOperator: formData.get('isTourOperator') === 'on',
  });

  if (insertError) {
    console.error('Entry insert failed:', insertError);
    return { ok: false, error: insertError.message };
  }

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

export async function updatePDJGroup(formData) {
  console.log('updatePDJGroup called with:', Object.fromEntries(formData.entries()));
  const isEditorResult = await isEditor();
  console.log('isEditor result:', isEditorResult);
  
  if (!isEditorResult) {
    console.log('Not authenticated as editor');
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date");

  // Update entry - direct field mapping
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      guestName: formData.get('guestName') || null,
      roomNumber: formData.get('roomNumber') || null,
      guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
      startTime: formData.get('startTime') || null,
      endTime: formData.get('endTime') || null,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
    })
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateHotelGuest(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date");

  // Update entry - direct field mapping
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      guestName: formData.get('guestName') || null,
      roomNumber: formData.get('roomNumber') || null,
      guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
      startTime: formData.get('startTime') || null,
      endTime: formData.get('endTime') || null,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
    })
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateGolfEntry(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date");
  const pocValue = formData.get("poc");
  let pocId = null;

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

  // Handle venue type
  const venueTypeValue = formData.get('venueType');
  let venueTypeId = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring fields
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = formData.get('recurrenceFrequency') || null;

  // Update entry with POC reference
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      title: formData.get('title') || null,
      description: formData.get('description') || null,
      guestCount: formData.get('size') ? Number(formData.get('size')) : null,
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      venueTypeId: venueTypeId,
      pocId: pocId,
      startTime: formData.get('startTime') || null,
      endTime: formData.get('endTime') || null,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
      isRecurring: isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateEventEntry(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date");
  const pocValue = formData.get("poc");
  let pocId = null;

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

  // Handle venue type
  const venueTypeValue = formData.get('venueType');
  let venueTypeId = null;
  if (venueTypeValue) {
    const venueTypeNum = Number(venueTypeValue);
    if (Number.isFinite(venueTypeNum)) {
      venueTypeId = venueTypeNum;
    }
  }

  // Handle recurring fields
  const isRecurring = formData.get('isRecurring') === 'true';
  const recurrenceFrequency = formData.get('recurrenceFrequency') || null;

  // Update entry with POC reference
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      title: formData.get('title') || null,
      description: formData.get('description') || null,
      guestCount: formData.get('size') ? Number(formData.get('size')) : null,
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      venueTypeId: venueTypeId,
      pocId: pocId,
      startTime: formData.get('startTime') || null,
      endTime: formData.get('endTime') || null,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
      isRecurring: isRecurring,
      recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/day/${dateStr}`);
  revalidatePath(`/`);
  return { ok: true };
}

export async function updateReservationEntry(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid entry ID' };
  }

  const dateStr = formData.get("date");

  // Update entry - direct field mapping
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      guestName: formData.get('guestName') || null,
      phoneNumber: formData.get('phoneNumber') || null,
      email: formData.get('email') || null,
      guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
      startTime: formData.get('startTime') || null,
      endTime: formData.get('endTime') || null,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
    })
    .eq('id', id);

  if (updateError) {
    console.error('Entry update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(`/day/${dateStr}`);
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

// Hotel Booking Actions
export async function createHotelBooking(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const checkInStr = formData.get("checkInDate");
  const checkOutStr = formData.get("checkOutDate");
  
  if (!checkInStr || !checkOutStr) {
    return { ok: false, error: 'Check-in and check-out dates are required' };
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
    return { ok: false, error: daysResult.error || 'Failed to ensure days exist' };
  }

  // Insert hotel booking
  const { data: booking, error: insertError } = await supabase
    .from('HotelBooking')
    .insert({
      guestName: formData.get('guestName') || null,
      roomNumber: formData.get('roomNumber') || null,
      guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
    })
    .select()
    .single();

  if (insertError) {
    console.error('Hotel booking insert failed:', insertError);
    return { ok: false, error: insertError.message };
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

export async function updateHotelBooking(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid booking ID' };
  }

  const checkInStr = formData.get("checkInDate");
  const checkOutStr = formData.get("checkOutDate");
  
  if (!checkInStr || !checkOutStr) {
    return { ok: false, error: 'Check-in and check-out dates are required' };
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
    return { ok: false, error: daysResult.error || 'Failed to ensure days exist' };
  }

  // Update hotel booking
  const { error: updateError } = await supabase
    .from('HotelBooking')
    .update({
      guestName: formData.get('guestName') || null,
      roomNumber: formData.get('roomNumber') || null,
      guestCount: formData.get('guestCount') ? Number(formData.get('guestCount')) : null,
      checkInDate: checkInStr,
      checkOutDate: checkOutStr,
      notes: formData.get('notes') || null,
      isTourOperator: formData.get('isTourOperator') === 'on',
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('Hotel booking update failed:', updateError);
    return { ok: false, error: updateError.message };
  }

  // Revalidate all affected days (old range + new range)
  const datesToRevalidate = new Set();
  
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

export async function deleteHotelBooking(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
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

export async function getHotelBookingsForDateRange(startDate, endDate) {
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

// Breakfast Configuration Actions
function parseTableBreakdown(breakdownStr) {
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
    .filter(n => n !== null);
}

export async function createBreakfastConfiguration(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const hotelBookingIdStr = formData.get("hotelBookingId");
  if (!hotelBookingIdStr) {
    return { ok: false, error: 'Hotel booking is required' };
  }
  
  const hotelBookingId = Number(hotelBookingIdStr);
  if (!Number.isFinite(hotelBookingId) || hotelBookingId <= 0) {
    return { ok: false, error: 'Invalid hotel booking ID' };
  }

  const breakfastDateStr = formData.get("breakfastDate");
  if (!breakfastDateStr) {
    return { ok: false, error: 'Breakfast date is required' };
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
    return { ok: false, error: 'Breakfast date must be within the booking date range' };
  }

  // Parse table breakdown
  const breakdownStr = formData.get('tableBreakdown') || '';
  const tableBreakdown = parseTableBreakdown(breakdownStr);
  
  if (tableBreakdown.length === 0 && breakdownStr.trim() !== '') {
    return { ok: false, error: 'Invalid table breakdown format. Use format like "3+2+1"' };
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
    return { ok: false, error: dayError?.message || 'Failed to create day' };
  }

  // Insert breakfast configuration (totalGuests will be calculated by trigger)
  // Pass array directly - Supabase will convert to JSONB array
  const { data: config, error: insertError } = await supabase
    .from('BreakfastConfiguration')
    .insert({
      hotelBookingId: hotelBookingId,
      breakfastDate: breakfastDateStr,
      tableBreakdown: tableBreakdown, // Pass array directly, not stringified
      startTime: formData.get('startTime') || null,
      notes: formData.get('notes') || null,
    })
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

export async function updateBreakfastConfiguration(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid breakfast configuration ID' };
  }

  const breakfastDateStr = formData.get("breakfastDate");
  if (!breakfastDateStr) {
    return { ok: false, error: 'Breakfast date is required' };
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
  const booking = existingConfig.hotelBooking;

  // Verify the breakfast date is within the booking range
  const breakfastDate = parseYmd(breakfastDateStr);
  const checkInDate = parseYmd(booking.checkInDate);
  const checkOutDate = parseYmd(booking.checkOutDate);

  if (breakfastDate < checkInDate || breakfastDate >= checkOutDate) {
    return { ok: false, error: 'Breakfast date must be within the booking date range' };
  }

  // Parse table breakdown
  const breakdownStr = formData.get('tableBreakdown') || '';
  const tableBreakdown = parseTableBreakdown(breakdownStr);
  
  if (tableBreakdown.length === 0 && breakdownStr.trim() !== '') {
    return { ok: false, error: 'Invalid table breakdown format. Use format like "3+2+1"' };
  }

  // Update breakfast configuration
  // Pass array directly - Supabase will convert to JSONB array
  const { error: updateError } = await supabase
    .from('BreakfastConfiguration')
    .update({
      breakfastDate: breakfastDateStr,
      tableBreakdown: tableBreakdown, // Pass array directly, not stringified
      startTime: formData.get('startTime') || null,
      notes: formData.get('notes') || null,
      updatedAt: new Date().toISOString(),
    })
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

export async function deleteBreakfastConfiguration(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get("id");
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid breakfast configuration ID' };
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

export async function getBreakfastConfigurationsForDay(dateStr) {
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


