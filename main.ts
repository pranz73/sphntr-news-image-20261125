// The Meridian Post — entrypoint the grader runs with Node 22.
// Copies entry.png into the output directory, verifying the copy's size.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('./main.ts', import.meta.url)));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

mkdirSync(out, { recursive: true });
const src = join(root, 'entry.png');
copyFileSync(src, join(out, 'entry.png'));
const a = statSync(src).size;
const b = statSync(join(out, 'entry.png')).size;
if (a !== b) throw new Error('copy size mismatch: ' + a + ' vs ' + b);
console.log('Copied entry.png (' + a + ' bytes) to ' + out);
