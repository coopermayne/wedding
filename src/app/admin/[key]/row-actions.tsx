"use client";

import { useState, useTransition } from "react";
import { deletePartyAction, updatePartyAction } from "./actions";

type EditableParty = {
  id: string;
  name: string;
  email: string;
  plusOnes: number;
  notes: string;
};

export function RowActions({
  adminKey,
  party,
  inviteLink,
}: {
  adminKey: string;
  party: EditableParty;
  inviteLink: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (e.g. non-HTTPS); fall back to a prompt.
      window.prompt("Copy this invite link:", inviteLink);
    }
  }

  function onDelete() {
    if (!confirm(`Delete "${party.name}"? This can't be undone.`)) return;
    const fd = new FormData();
    fd.set("key", adminKey);
    fd.set("id", party.id);
    startDelete(() => {
      deletePartyAction(fd);
    });
  }

  return (
    <div className="flex gap-1.5 justify-end items-center">
      <button className="btn btn-secondary btn-sm" onClick={copyLink}>
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        Edit
      </button>
      <button
        className="btn btn-danger btn-sm"
        onClick={onDelete}
        disabled={deleting}
      >
        {deleting ? "…" : "Delete"}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "left" }}
          >
            <h3 className="font-semibold text-lg mb-4">Edit invite</h3>
            <form
              action={(fd) =>
                startSave(async () => {
                  await updatePartyAction(fd);
                  setOpen(false);
                })
              }
            >
              <input type="hidden" name="key" value={adminKey} />
              <input type="hidden" name="id" value={party.id} />
              <div className="mb-3">
                <label className="admin-label">Name</label>
                <input
                  className="w-full"
                  name="name"
                  defaultValue={party.name}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="admin-label">Email</label>
                <input
                  className="w-full"
                  type="email"
                  name="email"
                  defaultValue={party.email}
                />
              </div>
              <div className="mb-3">
                <label className="admin-label">Plus-ones (0–5)</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  name="plusOnes"
                  defaultValue={party.plusOnes}
                  style={{ width: "6rem" }}
                />
              </div>
              <div className="mb-4">
                <label className="admin-label">Private notes (only you see these)</label>
                <textarea
                  className="w-full"
                  name="notes"
                  rows={2}
                  defaultValue={party.notes}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
