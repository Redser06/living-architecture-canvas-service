// Chunk 2: src/runtime/store.ts (<= 60 lines)
export interface CanvasRuntimeState {
  spec: any;
  layout: any;
  sceneIndex: number;
  viewMode: '2d-flow' | '2.5d-layered';
  selectedItem: { type: 'node' | 'edge'; id: string } | null;
  whiteboardMode: boolean;
  playing: boolean;
  panX: number;
  panY: number;
  zoom: number;
  sketchOps: any[];
}

export function createStore(spec: any, layout: any) {
  const initialScene = spec.scenes?.[0];
  const state: CanvasRuntimeState = {
    spec,
    layout,
    sceneIndex: 0,
    viewMode: initialScene?.camera?.viewMode || spec.meta?.defaultView || '2d-flow',
    selectedItem: null,
    whiteboardMode: false,
    playing: true,
    panX: 30,
    panY: 20,
    zoom: 0.92,
    sketchOps: [],
  };

  const listeners = new Set<(s: CanvasRuntimeState) => void>();

  return {
    getState: () => state,
    setState: (partial: Partial<CanvasRuntimeState>) => {
      Object.assign(state, partial);
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn: (s: CanvasRuntimeState) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
