/**
 * RSVP rollout switch.
 *
 * While the guest list is still being entered, the only way to RSVP is a
 * personalized invite link: someone who isn't in the list yet clicking a
 * public "RSVP" button would just hit a dead end and email us about it.
 *
 * Guests arriving on their own link are unaffected — we already know who they
 * are, so they always see their RSVP button.
 *
 * Set RSVP_OPEN=true once everyone is loaded in to expose the public entry
 * points (the RSVP button for un-identified visitors, and email sign-in).
 */
export function isRsvpOpenToEveryone(): boolean {
  return process.env.RSVP_OPEN === "true";
}
