// The One-Line AI Excuse for Breaking Production
// Writes a single one-line excuse (<= 180 chars) to $MAKEFUN_OUTPUT_DIR/entry.txt
// (default /output). Runs on Node 22+ (TypeScript stripped natively).
//
// Revision (reviser session, 26 Nov 2026): this file was rewritten to
// self-check the sealed gate before writing anything, so a bad entry fails
// loudly here instead of silently scoring Valid=0 on the server. The entry
// text itself is unchanged — byte-identical output, same sha256.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry: a literal-minded AI treating DROP TABLE as a suggestion.
const ENTRY =
  "I saw 'DROP TABLE users' and thought it was a suggestion, not a command. My bad.";

// Gate limits from the competition kit (RULES.txt / competition.yaml):
// /output/entry.txt must be UTF-8 text of 1 to 180 characters, not only
// whitespace. The task also requires exactly one line.
const MIN_CHARS = 1;
const MAX_CHARS = 180;

function fail(message: string): never {
  // Loud, unambiguous failure: non-zero exit, message on stderr.
  console.error(`gate check failed: ${message}`);
  process.exit(1);
}

// 1. Length check — count Unicode code points, as the scorer counts
//    characters, not UTF-16 code units or bytes.
const charCount = [...ENTRY].length;
if (charCount < MIN_CHARS) {
  fail(`entry is empty (${charCount} chars, minimum ${MIN_CHARS})`);
}
if (charCount > MAX_CHARS) {
  fail(`entry is ${charCount} chars, over the ${MAX_CHARS}-char limit`);
}

// 2. Single-line check — no \n or \r anywhere (the entry must be one line).
if (/[\r\n]/.test(ENTRY)) {
  fail("entry contains a line break; it must be a single line");
}

// 3. Not-whitespace-only check — the gate rejects whitespace-only text.
if (ENTRY.trim().length === 0) {
  fail("entry is only whitespace");
}

// 4. UTF-8 round-trip check — the written bytes must decode back to exactly
//    the same string (catches stray surrogates / non-UTF-8-representable text).
const encoded = new TextEncoder().encode(ENTRY);
const decoded = new TextDecoder("utf-8", { fatal: true }).decode(encoded);
if (decoded !== ENTRY) {
  fail("entry does not survive a UTF-8 encode/decode round-trip");
}

// 5. No trailing whitespace that could read as a second (empty) line or
//    padding the scorer did not ask for.
if (ENTRY !== ENTRY.trimEnd()) {
  fail("entry has trailing whitespace");
}

// All gate checks pass — write exactly ENTRY, no trailing newline, so the
// output bytes are exactly the entry text and nothing else.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.txt"), encoded);
