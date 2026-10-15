// Chunk 10: src/runtime/app.ts (<= 85 lines)
import { createStore } from './store';
import { renderPlanes, applyCameraTransform } from './renderer-grid';
import { renderNodes } from './renderer-nodes';
import { renderEdges } from './renderer-edges';
import { startPacketAnimator } from './renderer-packets';
import { renderNarrativeHud } from './ui-narrative';
import { renderInspector } from './ui-inspector';
import { attachWhiteboard } from './whiteboard';

export function bootLivingArchitectureCanvas(): void {
  const specEl = document.getElementById('architecture-spec');
  const layoutEl = document.getElementById('computed-layout');
  if (!specEl || !layoutEl) return;

  const spec = JSON.parse(specEl.textContent || '{}');
  const layout = JSON.parse(layoutEl.textContent || '{}');
  const store = createStore(spec, layout);

  const worldEl = document.getElementById('world') as HTMLElement;
  const planesEl = document.getElementById('planes-layer') as HTMLElement;
  const nodesEl = document.getElementById('nodes-layer') as HTMLElement;
  const edgesSvg = document.getElementById('edges-svg') as unknown as SVGSVGElement;
  const wbSvg = document.getElementById('whiteboard-svg') as unknown as SVGSVGElement;
  const hudEl = document.getElementById('hud-bar') as HTMLElement;
  const inspectorEl = document.getElementById('inspector') as HTMLElement;
  const viewportEl = document.getElementById('viewport') as HTMLElement;

  const syncUI = () => {
    const s = store.getState();
    wbSvg.setAttribute('width', String(s.layout.width));
    wbSvg.setAttribute('height', String(s.layout.height));
    wbSvg.classList.toggle('active', s.whiteboardMode);
    viewportEl.classList.toggle('whiteboard-active', s.whiteboardMode);

    applyCameraTransform(worldEl, s);
    renderPlanes(planesEl, s);
    renderEdges(edgesSvg, s, (edgeId) => store.setState({ selectedItem: { type: 'edge', id: edgeId } }));
    renderNodes(nodesEl, s, (nodeId) => store.setState({ selectedItem: { type: 'node', id: nodeId } }));
    renderNarrativeHud(
      hudEl,
      s,
      (sceneIndex) => {
        const nextScene = s.spec.scenes?.[sceneIndex];
        store.setState({
          sceneIndex,
          viewMode: nextScene?.camera?.viewMode || s.viewMode,
        });
      },
      () => store.setState({ playing: !s.playing })
    );
    renderInspector(inspectorEl, s, () => store.setState({ selectedItem: null }));

    const btn25d = document.getElementById('btn-toggle-25d');
    if (btn25d) btn25d.classList.toggle('active', s.viewMode === '2.5d-layered');
    const btnWb = document.getElementById('btn-toggle-wb');
    if (btnWb) btnWb.classList.toggle('active', s.whiteboardMode);
    const btnDiff = document.getElementById('btn-export-diff');
    if (btnDiff) btnDiff.textContent = `Copy Diff (${s.sketchOps.length})`;
  };

  store.subscribe(syncUI);
  attachWhiteboard(wbSvg, store.getState, (op) => {
    const s = store.getState();
    store.setState({ sketchOps: [...s.sketchOps, op] });
  });

  document.getElementById('btn-toggle-25d')?.addEventListener('click', () => {
    const s = store.getState();
    store.setState({ viewMode: s.viewMode === '2d-flow' ? '2.5d-layered' : '2d-flow' });
  });
  document.getElementById('btn-toggle-wb')?.addEventListener('click', () => {
    const s = store.getState();
    store.setState({ whiteboardMode: !s.whiteboardMode });
  });
  document.getElementById('btn-export-diff')?.addEventListener('click', () => {
    const s = store.getState();
    const payload = JSON.stringify({ timestamp: new Date().toISOString(), operations: s.sketchOps }, null, 2);
    navigator.clipboard?.writeText(payload);
    store.setState({ selectedItem: null });
    inspectorEl.classList.add('open');
    inspectorEl.innerHTML = `<div class="scene-kicker">WHITEBOARD DIFF EXPORT</div><pre class="inspector-pre">${payload}</pre>`;
  });

  syncUI();
  startPacketAnimator(edgesSvg, store.getState);
}
