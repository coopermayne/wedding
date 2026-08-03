import { randomBytes, randomUUID } from "crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import path from "path";
import { sanitizeText } from "./sanitize";
import { isRsvpEventKey, RSVP_EVENT_KEYS, type RsvpEventKey } from "./events";

// ---------------------------------------------------------------------------
// JSON file store
//
// Everything lives in one file on the persistent /app/data volume. There is no
// extra database service; backup = copy the file.
//
// Concurrency: this is safe for a single Node process (one container) because
// every mutation does a *synchronous* read -> modify -> write with no `await`
// in between, so the event loop can't interleave two writers. Writes are made
// atomic with a temp-file + rename, so a reader never sees a half-written file
// and a crash mid-write leaves the previous file intact. Do NOT run more than
// one replica against the same file.
// ---------------------------------------------------------------------------

export type Guest = {
  name: string;
  dietary: string;
};

/** One event's answer: are you coming, and which of your party is coming. */
export type EventRsvp = {
  /** null = hasn't answered this event yet. */
  attending: "yes" | "no" | null;
  /** Names, drawn from the party roster below. Empty when not attending. */
  attendees: string[];
};

export type Party = {
  id: string;
  /** The hash in the invite link, e.g. "a8f3k_jane-doe". */
  code: string;
  /** The invited person's name. */
  name: string;
  email: string;
  /** Number of additional guests (plus-ones) this person may bring, 0–5. */
  plusOnes: number;
  /**
   * The party roster: everyone this invite covers, invitee first, with their
   * dietary notes. Entered once; each event then picks from these names, since
   * plenty of people come Saturday but not Friday.
   */
  guests: Guest[];
  /** One answer per RSVP event (see lib/events). */
  events: Record<RsvpEventKey, EventRsvp>;
  song: string;
  /** Admin-only notes, never shown to the guest. */
  notes: string;
  createdAt: string;
  /** Set once, the first time they respond to anything. */
  respondedAt: string | null;
  /** Updated every time they save. */
  updatedAt: string | null;
};

type DbShape = { parties: Party[] };

/** The shape parties had before the weekend was split into separate events. */
type LegacyParty = Party & { attending?: "yes" | "no" | null };

function emptyEvents(): Record<RsvpEventKey, EventRsvp> {
  const out = {} as Record<RsvpEventKey, EventRsvp>;
  for (const key of RSVP_EVENT_KEYS) out[key] = { attending: null, attendees: [] };
  return out;
}

/**
 * Bring a stored party up to the current shape. Responses written before the
 * weekend was split into separate events were answers about the wedding, so
 * that's where they land; the other events start unanswered.
 */
function migrate(raw: LegacyParty): Party {
  const guests: Guest[] = Array.isArray(raw.guests)
    ? raw.guests.map((g) => ({ name: g?.name || "", dietary: g?.dietary || "" }))
    : [];

  const events = emptyEvents();
  for (const key of RSVP_EVENT_KEYS) {
    const stored = raw.events?.[key];
    if (stored) {
      events[key] = {
        attending: stored.attending ?? null,
        attendees: Array.isArray(stored.attendees) ? stored.attendees : [],
      };
    } else if (key === "wedding" && raw.attending !== undefined) {
      events[key] = {
        attending: raw.attending ?? null,
        attendees: raw.attending === "yes" ? guests.map((g) => g.name) : [],
      };
    }
  }

  const { attending: _legacy, ...rest } = raw;
  void _legacy;
  return { ...rest, guests, events };
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "wedding.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function read(): DbShape {
  ensureDir();
  if (!existsSync(DB_PATH)) return { parties: [] };
  const raw = readFileSync(DB_PATH, "utf8");
  if (!raw.trim()) return { parties: [] };
  const data = JSON.parse(raw) as { parties?: LegacyParty[] };
  return {
    parties: Array.isArray(data.parties) ? data.parties.map(migrate) : [],
  };
}

