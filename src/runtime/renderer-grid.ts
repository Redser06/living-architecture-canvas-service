// Chunk 3: src/runtime/renderer-grid.ts (<= 70 lines)
import { el, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderPlanes(container: HTMLElement, state: CanvasRuntimeState): void {
  clearChildren(container);
  const planes = state.layout?.planes || [];
  const is25d = state.viewMode === '2.5d-layered';

  for (const plane of planes) {
    const zOffset = is25d ? (plane.elevation || 0) * 0.45 : 0;
    const band = el(
      'div',
      {
        className: 'plane-band',
        'data-plane-id': plane.id,
        style: {
          top: `${plane.y}px`,
          height: `${plane.height}px`,
          transform: is25d ? `translateZ(${zOffset}px)` : 'none',
        },
      },
      [
        el('div', { className: 'plane-label' }, [
          `${plane.label} ${is25d ? `· ELEV +${plane.elevation}` : ''}`,
        ]),
      ]
    );
    container.appendChild(band);
  }
}

export function applyCameraTransform(worldEl: HTMLElement, state: CanvasRuntimeState): void {
  worldEl.style.width = `${state.layout.width}px`;
  worldEl.style.height = `${state.layout.height}px`;
  if (state.viewMode === '2.5d-layered') {
    worldEl.classList.add('layered-25d');
    worldEl.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom}) rotateX(24deg) rotateZ(-7deg)`;
  } else {
    worldEl.classList.remove('layered-25d');
    worldEl.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;
  }
}
