"use client";

import { useRouter } from "next/navigation";

export type Option = { value: string; label: string };
export type OptionGroup = { label: string | null; options: Option[] };

/**
 * Show/sort controls for the guest list.
 *
 * Two labelled dropdowns rather than a wall of chips: the filters are one
 * choice out of six, which is what a select is for, and it stays one line on a
 * phone. Navigating on change keeps the state in the URL, so a filtered view
 * is still a link you can bookmark or reload.
 */
export function ListControls({
  adminKey,
  filter,
  sort,
  defaultSort,
  filterGroups,
  sortOptions,
}: {
  adminKey: string;
  filter: string;
  sort: string;
  defaultSort: string;
  filterGroups: OptionGroup[];
  sortOptions: Option[];
}) {
  const router = useRouter();

  function go(next: { filter?: string; sort?: string }) {
    const q = new URLSearchParams();
    const f = next.filter ?? filter;
    const s = next.sort ?? sort;
    // Defaults stay out of the URL, so the bare admin URL is the normal view.
    if (f !== "all") q.set("filter", f);
    if (s !== defaultSort) q.set("sort", s);
    const qs = q.toString();
    router.push(qs ? `/admin/${adminKey}?${qs}` : `/admin/${adminKey}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-2 text-sm">
        <span style={{ color: "#6b7280" }}>Show</span>
        <select value={filter} onChange={(e) => go({ filter: e.target.value })}>
          {filterGroups.map((group, i) =>
            group.label ? (
              <optgroup key={i} label={group.label}>
                {group.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              group.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            )
          )}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span style={{ color: "#6b7280" }}>Sort by</span>
        <select value={sort} onChange={(e) => go({ sort: e.target.value })}>
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
