import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStats, listParties, type Party } from "@/lib/db";
import { bulkAddAction, createPartyAction, updatePartyAction } from "./actions";
import { DeleteButton } from "./delete-button";

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

function statusLabel(p: Party): { text: string; color: string } {
  if (p.attending === "yes") return { text: "Attending", color: "#009900" };
  if (p.attending === "no") return { text: "Declined", color: "#cc0000" };
  return { text: "No response", color: "#999999" };
}

type Filter = "all" | "pending" | "attending" | "declined";

function matchesFilter(attending: "yes" | "no" | null, filter: Filter): boolean {
  if (filter === "pending") return attending === null;
  if (filter === "attending") return attending === "yes";
  if (filter === "declined") return attending === "no";
  return true;
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
  const linkFor = (code: string) =>
    siteUrl ? `${siteUrl}/rsvp/${code}` : `/rsvp/${code}`;

  const byName = [...parties]
    .filter((p) => matchesFilter(p.attending, filter))
    .sort((a, b) => a.name.localeCompare(b.name));
  const recent = [...parties]
    .filter((p) => p.respondedAt)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 8);

  const statCells: { label: string; value: string; color: string }[] = [
    { label: "Invites", value: String(stats.totalParties), color: "#000000" },
    { label: "Responded", value: String(stats.responded), color: "#0000cc" },
    { label: "Pending", value: String(stats.pending), color: "#999900" },
    { label: "Accepted", value: String(stats.accepted), color: "#009900" },
    { label: "Declined", value: String(stats.declined), color: "#cc0000" },
    { label: "Headcount", value: String(stats.headcount), color: "#cc00cc" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="text-center my-4">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#cc00cc" }}>
          ~*~ Guest Admin ~*~
        </h1>
        <p className="comic text-sm mt-1" style={{ color: "#666666" }}>
          {Math.round(stats.responseRate * 100)}% responded
        </p>
      </div>

      <hr className="rainbow-hr my-4" />

      {/* Stats */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {statCells.map((c) => (
          <div key={c.label} className="bevel-out px-4 py-2 text-center min-w-24">
            <div className="text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="text-xs" style={{ color: "#666666" }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mb-6">
        <p className="font-bold text-sm mb-2" style={{ color: "#cc00cc" }}>
          Export for mailmerge
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <a href={`/admin/${key}/export`} className="btn-90s text-sm" download>
            [ Everyone ]
          </a>
          <a
            href={`/admin/${key}/export?status=pending`}
            className="btn-90s text-sm"
            download
          >
            [ Not responded ({stats.pending}) ]
          </a>
          <a
            href={`/admin/${key}/export?status=attending`}
            className="btn-90s text-sm"
            download
          >
            [ Attending ({stats.accepted}) ]
          </a>
          <a
            href={`/admin/${key}/export?status=declined`}
            className="btn-90s text-sm"
            download
          >
            [ Declined ({stats.declined}) ]
          </a>
        </div>
        <p className="comic text-xs mt-2" style={{ color: "#666666" }}>
          Each CSV has every invite&apos;s personalized link. Use{" "}
          <b>Not responded</b> for reminder emails and <b>Attending</b> for
          confirmations.
        </p>
      </div>

      {/* Add one invitee */}
      <div className="bevel-in p-4 mb-4">
        <p className="font-bold text-sm mb-2" style={{ color: "#cc00cc" }}>
          + Add an invite
        </p>
        <form action={createPartyAction} className="flex flex-wrap gap-2 items-end">
          <input type="hidden" name="key" value={key} />
          <div>
            <label className="block text-xs font-bold mb-1">Name</label>
            <input type="text" name="name" required placeholder="Jane Doe / The Smiths" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Email</label>
            <input type="email" name="email" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Max guests</label>
            <input
              type="number"
              name="maxGuests"
              min={1}
              defaultValue={1}
              style={{ width: "5rem" }}
            />
          </div>
          <button type="submit" className="btn-90s text-sm">
            Add
          </button>
        </form>
      </div>

      {/* Bulk add */}
      <details className="bevel-in p-4 mb-6">
        <summary className="font-bold text-sm cursor-pointer" style={{ color: "#cc00cc" }}>
          + Bulk add (paste a list)
        </summary>
        <form action={bulkAddAction} className="mt-3">
          <input type="hidden" name="key" value={key} />
          <p className="comic text-xs mb-2" style={{ color: "#666666" }}>
            One per line: <span className="courier">Name, email, maxGuests</span>{" "}
            (email and maxGuests optional). A unique code is generated for each.
          </p>
          <textarea
            name="bulk"
            rows={5}
            className="w-full"
            placeholder={"The Smith Family, smiths@example.com, 4\nJane Doe, jane@example.com, 1"}
          />
          <div className="mt-2">
            <button type="submit" className="btn-90s text-sm">
              Add all
            </button>
          </div>
        </form>
      </details>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="bevel-out p-4 mb-6">
          <p className="font-bold text-sm mb-2">Latest responses</p>
          <ul className="text-sm">
            {recent.map((p) => {
              const s = statusLabel(p);
              return (
                <li key={p.id} className="mb-1">
                  <span style={{ color: s.color }} className="font-bold">
                    {s.text}
                  </span>{" "}
                  &mdash; {p.name}
                  {p.attending === "yes" ? ` (${p.guests.length})` : ""}{" "}
                  <span style={{ color: "#999999" }}>· {fmtDate(p.updatedAt)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Guest table */}
      <h2 className="font-bold text-lg mb-2">Guest list</h2>
      {parties.length === 0 ? (
        <p className="comic text-sm" style={{ color: "#666666" }}>
          No invites yet &mdash; add some above.
        </p>
      ) : (
        <>
          <div className="text-sm mb-2">
            Show:{" "}
            {(
              [
                { f: "all", label: `All (${parties.length})` },
                { f: "pending", label: `Not responded (${stats.pending})` },
                { f: "attending", label: `Attending (${stats.accepted})` },
                { f: "declined", label: `Declined (${stats.declined})` },
              ] as const
            ).map((opt, i) => (
              <span key={opt.f}>
                {i > 0 && " · "}
                {filter === opt.f ? (
                  <b>{opt.label}</b>
                ) : (
                  <a
                    href={
                      opt.f === "all"
                        ? `/admin/${key}`
                        : `/admin/${key}?filter=${opt.f}`
                    }
                  >
                    {opt.label}
                  </a>
                )}
              </span>
            ))}
          </div>
          {byName.length === 0 ? (
            <p className="comic text-sm" style={{ color: "#666666" }}>
              No invites in this view.
            </p>
          ) : (
        <table className="retro-table w-full text-sm">
          <thead>
            <tr style={{ background: "#d4d0c8" }}>
              <th>Name</th>
              <th>Status</th>
              <th>Guests</th>
              <th>Link</th>
              <th>Responded</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {byName.map((p) => {
              const s = statusLabel(p);
              return (
                <tr key={p.id}>
                  <td>
                    <span className="font-bold">{p.name}</span>
                    {p.email && (
                      <div className="text-xs" style={{ color: "#666666" }}>
                        {p.email}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: "#999999" }}>
                      max {p.maxGuests}
                    </div>
                  </td>
                  <td style={{ color: s.color, fontWeight: "bold" }}>{s.text}</td>
                  <td>
                    {p.attending === "yes" && p.guests.length > 0 ? (
                      <ul>
                        {p.guests.map((g, i) => (
                          <li key={i}>
                            {g.name}
                            {g.dietary && (
                              <span style={{ color: "#cc0000" }}> ({g.dietary})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                    {p.song && (
                      <div className="text-xs" style={{ color: "#666666" }}>
                        &#9834; {p.song}
                      </div>
                    )}
                  </td>
                  <td className="courier text-xs" style={{ wordBreak: "break-all" }}>
                    {linkFor(p.code)}
                  </td>
                  <td className="text-xs">{fmtDate(p.respondedAt)}</td>
                  <td>
                    <details>
                      <summary className="cursor-pointer">edit</summary>
                      <form action={updatePartyAction} className="mt-2 mb-2">
                        <input type="hidden" name="key" value={key} />
                        <input type="hidden" name="id" value={p.id} />
                        <label className="block text-xs font-bold">Name</label>
                        <input type="text" name="name" defaultValue={p.name} className="w-full mb-1" />
                        <label className="block text-xs font-bold">Email</label>
                        <input type="email" name="email" defaultValue={p.email} className="w-full mb-1" />
                        <label className="block text-xs font-bold">Max guests</label>
                        <input type="number" name="maxGuests" min={1} defaultValue={p.maxGuests} className="mb-1" style={{ width: "5rem" }} />
                        <label className="block text-xs font-bold">Notes</label>
                        <textarea name="notes" defaultValue={p.notes} rows={2} className="w-full mb-2" />
                        <button type="submit" className="btn-90s text-xs">
                          Save
                        </button>
                      </form>
                    </details>
                    <DeleteButton adminKey={key} id={p.id} name={p.name} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          )}
        </>
      )}
    </div>
  );
}
