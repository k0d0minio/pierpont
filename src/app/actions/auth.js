"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const COOKIE_NAME = "pierpont_edit_mode";

export async function enableEditMode(formData) {
  const code = formData.get("code");
  const expected = process.env.NEXT_PUBLIC_EDIT_CODE || "";
  if (!expected || code !== expected) {
    return { ok: false };
  }
  const c = await cookies();
  c.set(COOKIE_NAME, "1", { httpOnly: false, sameSite: "lax", path: "/" });
  revalidatePath("/");
  return { ok: true };
}

export async function disableEditMode() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
  revalidatePath("/");
  return { ok: true };
}

export async function isEditor() {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value === "1";
}