function write(data: DbShape) {
  ensureDir();
  const tmp = `${DB_PATH}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  renameSync(tmp, DB_PATH);
}

// --- code generation -------------------------------------------------------

// No 0/o/1/l/i so codes are easy to read aloud if ever needed.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomHash(len = 5): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "") || "guest"
  );
}

/** Builds a code like "a8f3k_jane-doe" — random prefix for uniqueness, name for readability. */
function makeCode(name: string, taken: Set<string>): string {
  let code: string;
  do {
    code = `${randomHash(5)}_${slugify(name)}`;
  } while (taken.has(code));
  return code;
}

/** Plus-ones are clamped to a sensible 0–5. */
function clampPlusOnes(n: number | undefined): number {
  return Math.min(5, Math.max(0, Math.floor(n || 0)));
}

function newParty(input: {
  name: string;
  email?: string;
  plusOnes?: number;
  notes?: string;
  taken: Set<string>;
}): Party {
  return {
    id: randomUUID(),
    code: makeCode(input.name, input.taken),
    name: sanitizeText(input.name, 100),
    email: (input.email || "").trim(),
    plusOnes: clampPlusOnes(input.plusOnes),
    song: "",
    notes: (input.notes || "").trim(),
    guests: [],
    events: emptyEvents(),
    createdAt: new Date().toISOString(),
    respondedAt: null,
    updatedAt: null,
  };
}

// --- queries ---------------------------------------------------------------

export function listParties(): Party[] {
  return read().parties;
}

export function getPartyByCode(code: string): Party | null {
  const lc = code.toLowerCase();
  return read().parties.find((p) => p.code.toLowerCase() === lc) || null;
}

/**
 * Look up an invite by the email we sent it to — the "I lost my link" path.
 * If the same address was used for two invites we can't tell them apart, so
 * the caller gets nothing rather than a coin flip.
 */
export function getPartyByEmail(email: string): Party | "ambiguous" | null {
  const lc = email.trim().toLowerCase();
  if (!lc) return null;
  const matches = read().parties.filter(
    (p) => p.email.trim().toLowerCase() === lc
  );
  if (matches.length === 0) return null;
  return matches.length > 1 ? "ambiguous" : matches[0];
}

/** Has this party submitted the form at all? Drives reminder emails. */
export function hasResponded(party: Party): boolean {
  return party.respondedAt !== null;
}

// Segments used by both the admin filter chips and the CSV export:
//   pending        -> reminder emails ("you haven't RSVP'd!")
//   responded      -> everyone who has answered
//   <event>-yes/no -> that event's attending / declined list
export function matchesFilter(party: Party, filter: string): boolean {
  if (filter === "pending") return !hasResponded(party);
  if (filter === "responded") return hasResponded(party);
  const [key, answer] = filter.split("-");
  if (isRsvpEventKey(key) && (answer === "yes" || answer === "no")) {
    return party.events[key].attending === answer;
  }
  return true;
}

export type EventStats = {
  accepted: number;
  declined: number;
  pending: number;
  /** People coming to this event, counted across all parties. */
  headcount: number;
};

export type Stats = {
  totalParties: number;
  responded: number;
  pending: number;
  /** Max possible attendees if every invitee brought all their plus-ones. */
  maxInvited: number;
  responseRate: number; // 0..1
  events: Record<RsvpEventKey, EventStats>;
};

export function getStats(): Stats {
  const parties = read().parties;
  const responded = parties.filter(hasResponded).length;

  const events = Object.fromEntries(
    RSVP_EVENT_KEYS.map((key) => {
      const answers = parties.map((p) => p.events[key]);
      return [
        key,
        {
          accepted: answers.filter((e) => e.attending === "yes").length,
          declined: answers.filter((e) => e.attending === "no").length,
          pending: answers.filter((e) => e.attending === null).length,
          headcount: answers
            .filter((e) => e.attending === "yes")
            .reduce((sum, e) => sum + e.attendees.length, 0),
        },
      ];
    })
  ) as Record<RsvpEventKey, EventStats>;

  return {
    totalParties: parties.length,
    responded,
    pending: parties.length - responded,
    maxInvited: parties.reduce((sum, p) => sum + 1 + p.plusOnes, 0),
    responseRate: parties.length ? responded / parties.length : 0,
    events,
  };
}

// --- mutations -------------------------------------------------------------

export function createParty(input: {
  name: string;
  email?: string;
  plusOnes?: number;
  notes?: string;
}): Party {
  const data = read();
  const taken = new Set(data.parties.map((p) => p.code));
  const party = newParty({ ...input, taken });
  data.parties.push(party);
  write(data);
  return party;
}

export function updateParty(
  id: string,
  fields: Partial<Pick<Party, "name" | "email" | "plusOnes" | "notes">>
): Party | null {
  const data = read();
  const party = data.parties.find((p) => p.id === id);
  if (!party) return null;
  if (fields.name !== undefined) party.name = sanitizeText(fields.name, 100);
  if (fields.email !== undefined) party.email = fields.email.trim();
  if (fields.plusOnes !== undefined) party.plusOnes = clampPlusOnes(fields.plusOnes);
  if (fields.notes !== undefined) party.notes = fields.notes.trim();
  write(data);
  return party;
}

export function deleteParty(id: string): boolean {
  const data = read();
  const before = data.parties.length;
  data.parties = data.parties.filter((p) => p.id !== id);
  if (data.parties.length === before) return false;
  write(data);
  return true;
}

export type RsvpSubmission = {
  /** The party roster: invitee first, then any plus-ones they're bringing. */
  guests: Guest[];
  song: string;
  /** One answer per event; a missing event keeps whatever was stored before. */
  events: Partial<Record<RsvpEventKey, { attending: "yes" | "no"; attendees: string[] }>>;
};

export function submitRsvp(code: string, input: RsvpSubmission): Party | null {
  const data = read();
  const lc = code.toLowerCase();
  const party = data.parties.find((p) => p.code.toLowerCase() === lc);
  if (!party) return null;

  const now = new Date().toISOString();

  // The roster is authoritative for every event, so clean it first: guest 1 is
  // always the invitee (their name comes from the invite, never from what was
  // submitted), followed by up to plusOnes named guests.
  const roster: Guest[] = [
    {
      name: party.name,
      dietary: sanitizeText(input.guests[0]?.dietary || "", 150),
    },
    ...input.guests
      .slice(1, party.plusOnes + 1)
      .map((g) => ({
        name: sanitizeText(g.name || "", 100),
        dietary: sanitizeText(g.dietary || "", 150),
      }))
      .filter((g) => g.name.length > 0),
  ];
  party.guests = roster;
  party.song = sanitizeText(input.song || "", 120);

  const rosterNames = new Set(roster.map((g) => g.name));
  for (const key of RSVP_EVENT_KEYS) {
    const answer = input.events[key];
    if (!answer) continue;
    party.events[key] = {
      attending: answer.attending,
      // Only names that are actually on the roster can attend, so a stale or
      // hand-crafted payload can't invent extra people.
      attendees:
        answer.attending === "yes"
          ? [...new Set(answer.attendees.map((n) => sanitizeText(n, 100)))].filter(
              (n) => rosterNames.has(n)
            )
          : [],
    };
  }

  if (!party.respondedAt) party.respondedAt = now;
  party.updatedAt = now;

  write(data);
  return party;
}
