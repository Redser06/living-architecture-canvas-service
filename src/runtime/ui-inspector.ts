// Chunk 8: src/runtime/ui-inspector.ts (<= 88 lines)
import { el, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderInspector(
  inspectorEl: HTMLElement,
  state: CanvasRuntimeState,
  onClose: () => void,
  onDirectOp?: (op: any) => void
): void {
  clearChildren(inspectorEl);
  const sel = state.selectedItem;
  if (!sel) {
    inspectorEl.classList.remove('open');
    return;
  }
  inspectorEl.classList.add('open');

  inspectorEl.appendChild(
    el('button', { className: 'btn', style: { float: 'right' }, onClick: onClose }, ['✕ Close'])
  );

  if (sel.type === 'node') {
    const node = state.spec.nodes?.find((n: any) => n.id === sel.id);
    if (!node) return;
    const preview = node.metadata?.artifactPreview;
    const formattedPreview = preview
      ? typeof preview.content === 'string'
        ? preview.content
        : JSON.stringify(preview.content, null, 2)
      : 'no data';

    const noteInput = el('input', {
      className: 'inspector-input',
      placeholder: 'Annotate or request change on this node...',
      type: 'text',
    }) as HTMLInputElement;

    const addNoteBtn = el(
      'button',
      {
        className: 'btn btn-accent',
        style: { marginTop: '6px', width: '100%' },
        onClick: () => {
          const val = noteInput.value.trim();
          if (!val) return;
          node.summary = `${node.summary} — [Note: ${val}]`;
          onDirectOp?.({ action: 'ANNOTATE_NODE', nodeId: node.id, note: val });
          noteInput.value = '';
        },
      },
      ['+ Queue Annotation for Agent Refactor']
    );

    inspectorEl.appendChild(
      el('div', {}, [
        el('div', { className: 'scene-kicker' }, [`${node.kind.toUpperCase()} · ${node.planeId}`]),
        el('h3', { style: { marginTop: '6px', fontSize: '16px' } }, [node.label]),
        el('p', { style: { marginTop: '8px', fontSize: '13px', color: 'var(--ink-secondary)' } }, [
          node.summary,
        ]),
        el('div', { className: 'scene-kicker', style: { marginTop: '14px' } }, ['DIRECT HTML ANNOTATION']),
        noteInput,
        addNoteBtn,
        el('div', { className: 'scene-kicker', style: { marginTop: '16px' } }, [
          `ARTIFACT / PAYLOAD PREVIEW (${preview?.type || 'NONE'})`,
        ]),
        el('pre', { className: 'inspector-pre' }, [formattedPreview]),
      ])
    );
  } else {
    const edge = state.spec.edges?.find((e: any) => e.id === sel.id);
    if (!edge) return;
    const sample = edge.payloadSample ? JSON.stringify(edge.payloadSample, null, 2) : 'no data';
    inspectorEl.appendChild(
      el('div', {}, [
        el('div', { className: 'scene-kicker' }, [
          `EDGE · ${edge.protocol || 'FLOW'} · ${edge.motionPrimitive.toUpperCase()}`,
        ]),
        el('h3', { style: { marginTop: '6px', fontSize: '15px' } }, [`${edge.source} → ${edge.target}`]),
        el('pre', { className: 'inspector-pre' }, [sample]),
      ])
    );
  }
}
