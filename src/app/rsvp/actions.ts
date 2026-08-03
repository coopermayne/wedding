"use server";

import { cookies } from "next/headers";
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

/**
 * "Not you?" — forget which guest this browser belongs to and start fresh.
 * A forwarded invite link (or a shared computer) otherwise leaves the next
 * person editing someone else's RSVP.
 *
 * This only clears the invite cookie, not the site password, so they stay
 * inside the site and land on the email form.
 */
export async function startOver() {
  (await cookies()).delete("invite");
  redirect("/rsvp");
}
