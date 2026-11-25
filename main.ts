// Ember & Thyme — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ beside it into /output
// (or $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with the vendored make.fun library, so the judge can read the game.
// Deterministic: the same files in always produce the same bytes out.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in a half-built entry: the game must exist before anything
// is copied, so a missing game/ fails loudly instead of producing an empty
// /output that looks like a submission.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing — nothing to hand in');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files in all, or a
// path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// A short summary on stdout, so a run's result is visible without opening
// the dossier. The bytes written are identical on every run.
const shotCount = readdirSync(join(out, 'screenshots')).filter((name) => !name.startsWith('.')).length;
const gameBytes = statSync(join(out, 'game', 'index.html')).size;
console.log(`Ember & Thyme handed in: ${shotCount} screenshots, index.html ${gameBytes} bytes -> ${out}`);
