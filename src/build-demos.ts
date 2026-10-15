import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileLivingArchitectureHtml } from './compiler/bundler';
import { DEFAULT_STARTER_SPEC, PAYMENT_GATEWAY_BLUEPRINT } from './presets';
import { exportSvgAndThreeJsArtifacts } from './llm';
import { renderStudioPageHtml } from './studio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

async function buildDemos() {
  const t0 = performance.now();
  rmSync(DIST_DIR, { recursive: true, force: true });
  mkdirSync(DIST_DIR, { recursive: true });

  const { html: starterHtml, layout } = await compileLivingArchitectureHtml(DEFAULT_STARTER_SPEC);
  const starterPath = join(DIST_DIR, 'starter-architecture-canvas.html');
  writeFileSync(starterPath, starterHtml, 'utf8');

  const { html: paymentHtml } = await compileLivingArchitectureHtml(PAYMENT_GATEWAY_BLUEPRINT);
  const paymentPath = join(DIST_DIR, 'payment-gateway-blueprint.html');
  writeFileSync(paymentPath, paymentHtml, 'utf8');

  const exports3d = exportSvgAndThreeJsArtifacts(DEFAULT_STARTER_SPEC);
  const svgPath = join(DIST_DIR, 'architecture-diagram.svg');
  const threePath = join(DIST_DIR, 'architecture-threejs-3d.html');
  writeFileSync(svgPath, exports3d.svg, 'utf8');
  writeFileSync(threePath, exports3d.threeJsHtml, 'utf8');

  const studioHtml = renderStudioPageHtml(DEFAULT_STARTER_SPEC, starterHtml);
  const studioPath = join(DIST_DIR, 'studio-workbench.html');
  writeFileSync(studioPath, studioHtml, 'utf8');

  const elapsedMs = (performance.now() - t0).toFixed(1);
  console.log(
    `Compiled 5 artifacts to ${DIST_DIR} (${(starterHtml.length / 1024).toFixed(1)} KB starter canvas, ${Object.keys(layout.nodes).length} nodes, ${Object.keys(layout.edges).length} edges) in ${elapsedMs}ms`
  );
}

buildDemos();
