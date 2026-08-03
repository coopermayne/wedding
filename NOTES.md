# Wedding Site — Setup Notes

## RSVP data (JSON file store)

All invites and responses live in one JSON file on the persistent volume:
`${DATA_DIR}/wedding.json` (in Docker that's `/app/data/wedding.json`; in local
dev it's `./data/wedding.json`). No external database service.

- **Backup** = copy that one file.
- Safe for a single running container. Do **not** run more than one replica
  against the same file (writes are serialized per-process, not across processes).
- Schema and all read/write helpers: `src/lib/db.ts`.

### Each invite ("party")
A party is the unit that gets one link: a single person *or* a household.
Fields: `name`, `email`, `maxGuests`, `attending` (yes/no/null), `song`,
`notes` (admin-only), `guests[]` (named attendees), timestamps.

### Invite codes / links
Each party gets a code like `a8f3k_jane-doe` (5 random chars + `_` + the name
slugified). Personalized link: `https://your-domain.com/rsvp/<code>`.

## RSVP flow (guest)

- Guest opens their link `/rsvp/<code>`. Invalid/missing codes see a
  "use your invite link" message.
- They accept or decline. If accepting, they add each attendee by name
  (up to `maxGuests`), with optional dietary notes, plus a song request.
- Responses are pre-filled on return, so guests can come back and edit any time.

## Admin

- Dashboard: `/admin/<ADMIN_SECRET>` — anything else 404s, and the page is
  `noindex`. There is no password; keep the URL secret.
- Shows response metrics, a "latest responses" feed, and the full guest table.
- Add invites one at a time (name, email, and 0–5 plus-ones).
- Edit / delete any invite.

## Email blast (mailmerge)

- On the admin page, click **Export CSV**. The file includes each invite's
  code and **personalized link**, plus all response data.
- Use that CSV with your email tool's mailmerge (Gmail + a mailmerge add-on,
  etc.) to send everyone their unique link.
- `SITE_URL` must be set before exporting, or every link in the CSV comes out
  as a relative path and lands nowhere from an email.

## Coolify Deployment

- Repo: https://github.com/coopermayne/wedding (public)
- Build: Dockerfile (Next.js standalone), Node 20 Alpine — no native deps.
- Port: 3000
- Persistent volume mounted at `/app/data` (already in the Dockerfile).
- Env vars needed in Coolify:
  - `ADMIN_SECRET` — long random string; the secret admin URL segment.
  - `SITE_URL` — e.g. `https://your-domain.com` (used to build CSV links).
  - `SITE_PASSWORD` — the shared password on `/gate`. Changing it signs
    everyone out (the auth cookie is derived from it).
  - `RSVP_OPEN` — see below. Leave unset until the guest list is loaded.
- The old `GOOGLE_*` env vars are no longer used.

## Getting in (two ways)

1. **Personalized invite link** — `/?i=<code>` or `/rsvp/<code>`. The code is
   checked against the guest list, and a real one is itself the credential: no
   password prompt. This is what guests get in their email.
2. **Shared password** — `/gate`, for anyone without a link.

Either way the visitor gets the same auth cookie (30 days). A separate
`invite` cookie remembers *which* guest they are; it grants nothing on its own,
and "Not <name>? Start over" clears it.

## RSVP rollout switch

`RSVP_OPEN` (in `src/lib/config.ts`) controls the **public** ways to reach the
RSVP form:

- **Unset / not `true`** (current): only guests arriving on their own invite
  link see an RSVP button. A bare visit to `/rsvp` says "invitations are on
  their way." This is the safe state while invites are still being entered — a
  guest who isn't in the list yet can't hit a confusing dead end.
- **`RSVP_OPEN=true`**: the RSVP button shows for everyone, and `/rsvp` offers
  email sign-in (type the address the invite went to, land on your own form).

Flip it once the whole guest list is in. Note the Where-to-stay footer link to
`/rsvp` was removed for now; re-add it when opening up if you want it back.

## TODO

- [x] Set up domain in Coolify
- [x] Set `ADMIN_SECRET`, `SITE_URL` and `SITE_PASSWORD` in Coolify
- [ ] Add guests via the admin page (name, email, plus-ones)
- [ ] Set `RSVP_OPEN=true` once the guest list is complete
- [ ] Re-add the Where-to-stay footer RSVP link when opening up (optional)
- [ ] Export CSV and run the email mailmerge with personalized links
- [ ] Confirm the `/app/data` volume is backed up
