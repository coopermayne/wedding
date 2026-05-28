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

export type Party = {
  id: string;
  /** The hash in the invite link, e.g. "a8f3k_jane-doe". */
  code: string;
  /** The invited person's name. */
  name: string;
  email: string;
  /** Number of additional guests (plus-ones) this person may bring, 0–5. */
  plusOnes: number;
  /** null = hasn't responded yet. */
  attending: "yes" | "no" | null;
  song: string;
  /** Admin-only notes, never shown to the guest. */
  notes: string;
  /** Attendees they registered: themselves first, then any plus-ones. */
  guests: Guest[];
  createdAt: string;
  /** Set once, the first time they respond. */
  respondedAt: string | null;
  /** Updated every time they save. */
  updatedAt: string | null;
};

type DbShape = { parties: Party[] };

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
  const data = JSON.parse(raw) as DbShape;
  return { parties: Array.isArray(data.parties) ? data.parties : [] };
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
    attending: null,
    song: "",
    notes: (input.notes || "").trim(),
    guests: [],
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

export type Stats = {
  totalParties: number;
  responded: number;
  pending: number;
  accepted: number;
  declined: number;
  headcount: number;
  responseRate: number; // 0..1
};

export function getStats(): Stats {
  const parties = read().parties;
  const responded = parties.filter((p) => p.attending !== null).length;
  const accepted = parties.filter((p) => p.attending === "yes").length;
  const declined = parties.filter((p) => p.attending === "no").length;
  const headcount = parties
    .filter((p) => p.attending === "yes")
    .reduce((sum, p) => sum + p.guests.length, 0);
  return {
    totalParties: parties.length,
    responded,
    pending: parties.length - responded,
    accepted,
    declined,
    headcount,
    responseRate: parties.length ? responded / parties.length : 0,
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

/** Parses pasted lines of "Name, email, plusOnes" and creates a party for each. */
export function bulkCreateParties(text: string): number {
  const data = read();
  const taken = new Set(data.parties.map((p) => p.code));
  let count = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [name, email, plus] = trimmed.split(",").map((s) => s.trim());
    if (!name) continue;
    const party = newParty({
      name,
      email,
      plusOnes: parseInt(plus || "0", 10) || 0,
      taken,
    });
    taken.add(party.code);
    data.parties.push(party);
    count++;
  }
  write(data);
  return count;
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

export function submitRsvp(
  code: string,
  input: { attending: "yes" | "no"; song: string; guests: Guest[] }
): Party | null {
  const data = read();
  const lc = code.toLowerCase();
  const party = data.parties.find((p) => p.code.toLowerCase() === lc);
  if (!party) return null;

  const now = new Date().toISOString();
  party.attending = input.attending;
  party.song = sanitizeText(input.song || "", 120);
  party.guests =
    input.attending === "yes"
      ? [
          // Guest 1 is always the invitee — the name is the invite name, never
          // whatever was submitted; we only take their dietary note.
          {
            name: party.name,
            dietary: sanitizeText(input.guests[0]?.dietary || "", 150),
          },
          // Then up to plusOnes additional named guests.
          ...input.guests
            .slice(1, party.plusOnes + 1)
            .map((g) => ({
              name: sanitizeText(g.name || "", 100),
              dietary: sanitizeText(g.dietary || "", 150),
            }))
            .filter((g) => g.name.length > 0),
        ]
      : [];
  if (!party.respondedAt) party.respondedAt = now;
  party.updatedAt = now;

  write(data);
  return party;
}
