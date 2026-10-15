import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArchitectureSpec } from '../src/schema';
import { computeDeterministicLayout } from '../src/layout';
import { applyWhiteboardDiff } from '../src/ideation';
import { compileLivingArchitectureHtml } from '../src/compiler/bundler';
import { DEFAULT_STARTER_SPEC } from '../src/presets';
import { createCompilerService } from '../src/server';

describe('Living Architecture Canvas Compiler, Studio & Agent Evals', () => {
  test('Eval 1 & 10: Self-contained HTML compilation in <500ms with zero external scripts and 2D/2.5D/3D engines', async () => {
    const t0 = performance.now();
    const { html, validation } = await compileLivingArchitectureHtml(DEFAULT_STARTER_SPEC);
    const elapsed = performance.now() - t0;

    expect(validation.valid).toBe(true);
    expect(elapsed).toBeLessThan(500);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('id="architecture-spec"');
    expect(html).toContain('id="computed-layout"');
    expect(html).toContain('id="webgl-canvas"');
    expect(html).toContain('id="btn-view-3d"');
    expect(html).toContain('id="btn-add-node"');
    expect(html).toContain('id="btn-pin-note"');
    expect(html).toContain('id="btn-refactor-agent"');
    expect(html).toContain('--bg-canvas: #F8F7F4');
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });

  test('Eval 2: Line count audit on all runtime & compiler chunks (<= 90 lines) & zero legacy Gemini 2.x models', () => {
    const base = join(import.meta.dir, '..', 'src');
    const dirs = ['runtime', 'compiler'];
    for (const d of dirs) {
      for (const file of readdirSync(join(base, d))) {
        if (!file.endsWith('.ts')) continue;
        const lines = readFileSync(join(base, d, file), 'utf8').split('\n').length;
        expect(lines).toBeLessThanOrEqual(90);
      }
    }

    // Verify no legacy Gemini 2.x or hardcoded Stephen Strange strings in src/
    for (const file of readdirSync(base)) {
      if (!file.endsWith('.ts')) continue;
      const content = readFileSync(join(base, file), 'utf8');
      expect(content).not.toMatch(/gemini-2\./i);
      expect(content).not.toMatch(/Stephen Strange/i);
    }
  });

  test('Eval 3 & 9: Deterministic layout, node position overrides & unresolved reference handling', () => {
    const layout1 = computeDeterministicLayout(DEFAULT_STARTER_SPEC);
    const layout2 = computeDeterministicLayout(DEFAULT_STARTER_SPEC);
    expect(layout1).toEqual(layout2);
    expect(layout1.unresolvedNodes).toEqual([]);

    const badSpec = structuredClone(DEFAULT_STARTER_SPEC);
    badSpec.nodes.push({
      id: 'orphan-node',
      label: 'Orphan',
      kind: 'service',
      planeId: 'non-existent-plane',
      summary: 'Invalid plane test',
      metadata: {},
    });
    const check = validateArchitectureSpec(badSpec);
    expect(check.valid).toBe(false);
    expect(check.unresolvedReferences).toContain('node:orphan-node->plane:non-existent-plane');
  });

  test('Eval 4: Direct HTML Page Edits (UPDATE_NODE, MOVE_NODE, ADD_PIN_NOTE) & NL Ideation mutate graph from scratch', () => {
    const res = applyWhiteboardDiff(DEFAULT_STARTER_SPEC, {
      timestamp: '2026-10-15T09:00:00Z',
      instruction: 'Add an event queue between Client Access Point and Core Orchestrator API',
      operations: [
        { action: 'REMOVE_NODE', nodeId: 'missing-id' },
        { action: 'UPDATE_NODE', nodeId: 'core-service', label: 'Policy & Routing Engine', protocol: 'gRPC-v2' },
        { action: 'MOVE_NODE', nodeId: 'client-entry', x: 140, y: 88 },
        { action: 'ADD_PIN_NOTE', x: 320, y: 180, text: 'Add OAuth2 mTLS gateway here' },
      ],
    });

    expect(res.appliedCount).toBeGreaterThanOrEqual(6);
    expect(res.ignoredOperations).toEqual([{ index: 0, reason: 'Node "missing-id" not found' }]);
    expect(res.spec.nodes.some((n) => n.kind === 'queue')).toBe(true);
    expect(res.spec.nodes.find((n) => n.id === 'core-service')?.label).toBe('Policy & Routing Engine');
    expect(res.spec.nodes.find((n) => n.id === 'client-entry')?.positionOverride).toEqual({ x: 140, y: 88 });
    expect(res.spec.annotations?.length).toBeGreaterThanOrEqual(1);
  });

  test('Eval 5: Studio Landing Page, Chat/Image Generate (3.8 Flash / 4 Argon), Direct HTML Refactor, 3D Export & Browser Validation', async () => {
    const srv = createCompilerService(0);
    try {
      const base = `http://localhost:${srv.port}`;
      const health = await fetch(`${base}/health`).then((r) => r.json());
      expect(health.status).toBe('ok');
      expect(health.models).toEqual({ baseline: 'gemini-3.8-flash', heavyLift: 'gemini-4-argon' });

      // 1. Landing Page & Studio Workbench (Blank Starter Canvas, Gemini 3.8 Flash & 4 Argon)
      const studioHtml = await fetch(`${base}/`).then((r) => r.text());
      expect(studioHtml).toContain('Living Architecture Studio');
      expect(studioHtml).toContain('gemini-3.8-flash');
      expect(studioHtml).toContain('gemini-4-argon');
      expect(studioHtml).not.toContain('gemini-2.5');
      expect(studioHtml).not.toContain('Stephen Strange');

      // 2. Standalone Canvas endpoint
      const rawCanvasHtml = await fetch(`${base}/canvas`).then((r) => r.text());
      expect(rawCanvasHtml).toContain('Untitled System Architecture');
      expect(rawCanvasHtml).toContain('id="webgl-canvas"');

      // 3. Multimodal Prompt + Image Generation (/api/generate)
      const genRes = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Design an omnichannel payment acquiring and AI fraud risk scoring mesh',
          model: 'gemini-3.8-flash',
          apiKey: 'offline',
          images: [
            {
              mimeType: 'image/png',
              dataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              name: 'sketch.png',
            },
          ],
        }),
      }).then((r) => r.json());
      expect(genRes.spec.nodes.length).toBeGreaterThanOrEqual(5);
      expect(genRes.html).toContain('<!DOCTYPE html>');
      expect(genRes.svg).toContain('<svg');
      expect(genRes.threeJsSceneJson.meshes.length).toBeGreaterThanOrEqual(5);

      // 4. Direct HTML Edit & Annotation Refactor (/api/refactor)
      const refRes = await fetch(`${base}/api/refactor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: DEFAULT_STARTER_SPEC,
          model: 'gemini-3.8-flash',
          diff: {
            timestamp: '2026-10-15T10:00:00Z',
            operations: [
              { action: 'UPDATE_NODE', nodeId: 'core-service', label: 'Streaming gRPC Core' },
              { action: 'ADD_PIN_NOTE', x: 400, y: 210, text: 'Add Redis Rate Limiter' },
            ],
          },
        }),
      }).then((r) => r.json());
      expect(refRes.appliedCount).toBeGreaterThanOrEqual(2);
      expect(refRes.html).toContain('Streaming gRPC Core');
      expect(refRes.html).toContain('Redis Rate Limiter');

      // 5. 3D Three.js & SVG Export (/api/export-3d)
      const exp3d = await fetch(`${base}/api/export-3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: DEFAULT_STARTER_SPEC }),
      }).then((r) => r.json());
      expect(exp3d.svg).toContain('<svg');
      expect(exp3d.threeJsHtml).toContain('THREE.WebGLRenderer');

      // 6. Browser & Screenshot Validation (/api/validate-render)
      const valRes = await fetch(`${base}/api/validate-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: DEFAULT_STARTER_SPEC, captureScreenshot: false }),
      }).then((r) => r.json());
      expect(valRes.valid).toBe(true);
      expect(valRes.checks.length).toBeGreaterThanOrEqual(5);
      expect(valRes.screenshotDataUrl).toBeDefined();
    } finally {
      srv.stop(true);
    }
  });
});
