// Chunk 8: src/runtime/ui-inspector.ts (<= 90 lines)
import { el, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderInspector(
  inspectorEl: HTMLElement,
  state: CanvasRuntimeState,
  onClose: () => void
): void {
  clearChildren(inspectorEl);
  const sel = state.selectedItem;
  if (!sel) {
    inspectorEl.classList.remove('open');
    return;
  }
  inspectorEl.classList.add('open');

  const closeBtn = el(
    'button',
    { className: 'btn', style: { float: 'right' }, onClick: onClose },
    ['✕ Close']
  );
  inspectorEl.appendChild(closeBtn);

  if (sel.type === 'node') {
    const node = state.spec.nodes?.find((n: any) => n.id === sel.id);
    if (!node) return;
    const preview = node.metadata?.artifactPreview;
    const formattedPreview = preview
      ? typeof preview.content === 'string'
        ? preview.content
        : JSON.stringify(preview.content, null, 2)
      : 'no data';

    inspectorEl.appendChild(
      el('div', {}, [
        el('div', { className: 'scene-kicker' }, [`${node.kind.toUpperCase()} · ${node.planeId}`]),
        el('h3', { style: { marginTop: '6px', fontSize: '16px' } }, [node.label]),
        el('p', { style: { marginTop: '8px', fontSize: '13px', color: 'var(--ink-secondary)' } }, [
          node.summary,
        ]),
        el('div', { className: 'scene-kicker', style: { marginTop: '16px' } }, [
          `ARTIFACT / PAYLOAD PREVIEW (${preview?.type || 'NONE'})`,
        ]),
        el('pre', { className: 'inspector-pre' }, [formattedPreview]),
      ])
    );
  } else {
    const edge = state.spec.edges?.find((e: any) => e.id === sel.id);
    if (!edge) return;
    const sample = edge.payloadSample
      ? JSON.stringify(edge.payloadSample, null, 2)
      : 'no data';

    inspectorEl.appendChild(
      el('div', {}, [
        el('div', { className: 'scene-kicker' }, [
          `EDGE · ${edge.protocol || 'FLOW'} · ${edge.motionPrimitive.toUpperCase()}`,
        ]),
        el('h3', { style: { marginTop: '6px', fontSize: '15px' } }, [
          `${edge.source} → ${edge.target}`,
        ]),
        el('pre', { className: 'inspector-pre' }, [sample]),
      ])
    );
  }
}
