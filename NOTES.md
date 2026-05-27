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
- Add invites one at a time or bulk-paste `Name, email, maxGuests` lines.
- Edit / delete any invite.

## Email blast (mailmerge)

- On the admin page, click **Export CSV**. The file includes each invite's
  code and **personalized link**, plus all response data.
- Use that CSV with your email tool's mailmerge (Gmail + a mailmerge add-on,
  etc.) to send everyone their unique link.
- (The old `scripts/send-invites.gs` Apps Script is superseded by this.)

## Coolify Deployment

- Repo: https://github.com/coopermayne/wedding (public)
- Build: Dockerfile (Next.js standalone), Node 20 Alpine — no native deps.
- Port: 3000
- Persistent volume mounted at `/app/data` (already in the Dockerfile).
- Env vars needed in Coolify:
  - `ADMIN_SECRET` — long random string; the secret admin URL segment.
  - `SITE_URL` — e.g. `https://your-domain.com` (used to build CSV links).
- The old `GOOGLE_*` env vars are no longer used.

## TODO

- [ ] Set up domain in Coolify
- [ ] Set `ADMIN_SECRET` and `SITE_URL` in Coolify
- [ ] Add guests via the admin page (single or bulk)
- [ ] Export CSV and run the email mailmerge with personalized links
- [ ] Confirm the `/app/data` volume is backed up
