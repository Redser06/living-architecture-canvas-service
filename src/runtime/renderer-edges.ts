// Chunk 5: src/runtime/renderer-edges.ts (<= 80 lines)
import { svgEl, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderEdges(
  svgRoot: SVGSVGElement,
  state: CanvasRuntimeState,
  onSelectEdge: (edgeId: string) => void
): void {
  clearChildren(svgRoot);
  svgRoot.setAttribute('width', String(state.layout.width));
  svgRoot.setAttribute('height', String(state.layout.height));

  const scene = state.spec.scenes?.[state.sceneIndex];
  const activeMap = new Map<string, any>();
  for (const ae of scene?.activeEdges || []) {
    activeMap.set(ae.edgeId, ae);
  }

  for (const edge of state.spec.edges || []) {
    const route = state.layout.edges?.[edge.id];
    if (!route) continue;

    const activeSpec = activeMap.get(edge.id);
    const isActive = Boolean(activeSpec);
    const motion = activeSpec?.motionOverride || edge.motionPrimitive || 'flow';

    const g = svgEl('g', { 'data-edge-id': edge.id });
    const visiblePath = svgEl('path', {
      id: `edge-path-${edge.id}`,
      d: route.pathD,
      class: `edge-path ${isActive ? `active-${motion}` : 'dimmed'}`,
    });

    const hitPath = svgEl('path', {
      d: route.pathD,
      class: 'edge-hit',
    });
    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectEdge(edge.id);
    });

    g.appendChild(visiblePath);
    g.appendChild(hitPath);

    if (edge.protocol || edge.label) {
      const labelText = svgEl('text', {
        x: route.labelX,
        y: route.labelY,
        'text-anchor': 'middle',
        fill: isActive ? '#141413' : '#9E9D99',
        'font-family': 'var(--font-mono)',
        'font-size': '10',
      });
      labelText.textContent = edge.protocol ? `[${edge.protocol}] ${edge.label || ''}`.trim() : edge.label;
      g.appendChild(labelText);
    }

    svgRoot.appendChild(g);
  }

  const packetLayer = svgEl('g', { id: 'packet-layer' });
  svgRoot.appendChild(packetLayer);
}
