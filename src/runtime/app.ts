// Chunk 10: src/runtime/app.ts (<= 85 lines)
import { createStore } from './store';
import { renderPlanes, applyCameraTransform } from './renderer-grid';
import { renderNodes } from './renderer-nodes';
import { renderEdges } from './renderer-edges';
import { startPacketAnimator } from './renderer-packets';
import { renderNarrativeHud } from './ui-narrative';
import { renderInspector } from './ui-inspector';
import { attachWhiteboard } from './whiteboard';
import { start3DRenderer } from './renderer-3d';
import { renderPins, attachDirectHtmlInteractions } from './direct-edit';

export function bootLivingArchitectureCanvas(): void {
  const specEl = document.getElementById('architecture-spec');
  const layoutEl = document.getElementById('computed-layout');
  if (!specEl || !layoutEl) return;

  const store = createStore(JSON.parse(specEl.textContent || '{}'), JSON.parse(layoutEl.textContent || '{}'));
  const worldEl = document.getElementById('world') as HTMLElement;
  const planesEl = document.getElementById('planes-layer') as HTMLElement;
  const nodesEl = document.getElementById('nodes-layer') as HTMLElement;
  const pinsEl = document.getElementById('pins-layer') as HTMLElement;
  const edgesSvg = document.getElementById('edges-svg') as unknown as SVGSVGElement;
  const wbSvg = document.getElementById('whiteboard-svg') as unknown as SVGSVGElement;
  const webglCanvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
  const hudEl = document.getElementById('hud-bar') as HTMLElement;
  const inspectorEl = document.getElementById('inspector') as HTMLElement;
  const viewportEl = document.getElementById('viewport') as HTMLElement;

  const recordOp = (op: any) => {
    const s = store.getState();
    const nextOps = [...s.sketchOps, op];
    store.setState({ sketchOps: nextOps });
    window.parent?.postMessage({ type: 'LIVING_ARCH_OP_QUEUED', op, operations: nextOps, spec: s.spec }, '*');
  };

  const syncUI = () => {
    const s = store.getState();
    const is3d = s.viewMode === '3d-webgl';
    worldEl.style.display = is3d ? 'none' : 'block';
    if (webglCanvas) webglCanvas.style.display = is3d ? 'block' : 'none';
    wbSvg.setAttribute('width', String(s.layout.width));
    wbSvg.setAttribute('height', String(s.layout.height));
    wbSvg.classList.toggle('active', s.whiteboardMode);
    viewportEl.classList.toggle('whiteboard-active', s.whiteboardMode || s.pinMode);
    applyCameraTransform(worldEl, s);
    renderPlanes(planesEl, s);
    renderEdges(edgesSvg, s, (edgeId) => store.setState({ selectedItem: { type: 'edge', id: edgeId } }));
    renderNodes(nodesEl, s, (nodeId) => store.setState({ selectedItem: { type: 'node', id: nodeId } }), recordOp);
    if (pinsEl) renderPins(pinsEl, s);
    renderNarrativeHud(hudEl, s, (idx) => store.setState({ sceneIndex: idx, viewMode: s.spec.scenes?.[idx]?.camera?.viewMode || s.viewMode }), () => store.setState({ playing: !s.playing }));
    renderInspector(inspectorEl, s, () => store.setState({ selectedItem: null }), recordOp);
    document.getElementById('btn-view-2d')?.classList.toggle('active', s.viewMode === '2d-flow');
    document.getElementById('btn-toggle-25d')?.classList.toggle('active', s.viewMode === '2.5d-layered');
    document.getElementById('btn-view-3d')?.classList.toggle('active', s.viewMode === '3d-webgl');
    document.getElementById('btn-toggle-wb')?.classList.toggle('active', s.whiteboardMode);
    document.getElementById('btn-pin-note')?.classList.toggle('active', s.pinMode);
    const btnDiff = document.getElementById('btn-export-diff');
    if (btnDiff) btnDiff.textContent = `Copy Diff (${s.sketchOps.length})`;
  };

  store.subscribe(syncUI);
  attachWhiteboard(wbSvg, store.getState, recordOp);
  attachDirectHtmlInteractions(viewportEl, nodesEl, store.getState, store.setState, recordOp);
  if (webglCanvas) start3DRenderer(webglCanvas, store.getState, store.setState);

  document.getElementById('btn-view-2d')?.addEventListener('click', () => store.setState({ viewMode: '2d-flow' }));
  document.getElementById('btn-toggle-25d')?.addEventListener('click', () => store.setState({ viewMode: store.getState().viewMode === '2.5d-layered' ? '2d-flow' : '2.5d-layered' }));
  document.getElementById('btn-view-3d')?.addEventListener('click', () => store.setState({ viewMode: '3d-webgl' }));
  document.getElementById('btn-toggle-wb')?.addEventListener('click', () => store.setState({ whiteboardMode: !store.getState().whiteboardMode, pinMode: false }));
  document.getElementById('btn-pin-note')?.addEventListener('click', () => store.setState({ pinMode: !store.getState().pinMode, whiteboardMode: false }));
  document.getElementById('btn-export-diff')?.addEventListener('click', () => {
    const payload = JSON.stringify({ timestamp: new Date().toISOString(), operations: store.getState().sketchOps }, null, 2);
    navigator.clipboard?.writeText(payload);
    inspectorEl.classList.add('open');
    inspectorEl.innerHTML = `<div class="scene-kicker">WHITEBOARD & HTML DIFF EXPORT</div><pre class="inspector-pre">${payload}</pre>`;
  });
  document.getElementById('btn-refactor-agent')?.addEventListener('click', () => {
    const s = store.getState();
    window.parent?.postMessage({ type: 'LIVING_ARCH_REFACTOR_REQUEST', spec: s.spec, operations: s.sketchOps }, '*');
  });
  syncUI();
  startPacketAnimator(edgesSvg, store.getState);
}
