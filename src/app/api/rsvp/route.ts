import { NextResponse } from "next/server";
import { google } from "googleapis";

function getSheets() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!email || !key || !sheetId) {
    throw new Error("Missing Google Sheets environment variables");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), sheetId };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const { sheets, sheetId } = getSheets();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Guest List!A:D",
    });

    const rows = res.data.values || [];
    const guest = rows.find(
      (row) => row[0]?.toLowerCase() === code.toLowerCase()
    );

    if (!guest) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    return NextResponse.json({
      code: guest[0],
      name: guest[1] || "",
      email: guest[2] || "",
      plusOneAllowed: guest[3]?.toLowerCase() === "yes",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not look up your invite. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, email, attending, dietary, song, plusOneName, plusOneDietary } = body;

    if (!code || !name || !email || !attending) {
      return NextResponse.json(
        { error: "Name, email, and attendance are required." },
        { status: 400 }
      );
    }

    const { sheets, sheetId } = getSheets();

    const row = [
      code,
      name,
      email,
      attending,
      dietary || "",
      song || "",
      plusOneName || "",
      plusOneDietary || "",
      new Date().toISOString(),
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:I",
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    if (response.status !== 200) {
      throw new Error("Google Sheets returned status " + response.status);
    }

    const updatedRows = response.data.updates?.updatedRows;
    if (!updatedRows || updatedRows < 1) {
      throw new Error("Row was not written to the spreadsheet");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RSVP save error:", err);
    return NextResponse.json(
      {
        error:
          "We couldn't save your RSVP. Please try again, or email us directly.",
      },
      { status: 500 }
    );
  }
}
