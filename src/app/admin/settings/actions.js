"use server";

import supabase from "../../../lib/supabase";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all Point of Contact records (public read access)
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getAllPOCs() {
  try {
    const { data, error } = await supabase
      .from('PointOfContact')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching POCs:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching POCs:', error);
    return { ok: false, error: 'Failed to fetch POCs' };
  }
}

/**
 * Create a new Point of Contact
 * @param {FormData} formData - Form data containing POC details
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function createPOC(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const name = formData.get('name');
  if (!name || !name.trim()) {
    return { ok: false, error: 'Name is required' };
  }

  const email = formData.get('email')?.trim() || null;
  const phoneNumber = formData.get('phoneNumber')?.trim() || null;
  const nameTrimmed = name.trim();

  try {
    // Check for duplicate name (case-insensitive)
    if (nameTrimmed) {
      const { data: existingName } = await supabase
        .from('PointOfContact')
        .select('id, name')
        .ilike('name', nameTrimmed)
        .single();
      
      if (existingName) {
        return { ok: false, error: 'A POC with this name already exists' };
      }
    }

    // Check for duplicate email (case-insensitive, if provided)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('PointOfContact')
        .select('id, email')
        .ilike('email', email)
        .single();
      
      if (existingEmail) {
        return { ok: false, error: 'A POC with this email already exists' };
      }
    }

    // Check for duplicate phone number (if provided)
    if (phoneNumber) {
      const { data: existingPhone } = await supabase
        .from('PointOfContact')
        .select('id, phoneNumber')
        .eq('phoneNumber', phoneNumber)
        .single();
      
      if (existingPhone) {
        return { ok: false, error: 'A POC with this phone number already exists' };
      }
    }

    const { data: newPOC, error } = await supabase
      .from('PointOfContact')
      .insert({
        name: nameTrimmed,
        role: formData.get('role')?.trim() || null,
        phoneNumber: phoneNumber,
        email: email,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating POC:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return { ok: false, error: 'A POC with this name already exists' };
        } else if (error.message.includes('email')) {
          return { ok: false, error: 'A POC with this email already exists' };
        } else if (error.message.includes('phone')) {
          return { ok: false, error: 'A POC with this phone number already exists' };
        }
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true, data: newPOC };
  } catch (error) {
    console.error('Error creating POC:', error);
    return { ok: false, error: 'Failed to create POC' };
  }
}

/**
 * Update an existing Point of Contact
 * @param {FormData} formData - Form data containing POC details and ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updatePOC(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get('id');
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid POC ID' };
  }

  const name = formData.get('name');
  if (!name || !name.trim()) {
    return { ok: false, error: 'Name is required' };
  }

  const email = formData.get('email')?.trim() || null;
  const phoneNumber = formData.get('phoneNumber')?.trim() || null;
  const nameTrimmed = name.trim();

  try {
    // Check for duplicate name (case-insensitive, excluding current POC)
    if (nameTrimmed) {
      const { data: existingName } = await supabase
        .from('PointOfContact')
        .select('id, name')
        .ilike('name', nameTrimmed)
        .neq('id', id)
        .single();
      
      if (existingName) {
        return { ok: false, error: 'A POC with this name already exists' };
      }
    }

    // Check for duplicate email (case-insensitive, excluding current POC, if provided)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('PointOfContact')
        .select('id, email')
        .ilike('email', email)
        .neq('id', id)
        .single();
      
      if (existingEmail) {
        return { ok: false, error: 'A POC with this email already exists' };
      }
    }

    // Check for duplicate phone number (excluding current POC, if provided)
    if (phoneNumber) {
      const { data: existingPhone } = await supabase
        .from('PointOfContact')
        .select('id, phoneNumber')
        .eq('phoneNumber', phoneNumber)
        .neq('id', id)
        .single();
      
      if (existingPhone) {
        return { ok: false, error: 'A POC with this phone number already exists' };
      }
    }

    const { error } = await supabase
      .from('PointOfContact')
      .update({
        name: nameTrimmed,
        role: formData.get('role')?.trim() || null,
        phoneNumber: phoneNumber,
        email: email,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating POC:', error);
      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return { ok: false, error: 'A POC with this name already exists' };
        } else if (error.message.includes('email')) {
          return { ok: false, error: 'A POC with this email already exists' };
        } else if (error.message.includes('phone')) {
          return { ok: false, error: 'A POC with this phone number already exists' };
        }
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (error) {
    console.error('Error updating POC:', error);
    return { ok: false, error: 'Failed to update POC' };
  }
}

/**
 * Delete a Point of Contact
 * @param {FormData} formData - Form data containing POC ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deletePOC(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get('id');
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid POC ID' };
  }

  try {
    // Check if POC is referenced in any entries
    const { data: entries, error: checkError } = await supabase
      .from('Entry')
      .select('id')
      .eq('pocId', id)
      .limit(1);

    if (checkError) {
      console.error('Error checking POC references:', checkError);
      return { ok: false, error: 'Failed to check POC usage' };
    }

    if (entries && entries.length > 0) {
      return { ok: false, error: 'Cannot delete POC: it is referenced in one or more entries' };
    }

    const { error } = await supabase
      .from('PointOfContact')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting POC:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (error) {
    console.error('Error deleting POC:', error);
    return { ok: false, error: 'Failed to delete POC' };
  }
}

/**
 * Get all Venue Type records (public read access)
 * @returns {Promise<{ok: boolean, data?: Array, error?: string}>}
 */
