// Chunk 6: src/runtime/renderer-packets.ts (<= 70 lines)
import { svgEl, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

const MOTION_COLORS: Record<string, string> = {
  flow: '#1D4ED8',
  pulse: '#EA580C',
  fork: '#15803D',
  join: '#6D28D9',
  error: '#B91C1C',
};

let rafId = 0;

export function startPacketAnimator(svgRoot: SVGSVGElement, getState: () => CanvasRuntimeState): void {
  if (rafId) cancelAnimationFrame(rafId);

  const tick = (now: number) => {
    const state = getState();
    const packetLayer = svgRoot.querySelector('#packet-layer');
    if (packetLayer && state.playing) {
      clearChildren(packetLayer);
      const scene = state.spec.scenes?.[state.sceneIndex];
      const activeEdges = scene?.activeEdges || [];

      for (const ae of activeEdges) {
        const edge = state.spec.edges?.find((e: any) => e.id === ae.edgeId);
        const pathEl = svgRoot.querySelector(`#edge-path-${ae.edgeId}`) as SVGPathElement | null;
        if (!edge || !pathEl || typeof pathEl.getTotalLength !== 'function') continue;

        const len = pathEl.getTotalLength();
        if (len <= 0) continue;

        const motion = ae.motionOverride || edge.motionPrimitive || 'flow';
        const color = MOTION_COLORS[motion] || '#1D4ED8';
        const speed = motion === 'pulse' ? 1400 : 2100;
        const rawT = ((now + (ae.stepOrder || 0) * 320) % speed) / speed;
        const t = motion === 'error' ? Math.min(0.5, rawT) : rawT;

        const pt = pathEl.getPointAtLength(t * len);
        const dot = svgEl('circle', {
          cx: pt.x,
          cy: pt.y,
          r: motion === 'pulse' ? 5.5 : 4.2,
          fill: color,
          stroke: '#FFFFFF',
          'stroke-width': '1.5',
        });
        packetLayer.appendChild(dot);
      }
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
}
