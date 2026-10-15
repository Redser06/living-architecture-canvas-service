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
  onSelectNode: (nodeId: string) => void,
  onDirectEditNode?: (op: any) => void
): void {
  clearChildren(container);
  const scene = state.spec.scenes?.[state.sceneIndex];
  const activeSet = new Set<string>(scene?.activeNodes || []);
  const is25d = state.viewMode === '2.5d-layered';

  for (const node of state.spec.nodes || []) {
    const pos = state.layout.nodes?.[node.id];
    if (!pos) continue;

    const isActive = activeSet.size === 0 || activeSet.has(node.id);
    const isSelected = state.selectedItem?.type === 'node' && state.selectedItem?.id === node.id;
    const zLift = is25d ? (pos.elevation || 0) * 0.45 + 8 : 0;

    const titleEl = el('div', { className: 'node-title', title: 'Double-click to edit label directly' }, [node.label]);
    titleEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      titleEl.contentEditable = 'true';
      titleEl.focus();
    });
    titleEl.addEventListener('blur', () => {
      titleEl.contentEditable = 'false';
      const next = (titleEl.textContent || '').trim();
      if (next && next !== node.label) {
        node.label = next;
        onDirectEditNode?.({ action: 'UPDATE_NODE', nodeId: node.id, label: next });
      }
    });

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
        titleEl,
      ]
    );

    container.appendChild(card);
  }
}