export async function getAllVenueTypes() {
  try {
    const { data, error } = await supabase
      .from('VenueType')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching venue types:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching venue types:', error);
    return { ok: false, error: 'Failed to fetch venue types' };
  }
}

/**
 * Create a new Venue Type
 * @param {FormData} formData - Form data containing venue type details
 * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
 */
export async function createVenueType(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const name = formData.get('name');
  if (!name || !name.trim()) {
    return { ok: false, error: 'Name is required' };
  }

  // Generate code from name (lowercase, replace spaces with hyphens)
  const code = (formData.get('code') || name.trim().toLowerCase().replace(/\s+/g, '-')).trim();

  try {
    // Check for duplicate name
    const { data: existingName } = await supabase
      .from('VenueType')
      .select('id')
      .eq('name', name.trim())
      .single();
    
    if (existingName) {
      return { ok: false, error: 'A venue type with this name already exists' };
    }

    // Check for duplicate code
    const { data: existingCode } = await supabase
      .from('VenueType')
      .select('id')
      .eq('code', code)
      .single();
    
    if (existingCode) {
      return { ok: false, error: 'A venue type with this code already exists' };
    }

    const { data: newVenueType, error } = await supabase
      .from('VenueType')
      .insert({
        name: name.trim(),
        code: code,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating venue type:', error);
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return { ok: false, error: 'A venue type with this name already exists' };
        } else if (error.message.includes('code')) {
          return { ok: false, error: 'A venue type with this code already exists' };
        }
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true, data: newVenueType };
  } catch (error) {
    console.error('Error creating venue type:', error);
    return { ok: false, error: 'Failed to create venue type' };
  }
}

/**
 * Update an existing Venue Type
 * @param {FormData} formData - Form data containing venue type details and ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updateVenueType(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get('id');
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid venue type ID' };
  }

  const name = formData.get('name');
  if (!name || !name.trim()) {
    return { ok: false, error: 'Name is required' };
  }

  const code = (formData.get('code') || name.trim().toLowerCase().replace(/\s+/g, '-')).trim();

  try {
    // Check for duplicate name (excluding current venue type)
    const { data: existingName } = await supabase
      .from('VenueType')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single();
    
    if (existingName) {
      return { ok: false, error: 'A venue type with this name already exists' };
    }

    // Check for duplicate code (excluding current venue type)
    const { data: existingCode } = await supabase
      .from('VenueType')
      .select('id')
      .eq('code', code)
      .neq('id', id)
      .single();
    
    if (existingCode) {
      return { ok: false, error: 'A venue type with this code already exists' };
    }

    const { error } = await supabase
      .from('VenueType')
      .update({
        name: name.trim(),
        code: code,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating venue type:', error);
      if (error.code === '23505') {
        if (error.message.includes('name')) {
          return { ok: false, error: 'A venue type with this name already exists' };
        } else if (error.message.includes('code')) {
          return { ok: false, error: 'A venue type with this code already exists' };
        }
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (error) {
    console.error('Error updating venue type:', error);
    return { ok: false, error: 'Failed to update venue type' };
  }
}

/**
 * Delete a Venue Type
 * @param {FormData} formData - Form data containing venue type ID
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function deleteVenueType(formData) {
  if (!(await isEditor())) {
    return { ok: false, error: 'Not authenticated' };
  }

  const idStr = formData.get('id');
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid venue type ID' };
  }

  try {
    // Check if venue type is referenced in any entries
    const { data: entries, error: checkError } = await supabase
      .from('Entry')
      .select('id')
      .eq('venueTypeId', id)
      .limit(1);

    if (checkError) {
      console.error('Error checking venue type references:', checkError);
      return { ok: false, error: 'Failed to check venue type usage' };
    }

    if (entries && entries.length > 0) {
      return { ok: false, error: 'Cannot delete venue type: it is referenced in one or more entries' };
    }

    const { error } = await supabase
      .from('VenueType')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting venue type:', error);
      return { ok: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    return { ok: true };
  } catch (error) {
    console.error('Error deleting venue type:', error);
    return { ok: false, error: 'Failed to delete venue type' };
  }
}

