import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStats, listParties, type Party } from "@/lib/db";
import { bulkAddAction, createPartyAction } from "./actions";
import { RowActions } from "./row-actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Always render fresh; this page reflects live RSVP data.
export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}

type Filter = "all" | "pending" | "attending" | "declined";

function matchesFilter(attending: Party["attending"], filter: Filter): boolean {
  if (filter === "pending") return attending === null;
  if (filter === "attending") return attending === "yes";
  if (filter === "declined") return attending === "no";
  return true;
}

function StatusBadge({ attending }: { attending: Party["attending"] }) {
  if (attending === "yes")
    return <span className="badge badge-yes">Attending</span>;
  if (attending === "no") return <span className="badge badge-no">Declined</span>;
  return <span className="badge badge-pending">No response</span>;
}

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { key } = await params;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    notFound();
  }

  const { filter: filterParam } = await searchParams;
  const filter: Filter = (["pending", "attending", "declined"] as const).includes(
    filterParam as "pending" | "attending" | "declined"
  )
    ? (filterParam as Filter)
    : "all";

  const stats = getStats();
  const parties = listParties();
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  // The invite link lands on the personalized home page, which greets the
  // guest and routes them to their RSVP form.
  const linkFor = (code: string) =>
    siteUrl ? `${siteUrl}/?i=${code}` : `/?i=${code}`;

  const visible = [...parties]
    .filter((p) => matchesFilter(p.attending, filter))
    .sort((a, b) => a.name.localeCompare(b.name));
  const recent = [...parties]
    .filter((p) => p.respondedAt)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 6);

  const pct = Math.round(stats.responseRate * 100);

  const statCells = [
    { label: "Invites", value: stats.totalParties, color: "#111827" },
    { label: "Responded", value: stats.responded, color: "#4f46e5" },
    { label: "Pending", value: stats.pending, color: "#b45309" },
    { label: "Accepted", value: stats.accepted, color: "#166534" },
    { label: "Declined", value: stats.declined, color: "#991b1b" },
    { label: "Headcount", value: stats.headcount, color: "#7c3aed" },
    { label: "Max invited", value: stats.maxInvited, color: "#0891b2" },
  ];

  const filters: { f: Filter; label: string; count: number }[] = [
    { f: "all", label: "All", count: stats.totalParties },
    { f: "pending", label: "Not responded", count: stats.pending },
    { f: "attending", label: "Attending", count: stats.accepted },
    { f: "declined", label: "Declined", count: stats.declined },
  ];

  return (
    <div className="admin-ui">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Guest Admin</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Emily &amp; Max · October 24, 2026
            </p>
          </div>
          <div style={{ minWidth: "220px" }}>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: "#6b7280" }}>Responses</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <div
              style={{
                height: 8,
                background: "#e5e7eb",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: "#4f46e5",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          {statCells.map((c) => (
            <div key={c.label} className="stat-card">
              <div className="stat-value" style={{ color: c.color }}>
                {c.value}
              </div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Export */}
        <div className="admin-card p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold">Export for mailmerge</h2>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Each CSV includes every invite&apos;s personalized link. Use{" "}
                <b>Not responded</b> for reminders, <b>Attending</b> for
                confirmations.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a className="btn btn-secondary" href={`/admin/${key}/export`} download>
                Everyone
              </a>
              <a
                className="btn btn-secondary"
                href={`/admin/${key}/export?status=pending`}
                download
              >
                Not responded ({stats.pending})
              </a>
              <a
                className="btn btn-secondary"
                href={`/admin/${key}/export?status=attending`}
                download
              >
                Attending ({stats.accepted})
              </a>
              <a
                className="btn btn-secondary"
                href={`/admin/${key}/export?status=declined`}
                download
              >
                Declined ({stats.declined})
              </a>
            </div>
          </div>
        </div>

        {/* Add invite */}
        <div className="admin-card p-4 mb-6">
          <h2 className="font-semibold mb-3">Add an invite</h2>
          <form action={createPartyAction} className="flex flex-wrap gap-3 items-end">
            <input type="hidden" name="key" value={key} />
            <div>
              <label className="admin-label">Name</label>
              <input type="text" name="name" required placeholder="Jane Doe / The Smiths" />
            </div>
            <div>
              <label className="admin-label">Email</label>
              <input type="email" name="email" placeholder="jane@example.com" />
            </div>
            <div>
              <label className="admin-label">Plus-ones (0–5)</label>
              <input
                type="number"
                name="plusOnes"
                min={0}
                max={5}
                defaultValue={0}
                style={{ width: "6rem" }}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Add invite
            </button>
          </form>

          <details className="mt-4">
            <summary
              className="text-sm font-semibold cursor-pointer"
              style={{ color: "#4f46e5" }}
            >
              Bulk add — paste a list
            </summary>
            <form action={bulkAddAction} className="mt-3">
              <input type="hidden" name="key" value={key} />
              <p className="text-sm mb-2" style={{ color: "#6b7280" }}>
                One per line: <code>Name, email, plus-ones</code> (email and
                plus-ones optional). A unique code is generated for each.
              </p>
              <textarea
                name="bulk"
                rows={5}
                className="w-full"
                placeholder={"Jane Doe, jane@example.com, 1\nSam Rivera, sam@example.com, 0"}
              />
              <div className="mt-2">
                <button type="submit" className="btn btn-primary">
                  Add all
                </button>
              </div>
            </form>
          </details>
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="admin-card p-4 mb-6">
            <h2 className="font-semibold mb-2">Latest responses</h2>
            <ul className="text-sm" style={{ color: "#374151" }}>
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 py-1"
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                >
                  <StatusBadge attending={p.attending} />
                  <span className="font-medium">{p.name}</span>
                  {p.attending === "yes" && (
                    <span style={{ color: "#6b7280" }}>
                      · {p.guests.length} guest{p.guests.length === 1 ? "" : "s"}
                    </span>
                  )}
                  <span className="ml-auto" style={{ color: "#9ca3af" }}>
                    {fmtDate(p.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guest list */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-semibold">Guest list</h2>
          <div className="flex flex-wrap gap-2">
            {filters.map((opt) => (
              <a
                key={opt.f}
                href={opt.f === "all" ? `/admin/${key}` : `/admin/${key}?filter=${opt.f}`}
                className={`chip ${filter === opt.f ? "chip-active" : ""}`}
              >
                {opt.label} ({opt.count})
              </a>
            ))}
          </div>
        </div>

        {parties.length === 0 ? (
          <div className="admin-card p-8 text-center" style={{ color: "#6b7280" }}>
            No invites yet — add your first one above.
          </div>
        ) : visible.length === 0 ? (
          <div className="admin-card p-8 text-center" style={{ color: "#6b7280" }}>
            No invites in this view.
          </div>
        ) : (
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Status</th>
                    <th>Party &amp; details</th>
                    <th>Responded</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-semibold">{p.name}</div>
                        {p.email && (
                          <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                            {p.email}
                          </div>
                        )}
                        <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                          {p.plusOnes === 0
                            ? "no plus-ones"
                            : `+${p.plusOnes} plus-one${p.plusOnes === 1 ? "" : "s"}`}
                          {p.notes ? ` · ${p.notes}` : ""}
                        </div>
                      </td>
                      <td>
                        <StatusBadge attending={p.attending} />
                      </td>
                      <td>
                        {p.attending === "yes" && p.guests.length > 0 ? (
                          <ul style={{ margin: 0 }}>
                            {p.guests.map((g, i) => (
                              <li key={i}>
                                {g.name}
                                {g.dietary && (
                                  <span style={{ color: "#b45309" }}>
                                    {" "}
                                    · {g.dietary}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                        {p.song && (
                          <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                            ♪ {p.song}
                          </div>
                        )}
                      </td>
                      <td style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                        {fmtDate(p.respondedAt)}
                      </td>
                      <td>
                        <RowActions
                          adminKey={key}
                          party={{
                            id: p.id,
                            name: p.name,
                            email: p.email,
                            plusOnes: p.plusOnes,
                            notes: p.notes,
                          }}
                          inviteLink={linkFor(p.code)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
