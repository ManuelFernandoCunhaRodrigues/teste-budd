/**
 * Detection of mis-decoded text ("mojibake").
 *
 * When UTF-8 bytes are read as Latin-1 and written back as UTF-8, every
 * non-ASCII character expands into a fixed two- or three-character sequence: a
 * star becomes `a-circumflex` + `small tilde` + `ellipsis`, a cedilla becomes
 * `A-tilde` + `section sign`. The result is still valid UTF-8 and still valid
 * TypeScript, so the compiler, the linter and any snapshot test accept it
 * happily. Only a reader notices.
 *
 * This is a *detector*, not a repairer. Silently reversing the damage would hide
 * a broken encoding somewhere upstream, and a second pass through the same bug
 * is not reliably reversible. Callers should drop or report, never patch.
 */

type CodepointRange = readonly [start: number, end: number];

/**
 * Lead codepoints of a mis-decoded UTF-8 sequence.
 *
 * U+00C2, U+00C3 and U+00E2 cover the common two- and three-byte cases.
 * U+00EF covers UTF-8's replacement bytes after they themselves were decoded
 * through Windows-1252.
 *
 * Matching one of these alone would be wrong — several are ordinary letters in
 * names or Portuguese prose. What gives mojibake away is one of them *followed
 * by* a CP1252 continuation character, which essentially never happens in real
 * prose.
 */
const LEAD: readonly CodepointRange[] = [
  [0x00c2, 0x00c3],
  [0x00e2, 0x00e2],
  [0x00ef, 0x00ef],
];

/**
 * Where a mis-decoded continuation byte lands: the C1 block, plus the handful of
 * characters CP1252 maps outside Latin-1 — curly quotes, dashes, bullet,
 * ellipsis, euro, trademark.
 */
const TRAIL: readonly CodepointRange[] = [
  [0x0080, 0x00bf],
  [0x0152, 0x0153],
  [0x0160, 0x0161],
  [0x0178, 0x0178],
  [0x017d, 0x017e],
  [0x0192, 0x0192],
  [0x02c6, 0x02c6],
  [0x02dc, 0x02dc],
  [0x2013, 0x2014],
  [0x2018, 0x201e],
  [0x2020, 0x2022],
  [0x2026, 0x2026],
  [0x2030, 0x2030],
  [0x2039, 0x203a],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
];

const hex = (code: number) => code.toString(16).padStart(4, '0');

/** Renders the ranges as a character class in one of two escape dialects. */
function toCharClass(ranges: readonly CodepointRange[], dialect: 'js' | 'pcre'): string {
  const escape = (code: number) =>
    dialect === 'js' ? `\\u${hex(code)}` : `\\x{${hex(code)}}`;

  return ranges
    .map(([start, end]) => (start === end ? escape(start) : `${escape(start)}-${escape(end)}`))
    .join('');
}

/**
 * Built from codepoints rather than written literally, and it has to stay that
 * way: a detector spelled with the characters it hunts would be destroyed by the
 * very bug it exists to catch, and would then quietly pass everything.
 */
const MOJIBAKE = new RegExp(`[${toCharClass(LEAD, 'js')}][${toCharClass(TRAIL, 'js')}]`);

/** U+FFFD — what a decoder emits when it gives up entirely. */
const REPLACEMENT_CHAR = String.fromCodePoint(0xfffd);

/** The same signature as a PCRE class pair, for scanning files with `git grep -P`. */
export const MOJIBAKE_GREP_PATTERN = `[${toCharClass(LEAD, 'pcre')}][${toCharClass(TRAIL, 'pcre')}]`;

/** True when `value` shows signs of having been decoded with the wrong charset. */
export function hasMojibake(value: string): boolean {
  return MOJIBAKE.test(value) || value.includes(REPLACEMENT_CHAR);
}

/** True when every string given is clean. Non-strings are ignored. */
export function isTextIntact(...values: (string | undefined | null)[]): boolean {
  return values.every((value) => typeof value !== 'string' || !hasMojibake(value));
}
