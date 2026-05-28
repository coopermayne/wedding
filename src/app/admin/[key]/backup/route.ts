import { listParties } from "@/lib/db";

// Full snapshot of the database, downloadable on demand. This mirrors the
// on-disk wedding.json so it can be used to restore (drop it back on the volume).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return new Response("Not found", { status: 404 });
  }

  const data = JSON.stringify({ parties: listParties() }, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="wedding-backup-${date}.json"`,
    },
  });
}
