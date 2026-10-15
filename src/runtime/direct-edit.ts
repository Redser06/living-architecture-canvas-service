// Chunk 14: src/runtime/direct-edit.ts (<= 82 lines)
import { el } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderPins(container: HTMLElement, state: CanvasRuntimeState): void {
  container.innerHTML = '';
  for (const pin of state.spec.annotations || []) {
    container.appendChild(
      el('div', { className: 'pin-badge', style: { left: `${pin.x}px`, top: `${pin.y}px` } }, [
        el('span', { className: 'pin-icon' }, ['📌']),
        el('span', { className: 'pin-text' }, [pin.text]),
      ])
    );
  }
}

export function attachDirectHtmlInteractions(
  viewportEl: HTMLElement,
  nodesEl: HTMLElement,
  getState: () => CanvasRuntimeState,
  setState: (p: Partial<CanvasRuntimeState>) => void,
  recordOp: (op: any) => void
): void {
  let dragNodeId: string | null = null, startMouse = { x: 0, y: 0 }, startPos = { x: 0, y: 0 }, moved = false;

  nodesEl.addEventListener('pointerdown', (e: PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.isContentEditable) return;
    const nodeId = (target.closest('.node-card') as HTMLElement | null)?.getAttribute('data-node-id');
    const s = getState();
    const pos = nodeId ? s.layout.nodes?.[nodeId] : null;
    if (!nodeId || !pos || s.whiteboardMode || s.pinMode) return;
    dragNodeId = nodeId; moved = false;
    startMouse = { x: e.clientX, y: e.clientY }; startPos = { x: pos.x, y: pos.y };
  });

  window.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragNodeId) return;
    const s = getState();
    const dx = (e.clientX - startMouse.x) / (s.zoom || 1), dy = (e.clientY - startMouse.y) / (s.zoom || 1);
    if (Math.hypot(dx, dy) > 5) moved = true;
    const pos = s.layout.nodes?.[dragNodeId];
    if (moved && pos) {
      pos.x = Math.round(startPos.x + dx); pos.y = Math.round(startPos.y + dy);
      const card = nodesEl.querySelector(`[data-node-id="${dragNodeId}"]`) as HTMLElement | null;
      if (card) { card.style.left = `${pos.x}px`; card.style.top = `${pos.y}px`; }
    }
  });

  window.addEventListener('pointerup', () => {
    if (dragNodeId && moved) {
      const s = getState(), pos = s.layout.nodes?.[dragNodeId];
      if (pos) {
        const plane = s.layout.planes?.find((p: any) => pos.y >= p.y && pos.y <= p.y + p.height);
        recordOp({ action: 'MOVE_NODE', nodeId: dragNodeId, x: pos.x, y: pos.y, planeId: plane?.id });
      }
    }
    dragNodeId = null;
  });

  document.getElementById('btn-add-node')?.addEventListener('click', () => {
    const s = getState();
    const label = window.prompt('New Component / Node Name:', 'Auth & Policy Service') || '';
    if (!label.trim()) return;
    const planeId = s.spec.planes?.[1]?.id || s.spec.planes?.[0]?.id || 'plane-orchestration';
    recordOp({ action: 'ADD_NODE', label: label.trim(), planeId });
    window.parent?.postMessage({ type: 'LIVING_ARCH_REFACTOR_REQUEST', spec: s.spec, operations: getState().sketchOps }, '*');
  });

  viewportEl.addEventListener('click', (e: MouseEvent) => {
    const s = getState();
    if (!s.pinMode) return;
    const rect = viewportEl.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left - s.panX) / (s.zoom || 1)), y = Math.round((e.clientY - rect.top - s.panY) / (s.zoom || 1));
    const text = window.prompt('Annotation / Change Instruction for Agent:', 'Add OAuth2 mTLS gateway here') || '';
    if (!text.trim()) return;
    (s.spec.annotations = s.spec.annotations || []).push({ id: `pin-${Date.now()}`, x, y, text: text.trim() });
    recordOp({ action: 'ADD_PIN_NOTE', x, y, text: text.trim() });
    setState({ pinMode: false });
  });
}
