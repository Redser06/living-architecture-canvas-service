// Chunk 12: src/compiler/bundler.ts (<= 90 lines)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArchitectureSpec, type LivingArchitectureSpec } from '../schema';
import { computeDeterministicLayout } from '../layout';
import { HTML_TEMPLATE } from './template';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = join(__dirname, '..', 'runtime');

const RUNTIME_FILES = [
  'dom-utils.ts',
  'store.ts',
  'renderer-grid.ts',
  'renderer-nodes.ts',
  'renderer-edges.ts',
  'renderer-packets.ts',
  'ui-narrative.ts',
  'ui-inspector.ts',
  'whiteboard.ts',
  'app.ts',
];

let cachedRuntimeJs: string | null = null;
let cachedCss: string | null = null;

export async function bundleRuntimeJs(): Promise<string> {
  if (cachedRuntimeJs) return cachedRuntimeJs;
  const entryPath = join(RUNTIME_DIR, 'app.ts');
  const buildResult = await Bun.build({
    entrypoints: [entryPath],
    target: 'browser',
    format: 'esm',
    minify: false,
  });

  if (!buildResult.success || buildResult.outputs.length === 0) {
    throw new Error('Failed to bundle client runtime');
  }

  const rawEsm = await buildResult.outputs[0].text();
  // Strip trailing export statement and wrap in IIFE that calls bootLivingArchitectureCanvas()
  const cleaned = rawEsm.replace(/export\s*\{[^}]*\};?\s*$/m, '');
  cachedRuntimeJs = `(() => {\n${cleaned}\nif (typeof bootLivingArchitectureCanvas === 'function') bootLivingArchitectureCanvas();\n})();`;
  return cachedRuntimeJs;
}

export async function compileLivingArchitectureHtml(spec: LivingArchitectureSpec): Promise<{
  html: string;
  layout: ReturnType<typeof computeDeterministicLayout>;
  validation: ReturnType<typeof validateArchitectureSpec>;
}> {
  const validation = validateArchitectureSpec(spec);
  if (!validation.valid) {
    throw new Error(
      `Invalid LivingArchitectureSpec: ${validation.issues.map((i) => i.message).join('; ')}`
    );
  }

  const layout = computeDeterministicLayout(spec);
  if (!cachedCss) {
    cachedCss = readFileSync(join(RUNTIME_DIR, 'styles.css'), 'utf8');
  }
  const runtimeJs = await bundleRuntimeJs();

  const html = HTML_TEMPLATE.replace(/\{\{TITLE\}\}/g, spec.meta.title)
    .replace(/\{\{VERSION\}\}/g, spec.meta.version || '1.0')
    .replace('{{STYLES}}', cachedCss)
    .replace('{{SPEC_JSON}}', JSON.stringify(spec, null, 2))
    .replace('{{LAYOUT_JSON}}', JSON.stringify(layout))
    .replace('{{RUNTIME_JS}}', () => runtimeJs);

  return { html, layout, validation };
}
