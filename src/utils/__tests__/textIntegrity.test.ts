import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

import { hasMojibake, isTextIntact, MOJIBAKE_GREP_PATTERN } from '../textIntegrity';

/**
 * Guard against mis-encoded text.
 *
 * The last case is the one that matters: it scans the repository itself. This
 * project has shipped a mangled star twice, both times because a file was read
 * as Latin-1 and written back as UTF-8. TypeScript and ESLint accept that text
 * because it is still valid source code; this suite checks the bytes and the
 * decoded text explicitly.
 */

const fromCodePoints = (...codepoints: number[]) => String.fromCodePoint(...codepoints);

// Fixtures are assembled from codepoints so the source never contains the
// sequences that the repository-wide guard is supposed to reject.
const MANGLED_STAR = fromCodePoints(0x00e2, 0x02dc, 0x2026);
const MANGLED_CEDILLA = fromCodePoints(0x00c3, 0x00a7);
const MANGLED_TILDE = fromCodePoints(0x00c3, 0x00b5);
const MANGLED_EM_DASH = fromCodePoints(0x00e2, 0x20ac, 0x201d);
const MANGLED_BULLET = fromCodePoints(0x00e2, 0x20ac, 0x00a2);
const MANGLED_F_HOOK = fromCodePoints(0x00c3, 0x0192);
const MANGLED_REPLACEMENT_BYTES = fromCodePoints(0x00ef, 0x00bf, 0x00bd);
const REPLACEMENT_CHAR = fromCodePoints(0xfffd);
const MANGLED_WORD = `Avalia${MANGLED_CEDILLA}${MANGLED_TILDE}es`;
const STAR_GLYPH = fromCodePoints(0x2605);
const STAR_GLYPH_PATTERN = [0x2605, 0x2b50, 0x2606]
  .map((codepoint) => `\\x{${codepoint.toString(16)}}`)
  .join('|');

describe('hasMojibake', () => {
  it.each([
    [MANGLED_STAR, 'a mangled star'],
    [MANGLED_CEDILLA, 'a mangled cedilla'],
    [MANGLED_TILDE, 'a mangled tilde'],
    [MANGLED_EM_DASH, 'a mangled em dash'],
    [MANGLED_BULLET, 'a mangled bullet'],
    [MANGLED_F_HOOK, 'a double-decoded F-hook sequence'],
    [MANGLED_REPLACEMENT_BYTES, 'double-decoded replacement bytes'],
    [MANGLED_WORD, 'a mangled word'],
    [REPLACEMENT_CHAR, 'the replacement character'],
  ])('flags %s (%s)', (value) => {
    expect(hasMojibake(value)).toBe(true);
  });

  it.each([
    ['Avaliações de Marina S.', 'accented Portuguese'],
    ['Av. Litorânea, Calhau', 'a circumflex, which is a real letter here'],
    ['Ângela — sim, com travessão', 'a leading Â-range letter plus a real dash'],
    ['há 2 dias', 'a grave accent'],
    ['Ambiente ótimo, atendimento rápido.', 'a full sentence'],
    [`${STAR_GLYPH} 5,0`, 'a real star glyph'],
    ['', 'an empty string'],
  ])('accepts %s (%s)', (value) => {
    expect(hasMojibake(value)).toBe(false);
  });

  it('does not flag ordinary Portuguese words beginning with the trigger letters', () => {
    // `â` and `Ã` are letters, not evidence. Matching them alone would reject
    // half the venue names in the catalogue.
    for (const word of ['âmbar', 'ânimo', 'Ângela', 'Ãbaco']) {
      expect(hasMojibake(word)).toBe(false);
    }
  });
});

describe('isTextIntact', () => {
  it('passes when every value is clean', () => {
    expect(isTextIntact('Marina S.', 'há 2 dias', undefined, null)).toBe(true);
  });

  it('fails when any value is mangled', () => {
    expect(isTextIntact('Marina S.', `${MANGLED_STAR} 5`)).toBe(false);
  });
});

describe('the repository itself', () => {
  const ROOT = path.resolve(__dirname, '../../..');
  const TEXT_EXTENSIONS = new Set([
    '.cjs',
    '.css',
    '.example',
    '.html',
    '.js',
    '.json',
    '.jsx',
    '.md',
    '.mjs',
    '.ts',
    '.tsx',
    '.txt',
    '.yaml',
    '.yml',
  ]);
  const REPOSITORY_TEXT_PATHS = [...TEXT_EXTENSIONS].map((extension) => `*${extension}`);

  /**
   * Includes tracked and untracked files while respecting `.gitignore`, so a new
   * source file cannot evade the guard before its first commit.
   */
  function gitGrep(pattern: string, paths: string[]): string[] {
    try {
      const output = execFileSync(
        'git',
        ['grep', '--untracked', '--no-color', '-n', '-P', pattern, '--', ...paths],
        { cwd: ROOT, encoding: 'utf8' },
      );
      return output.split('\n').filter(Boolean);
    } catch (error) {
      // git grep exits 1 when there are no matches, which is the good case.
      const status = (error as { status?: number }).status;
      if (status === 1) return [];
      throw error;
    }
  }

  function repositoryTextFiles(paths: string[]): string[] {
    const output = execFileSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...paths],
      { cwd: ROOT, encoding: 'utf8' },
    );

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => existsSync(path.resolve(ROOT, file)))
      .filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()));
  }

  it('contains no mis-encoded text in repository text files', () => {
    // The exact signature the runtime detector uses, generated from the same
    // codepoint table, so the file scan and the app can never disagree about
    // what counts as broken.
    expect(gitGrep(MOJIBAKE_GREP_PATTERN, REPOSITORY_TEXT_PATHS)).toEqual([]);
  });

  it('contains no replacement characters in repository text files', () => {
    expect(gitGrep('\\x{fffd}', REPOSITORY_TEXT_PATHS)).toEqual([]);
  });

  it('renders stars as vectors, never as a literal glyph', () => {
    // The glyph is what the encoding bug destroyed. Keeping it out of the source
    // removes the failure mode rather than repairing its output.
    expect(gitGrep(STAR_GLYPH_PATTERN, ['src', 'app'])).toEqual([]);
  });

  it('stores source text as valid UTF-8 without a byte-order mark', () => {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const problems: string[] = [];

    for (const relativePath of repositoryTextFiles(['.'])) {
      const bytes = readFileSync(path.resolve(ROOT, relativePath));
      const hasBom =
        bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;

      if (hasBom) problems.push(`${relativePath}: UTF-8 BOM`);

      try {
        decoder.decode(bytes);
      } catch {
        problems.push(`${relativePath}: invalid UTF-8`);
      }
    }

    expect(problems).toEqual([]);
  });
});
