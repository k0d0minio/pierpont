"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "pierpont_edit_mode";

/**
 * Check the current authentication status from server-side cookies
 * @returns {Promise<{ok: boolean, authenticated: boolean}>}
 */
export async function checkAuthStatus() {
  try {
    const c = await cookies();
    const editMode = c.get(COOKIE_NAME);
    const authenticated = editMode?.value === "1";
    return { ok: true, authenticated };
  } catch (error) {
    console.error("Error checking auth status:", error);
    return { ok: false, authenticated: false };
  }
}

/**
 * Enable edit mode by validating password and setting authentication cookie
 * @param {FormData} formData - Form data containing the password code
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function enableEditMode(formData) {
  try {
    const code = formData.get("code");
    const expected = process.env.NEXT_PUBLIC_EDIT_CODE || "";
    
    if (!expected) {
      return { ok: false, error: "Server configuration error" };
    }
    
    if (!code || code !== expected) {
      return { ok: false, error: "Invalid password" };
    }
    
    const c = await cookies();
    c.set(COOKIE_NAME, "1", { 
      httpOnly: false, 
      sameSite: "lax", 
      path: "/",
      maxAge: 60 * 60 * 24 // 24 hours
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Error enabling edit mode:", error);
    return { ok: false, error: "Failed to authenticate" };
  }
}

/**
 * Disable edit mode by removing authentication cookie
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function disableEditMode() {
  try {
    const c = await cookies();
    c.delete(COOKIE_NAME);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Error disabling edit mode:", error);
    return { ok: false, error: "Failed to sign out" };
  }
}

/**
 * Check if the current user is an editor (legacy function for backward compatibility)
 * @returns {Promise<boolean>}
 */
export async function isEditor() {
  const c = await cookies();
  const editMode = c.get(COOKIE_NAME);
  return editMode?.value === "1";
}


