import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileLivingArchitectureHtml } from './compiler/bundler';
import { STEPHEN_STRANGE_SPEC } from './presets';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

async function buildDemos() {
  const t0 = performance.now();
  mkdirSync(DIST_DIR, { recursive: true });
  const { html, layout } = await compileLivingArchitectureHtml(STEPHEN_STRANGE_SPEC);
  const outPath = join(DIST_DIR, 'stephen-strange-architecture.html');
  writeFileSync(outPath, html, 'utf8');
  const elapsedMs = (performance.now() - t0).toFixed(1);
  console.log(
    `Compiled ${outPath} (${(html.length / 1024).toFixed(1)} KB, ${Object.keys(layout.nodes).length} nodes, ${Object.keys(layout.edges).length} edges) in ${elapsedMs}ms`
  );
}

buildDemos();
