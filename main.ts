// main.ts — entrypoint for news-image-20261125 (The World Gazette).
// Copies the rendered entry.png from the repository root into the output
// directory named by MAKEFUN_OUTPUT_DIR, or /output when it is absent.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const src = join(here, "entry.png");

if (!existsSync(src)) {
  console.error("entry.png not found next to main.ts; run node render.mjs first");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const dest = join(outDir, "entry.png");
copyFileSync(src, dest);
console.log("entry.png -> " + dest);
