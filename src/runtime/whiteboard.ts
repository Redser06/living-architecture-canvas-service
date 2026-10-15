// Chunk 9: src/runtime/whiteboard.ts (<= 90 lines)
import { svgEl } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function attachWhiteboard(
  svgOverlay: SVGSVGElement,
  getState: () => CanvasRuntimeState,
  onNewOperation: (op: any) => void
): void {
  let drawing = false;
  let points: Array<{ x: number; y: number }> = [];
  let activePath: SVGPathElement | null = null;

  const toWorldPoint = (e: PointerEvent) => {
    const rect = svgOverlay.getBoundingClientRect();
    const s = getState();
    return {
      x: (e.clientX - rect.left) / (s.zoom || 1),
      y: (e.clientY - rect.top) / (s.zoom || 1),
    };
  };

  const hitTestNode = (pt: { x: number; y: number }, state: CanvasRuntimeState): string | null => {
    for (const [id, box] of Object.entries<any>(state.layout.nodes || {})) {
      if (pt.x >= box.x && pt.x <= box.x + box.width && pt.y >= box.y && pt.y <= box.y + box.height) {
        return id;
      }
    }
    return null;
  };

  svgOverlay.addEventListener('pointerdown', (e: PointerEvent) => {
    const state = getState();
    if (!state.whiteboardMode) return;
    drawing = true;
    points = [toWorldPoint(e)];
    activePath = svgEl('path', {
      fill: 'none',
      stroke: '#EA580C',
      'stroke-width': '2.5',
      'stroke-linecap': 'round',
      d: `M ${points[0].x} ${points[0].y}`,
    }) as SVGPathElement;
    svgOverlay.appendChild(activePath);
  });

  window.addEventListener('pointermove', (e: PointerEvent) => {
    if (!drawing || !activePath) return;
    const pt = toWorldPoint(e);
    points.push(pt);
    activePath.setAttribute('d', points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
  });

  window.addEventListener('pointerup', () => {
    if (!drawing || points.length < 2) {
      drawing = false;
      return;
    }
    drawing = false;
    const state = getState();
    const startNode = hitTestNode(points[0], state);
    const endNode = hitTestNode(points[points.length - 1], state);

    if (startNode && endNode && startNode !== endNode) {
      onNewOperation({ action: 'ADD_EDGE', from: startNode, to: endNode, protocol: 'Event' });
    } else {
      const endPt = points[points.length - 1];
      const plane =
        state.layout.planes?.find((p: any) => endPt.y >= p.y && endPt.y <= p.y + p.height) ||
        state.layout.planes?.[0];
      onNewOperation({
        action: 'ADD_NODE',
        label: `Sketch Node ${state.sketchOps.length + 1}`,
        planeId: plane?.id || 'plane-orchestration',
      });
    }
  });
}
