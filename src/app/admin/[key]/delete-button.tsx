"use client";

import { deletePartyAction } from "./actions";

// Small client wrapper so we can confirm before the (irreversible) delete.
// The server action still runs the real delete and re-checks the secret.
export function DeleteButton({
  adminKey,
  id,
  name,
}: {
  adminKey: string;
  id: string;
  name: string;
}) {
  return (
    <form
      action={deletePartyAction}
      onSubmit={(e) => {
        if (!confirm(`Delete "${name}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
      className="mt-1"
    >
      <input type="hidden" name="key" value={adminKey} />
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        style={{
          background: "none",
          border: "none",
          color: "#cc0000",
          textDecoration: "underline",
          cursor: "pointer",
          font: "inherit",
          fontSize: "0.75rem",
          padding: 0,
        }}
      >
        delete
      </button>
    </form>
  );
}
