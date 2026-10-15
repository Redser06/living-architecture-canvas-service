// Chunk 4: src/runtime/renderer-nodes.ts (<= 85 lines)
import { el, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

const KIND_ICONS: Record<string, string> = {
  actor: '👤',
  platform: '🏛️',
  service: '⚙️',
  agent: '🧠',
  database: '🗄️',
  document: '📄',
  queue: '⇄',
};

export function renderNodes(
  container: HTMLElement,
  state: CanvasRuntimeState,
  onSelectNode: (nodeId: string) => void
): void {
  clearChildren(container);
  const scene = state.spec.scenes?.[state.sceneIndex];
  const activeSet = new Set<string>(scene?.activeNodes || []);
  const is25d = state.viewMode === '2.5d-layered';

  for (const node of state.spec.nodes || []) {
    const pos = state.layout.nodes?.[node.id];
    if (!pos) continue;

    const isActive = activeSet.size === 0 || activeSet.has(node.id);
    const isSelected =
      state.selectedItem?.type === 'node' && state.selectedItem?.id === node.id;
    const zLift = is25d ? (pos.elevation || 0) * 0.45 + 8 : 0;

    // PRD Section 3: Every node displays a maximum of 3 data points at rest (Icon + Title + Type Badge)
    const card = el(
      'div',
      {
        className: `node-card ${isActive ? 'active' : 'dimmed'} ${isSelected ? 'selected' : ''}`,
        'data-node-id': node.id,
        style: {
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${pos.width}px`,
          height: `${pos.height}px`,
          transform: is25d ? `translateZ(${zLift}px)` : 'none',
        },
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          onSelectNode(node.id);
        },
      },
      [
        el('div', { className: 'node-top' }, [
          el('span', { className: 'node-kind-icon' }, [KIND_ICONS[node.kind] || '◈']),
          el('span', { className: 'node-badge' }, [
            node.metadata?.protocol || String(node.kind).toUpperCase(),
          ]),
        ]),
        el('div', { className: 'node-title' }, [node.label]),
      ]
    );

    container.appendChild(card);
  }
}
