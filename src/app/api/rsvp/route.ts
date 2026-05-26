import { NextResponse } from "next/server";
import { google } from "googleapis";

function getAuth() {
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

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, sheetId };
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

    const { sheets, sheetId } = getAuth();

    const row = [
      name,
      email,
      attending,
      guests || "1",
      dietary || "",
      song || "",
      new Date().toISOString(),
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:G",
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
