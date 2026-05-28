// Pure text sanitizer shared by the client form and the server.
//
// We allow letters (any language, including accents), numbers, spaces, and the
// punctuation that shows up in real names and dietary notes — apostrophes,
// hyphens, periods, commas, parentheses, slashes, ampersands. Everything else
// is removed, including the characters a spreadsheet treats as a formula
// (= + @ and a leading -), so guest-entered text can't smuggle formulas into
// the CSV export or pull any other funny business.

const DISALLOWED = /[^\p{L}\p{M}\p{N} '\-.,()/&]/gu;
// Combining marks not attached to a letter — e.g. an emoji variation selector
// left behind after its base emoji was stripped. We keep marks that follow a
// letter so accented and non-Latin scripts (José, नमस्ते, etc.) stay intact.
const ORPHAN_MARKS = /(?<!\p{L})\p{M}+/gu;
const LEADING_FORMULA = /^[=+\-@\t\r]+/;

/** Live filter for form inputs: drop disallowed characters, keep spacing as typed. */
export function stripDisallowedChars(input: string): string {
  return (input ?? "").replace(DISALLOWED, "").replace(ORPHAN_MARKS, "");
}

/**
 * Full clean for storage: strip disallowed characters, remove any leading
 * formula characters, collapse runs of whitespace, trim, and cap the length.
 */
export function sanitizeText(input: string, maxLen = 200): string {
  return stripDisallowedChars(input ?? "")
    .replace(LEADING_FORMULA, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}
