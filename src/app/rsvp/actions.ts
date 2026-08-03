"use server";

import { redirect } from "next/navigation";
import { getPartyByEmail } from "@/lib/db";

/**
 * "I lost my link" recovery: find the invite we sent to this address and drop
 * them on their own RSVP form. Everyone here is already past the site
 * password, so this is a convenience for invited guests, not a public lookup.
 */
export async function findInviteByEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const found = getPartyByEmail(email);

  if (!found) redirect("/rsvp?notfound=1");
  if (found === "ambiguous") redirect("/rsvp?ambiguous=1");

  redirect(`/rsvp/${encodeURIComponent(found.code)}`);
}
