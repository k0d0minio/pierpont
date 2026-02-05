"use server";

import supabase from "../../../lib/supabase";
import { isEditor } from "../../actions/auth";
import { revalidatePath } from "next/cache";
import { PointOfContact, PointOfContactInsert, PointOfContactUpdate, VenueType, VenueTypeInsert, VenueTypeUpdate } from "../../../types/supabase";

type ActionResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all Point of Contact records (public read access)
 * @returns Promise with action result and POC data
 */
export async function getAllPOCs(): Promise<ActionResponse<PointOfContact[]>> {
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
  } catch (error: any) {
    console.error('Error fetching POCs:', error);
    return { ok: false, error: 'Échec de la récupération des points de contact' };
  }
}

/**
 * Create a new Point of Contact
 * @param formData - Form data containing POC details
 * @returns Promise with action result
 */
export async function createPOC(formData: FormData): Promise<ActionResponse<PointOfContact>> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const name = formData.get('name') as string | null;
  if (!name || !name.trim()) {
    return { ok: false, error: 'Le nom est requis' };
  }

  const email = (formData.get('email') as string | null)?.trim() || null;
  const phoneNumber = (formData.get('phoneNumber') as string | null)?.trim() || null;
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

    const pocData: PointOfContactInsert = {
      name: nameTrimmed,
      role: (formData.get('role') as string | null)?.trim() || null,
      phoneNumber: phoneNumber,
      email: email,
    };

    const { data: newPOC, error } = await supabase
      .from('PointOfContact')
      .insert(pocData)
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
  } catch (error: any) {
    console.error('Error creating POC:', error);
    return { ok: false, error: 'Failed to create POC' };
  }
}

/**
 * Update an existing Point of Contact
 * @param formData - Form data containing POC details and ID
 * @returns Promise with action result
 */
export async function updatePOC(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get('id') as string | null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de point de contact invalide' };
  }

  const name = formData.get('name') as string | null;
  if (!name || !name.trim()) {
    return { ok: false, error: 'Le nom est requis' };
  }

  const email = (formData.get('email') as string | null)?.trim() || null;
  const phoneNumber = (formData.get('phoneNumber') as string | null)?.trim() || null;
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

    const updateData: PointOfContactUpdate = {
      name: nameTrimmed,
      role: (formData.get('role') as string | null)?.trim() || null,
      phoneNumber: phoneNumber,
      email: email,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('PointOfContact')
      .update(updateData)
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
  } catch (error: any) {
    console.error('Error updating POC:', error);
    return { ok: false, error: 'Échec de la mise à jour du point de contact' };
  }
}

/**
 * Delete a Point of Contact
 * @param formData - Form data containing POC ID
 * @returns Promise with action result
 */
export async function deletePOC(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get('id') as string | null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de point de contact invalide' };
  }

  try {
    // Check if POC is referenced in any program items
    const { data: programItems, error: checkError } = await supabase
      .from('ProgramItem')
      .select('id')
      .eq('pocId', id)
      .limit(1);

    if (checkError) {
      console.error('Error checking POC references:', checkError);
      return { ok: false, error: 'Failed to check POC usage' };
    }

    if (programItems && programItems.length > 0) {
      return { ok: false, error: 'Cannot delete POC: it is referenced in one or more program items' };
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
  } catch (error: any) {
    console.error('Error deleting POC:', error);
    return { ok: false, error: 'Échec de la suppression du point de contact' };
  }
}

/**
 * Get all Venue Type records (public read access)
 * @returns Promise with action result and venue type data
 */
export async function getAllVenueTypes(): Promise<ActionResponse<VenueType[]>> {
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
  } catch (error: any) {
    console.error('Error fetching venue types:', error);
    return { ok: false, error: 'Failed to fetch venue types' };
  }
}

/**
 * Create a new Venue Type
 * @param formData - Form data containing venue type details
 * @returns Promise with action result and venue type data
 */
export async function createVenueType(formData: FormData): Promise<ActionResponse<VenueType>> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const name = formData.get('name') as string | null;
  if (!name || !name.trim()) {
    return { ok: false, error: 'Le nom est requis' };
  }

  // Generate code from name (lowercase, replace spaces with hyphens)
  const code = ((formData.get('code') as string | null) || name.trim().toLowerCase().replace(/\s+/g, '-')).trim();

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

    const venueTypeData: VenueTypeInsert = {
      name: name.trim(),
      code: code,
    };

    const { data: newVenueType, error } = await supabase
      .from('VenueType')
      .insert(venueTypeData)
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
  } catch (error: any) {
    console.error('Error creating venue type:', error);
    return { ok: false, error: 'Échec de la création du type de lieu' };
  }
}

/**
 * Update an existing Venue Type
 * @param formData - Form data containing venue type details and ID
 * @returns Promise with action result
 */
export async function updateVenueType(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get('id') as string | null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de type de lieu invalide' };
  }

  const name = formData.get('name') as string | null;
  if (!name || !name.trim()) {
    return { ok: false, error: 'Le nom est requis' };
  }

  const code = ((formData.get('code') as string | null) || name.trim().toLowerCase().replace(/\s+/g, '-')).trim();

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

    const updateData: VenueTypeUpdate = {
      name: name.trim(),
      code: code,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('VenueType')
      .update(updateData)
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
  } catch (error: any) {
    console.error('Error updating venue type:', error);
    return { ok: false, error: 'Failed to update venue type' };
  }
}

/**
 * Delete a Venue Type
 * @param formData - Form data containing venue type ID
 * @returns Promise with action result
 */
export async function deleteVenueType(formData: FormData): Promise<ActionResponse> {
  if (!(await isEditor())) {
    return { ok: false, error: 'Non authentifié' };
  }

  const idStr = formData.get('id') as string | null;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'ID de type de lieu invalide' };
  }

  try {
    // Check if venue type is referenced in any program items
    const { data: programItems, error: checkError } = await supabase
      .from('ProgramItem')
      .select('id')
      .eq('venueTypeId', id)
      .limit(1);

    if (checkError) {
      console.error('Error checking venue type references:', checkError);
      return { ok: false, error: 'Échec de la vérification de l\'utilisation du type de lieu' };
    }

    if (programItems && programItems.length > 0) {
      return { ok: false, error: 'Cannot delete venue type: it is referenced in one or more program items' };
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
  } catch (error: any) {
    console.error('Error deleting venue type:', error);
    return { ok: false, error: 'Échec de la suppression du type de lieu' };
  }
}
