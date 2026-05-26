import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "rsvps.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf-8");
  }
}

function readRsvps() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeRsvps(rsvps: unknown[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2), "utf-8");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, attending, guests, dietary, song } = body;

    if (!name || !email || !attending) {
      return NextResponse.json(
        { error: "Name, email, and attendance are required." },
        { status: 400 }
      );
    }

    const rsvp = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      email,
      attending,
      guests: guests || 1,
      dietary: dietary || "",
      song: song || "",
      submittedAt: new Date().toISOString(),
    };

    const rsvps = readRsvps();
    rsvps.push(rsvp);
    writeRsvps(rsvps);

    return NextResponse.json({ success: true, id: rsvp.id });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong saving your RSVP. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rsvps = readRsvps();
    return NextResponse.json(rsvps);
  } catch {
    return NextResponse.json({ error: "Could not read RSVPs." }, { status: 500 });
  }
}
