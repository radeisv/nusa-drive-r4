// Nusa Drive — entry program for make.fun gta6-01 (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository to the output directory
// and writes /output/dossier.json with the kit's buildDossier, exactly as the
// gate rebuilds it. Run outside the grader with MAKEFUN_OUTPUT_DIR=out.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(new URL('./main.ts', import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
for (const name of ['game', 'screenshots']) {
  const dest = join(outDir, name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(repoRoot, name), dest, { recursive: true });
}
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`nusa-drive-r4: wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
