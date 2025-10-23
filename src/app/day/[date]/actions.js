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
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

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
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

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
  const pocName = formData.get("poc");
  let pocId = null;

  // Create or find POC if provided
  if (pocName) {
    const { data: poc, error: pocError } = await supabase
      .from('PointOfContact')
      .insert({ name: pocName })
      .select()
      .single();
    
    if (pocError) {
      console.error('POC creation failed:', pocError);
      // Continue without POC rather than failing
    } else {
      pocId = poc.id;
    }
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

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

  // Insert entry with POC reference
  const { data: entry, error: insertError } = await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'golf',
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    guestCount: formData.get('size') ? Number(formData.get('size')) : null,
    capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
    location: formData.get('venueType') || null,
    pocId: pocId,
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
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const pocName = formData.get("poc");
  let pocId = null;

  // Create or find POC if provided
  if (pocName) {
    const { data: poc, error: pocError } = await supabase
      .from('PointOfContact')
      .insert({ name: pocName })
      .select()
      .single();
    
    if (pocError) {
      console.error('POC creation failed:', pocError);
      // Continue without POC rather than failing
    } else {
      pocId = poc.id;
    }
  }

  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

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

  // Insert entry with POC reference
  const { data: entry, error: insertError } = await supabase.from('Entry').insert({
    dayId: day.id,
    type: 'event',
    title: formData.get('title') || null,
    description: formData.get('description') || null,
    guestCount: formData.get('size') ? Number(formData.get('size')) : null,
    capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
    location: formData.get('venueType') || null,
    pocId: pocId,
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
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const dateStr = formData.get("date");
  const [y, m, d] = dateStr.split("-").map((n) => Number(n));
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

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
  const pocName = formData.get("poc");
  let pocId = null;

  // Create or find POC if provided
  if (pocName) {
    const { data: poc, error: pocError } = await supabase
      .from('PointOfContact')
      .insert({ name: pocName })
      .select()
      .single();
    
    if (pocError) {
      console.error('POC creation failed:', pocError);
      // Continue without POC rather than failing
    } else {
      pocId = poc.id;
    }
  }

  // Update entry with POC reference
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      title: formData.get('title') || null,
      description: formData.get('description') || null,
      guestCount: formData.get('size') ? Number(formData.get('size')) : null,
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      location: formData.get('venueType') || null,
      pocId: pocId,
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
  const pocName = formData.get("poc");
  let pocId = null;

  // Create or find POC if provided
  if (pocName) {
    const { data: poc, error: pocError } = await supabase
      .from('PointOfContact')
      .insert({ name: pocName })
      .select()
      .single();
    
    if (pocError) {
      console.error('POC creation failed:', pocError);
      // Continue without POC rather than failing
    } else {
      pocId = poc.id;
    }
  }

  // Update entry with POC reference
  const { error: updateError } = await supabase
    .from('Entry')
    .update({
      title: formData.get('title') || null,
      description: formData.get('description') || null,
      guestCount: formData.get('size') ? Number(formData.get('size')) : null,
      capacity: formData.get('capacity') ? Number(formData.get('capacity')) : null,
      location: formData.get('venueType') || null,
      pocId: pocId,
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


