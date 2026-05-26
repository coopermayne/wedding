# Wedding Site — Setup Notes

## Google Sheet Structure

Spreadsheet ID: `12V3yaTMMCYJ-32hxWFhXIRv9BlyRgdhD6AutlKGxBg4`

### Tab 1: "Guest List"
Columns: `Code | Name | Email | PlusOneAllowed | Sent`

- Each guest gets a unique code (e.g. `abc123`)
- `PlusOneAllowed` = "yes" or "no"
- `Sent` column gets marked "sent" by the email script to prevent double-sends

### Tab 2: "Sheet1" (rename to "RSVPs" if you want)
Columns: `Code | Name | Email | Attending | Dietary | Song | Plus One Name | Plus One Dietary | Submitted At`

- RSVP form writes here automatically via Google Sheets API

## RSVP Flow

- Each guest gets a personalized link: `https://your-domain.com/rsvp/CODE`
- Invalid/missing codes see a "use your invite link" message
- If guest has a +1, form shows a +1 section (name + dietary)
- If no +1, that section is hidden
- Success only shown after Google Sheets confirms the row was saved
- Error shown if save fails

## Email Blast

Script is at `scripts/send-invites.gs` — paste into Extensions > Apps Script in the Google Sheet.

1. Update `SITE_URL` in the script to actual domain
2. Run `sendTestInvite` first to test with row 2
3. Run `sendInvites` to blast everyone not yet marked "sent"
4. Sends from coopermayne@gmail.com as "Emily & Max"

## Coolify Deployment

- Repo: https://github.com/coopermayne/wedding (public)
- Build: Dockerfile (Next.js standalone)
- Port: 3000
- Env vars needed in Coolify:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SPREADSHEET_ID`
- Service account: `wedding-rsvp@wedding-497504.iam.gserviceaccount.com`

## TODO

- [ ] Set up domain in Coolify
- [ ] Fill out Guest List tab with guests + codes
- [ ] Update Sheet1 headers to: Code | Name | Email | Attending | Dietary | Song | Plus One Name | Plus One Dietary | Submitted At
- [ ] Update SITE_URL in the Apps Script
- [ ] Send test invite to yourself
- [ ] Send blast to all guests
- [ ] Show different success message for "Regretfully Decline" vs "Joyfully Accept"
