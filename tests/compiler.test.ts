import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArchitectureSpec } from '../src/schema';
import { computeDeterministicLayout } from '../src/layout';
import { applyWhiteboardDiff } from '../src/ideation';
import { compileLivingArchitectureHtml } from '../src/compiler/bundler';
import { STEPHEN_STRANGE_SPEC } from '../src/presets';
import { createCompilerService } from '../src/server';

describe('Living Architecture Canvas Compiler & Service Evals', () => {
  test('Eval 1 & 10: Self-contained HTML compilation in <500ms with zero external scripts', async () => {
    const t0 = performance.now();
    const { html, validation } = await compileLivingArchitectureHtml(STEPHEN_STRANGE_SPEC);
    const elapsed = performance.now() - t0;

    expect(validation.valid).toBe(true);
    expect(elapsed).toBeLessThan(500);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('id="architecture-spec"');
    expect(html).toContain('id="computed-layout"');
    expect(html).toContain('--bg-canvas: #F8F7F4');
    expect(html).not.toMatch(/<script[^>]+src=/i);
  });

  test('Eval 2: Line count audit on all runtime & compiler chunks (<= 90 lines)', () => {
    const base = join(import.meta.dir, '..', 'src');
    const dirs = ['runtime', 'compiler'];
    for (const d of dirs) {
      for (const file of readdirSync(join(base, d))) {
        if (!file.endsWith('.ts')) continue;
        const lines = readFileSync(join(base, d, file), 'utf8').split('\n').length;
        expect(lines).toBeLessThanOrEqual(90);
      }
    }
  });

  test('Eval 3 & 9: Deterministic layout & unresolved reference handling', () => {
    const layout1 = computeDeterministicLayout(STEPHEN_STRANGE_SPEC);
    const layout2 = computeDeterministicLayout(STEPHEN_STRANGE_SPEC);
    expect(layout1).toEqual(layout2);
    expect(layout1.unresolvedNodes).toEqual([]);

    const badSpec = structuredClone(STEPHEN_STRANGE_SPEC);
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

  test('Ideation & Whiteboard Diff Engine mutates graph and surfaces ignored operations', () => {
    const res = applyWhiteboardDiff(STEPHEN_STRANGE_SPEC, {
      timestamp: '2026-10-15T09:00:00Z',
      instruction: 'Add an event queue between Time Machine Scrubber and Topological DAG Solver',
      operations: [{ action: 'REMOVE_NODE', nodeId: 'missing-id' }],
    });

    expect(res.appliedCount).toBeGreaterThanOrEqual(3); // 1 node + 2 edges
    expect(res.ignoredOperations).toEqual([{ index: 0, reason: 'Node "missing-id" not found' }]);
    expect(res.spec.nodes.some((n) => n.kind === 'queue')).toBe(true);
  });

  test('HTTP Service endpoints (/health, /render, /scenes/add)', async () => {
    const srv = createCompilerService(0);
    try {
      const base = `http://localhost:${srv.port}`;
      const health = await fetch(`${base}/health`).then((r) => r.json());
      expect(health.status).toBe('ok');

      const renderRes = await fetch(`${base}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: STEPHEN_STRANGE_SPEC }),
      });
      expect(renderRes.status).toBe(200);
      const html = await renderRes.text();
      expect(html).toContain('Stephen Strange: Market Horizon');

      const diffRes = await fetch(`${base}/scenes/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: STEPHEN_STRANGE_SPEC,
          diff: {
            timestamp: '2026-10-15T09:00:00Z',
            operations: [
              { action: 'ADD_NODE', id: 'redis-cache', label: 'Redis Cache', planeId: 'plane-data' },
            ],
          },
        }),
      }).then((r) => r.json());

      expect(diffRes.appliedCount).toBe(1);
      expect(diffRes.html).toContain('Redis Cache');
    } finally {
      srv.stop(true);
    }
  });
});
