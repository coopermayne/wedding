"use server";

import { revalidatePath } from "next/cache";
import { createParty, deleteParty, updateParty } from "@/lib/db";

// Server Actions are reachable by direct POST, not just through our UI, so each
// one independently re-checks the secret. The secret rides along as a hidden
// form field (it's already in the admin URL the user is viewing, so this adds
// no new exposure).
function assertKey(key: FormDataEntryValue | null) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || key !== secret) {
    throw new Error("Unauthorized");
  }
}

export async function createPartyAction(formData: FormData) {
  const key = formData.get("key");
  assertKey(key);

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  createParty({
    name,
    email: String(formData.get("email") || ""),
    plusOnes: parseInt(String(formData.get("plusOnes") || "0"), 10) || 0,
    notes: String(formData.get("notes") || ""),
  });

  revalidatePath(`/admin/${key}`);
}

export async function updatePartyAction(formData: FormData) {
  const key = formData.get("key");
  assertKey(key);

  updateParty(String(formData.get("id") || ""), {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    plusOnes: parseInt(String(formData.get("plusOnes") || "0"), 10) || 0,
    notes: String(formData.get("notes") || ""),
  });

  revalidatePath(`/admin/${key}`);
}

export async function deletePartyAction(formData: FormData) {
  const key = formData.get("key");
  assertKey(key);

  deleteParty(String(formData.get("id") || ""));
  revalidatePath(`/admin/${key}`);
}
