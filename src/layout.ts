import type { LivingArchitectureSpec, ArchitectureNode, ArchitectureEdge } from './schema';

export interface ComputedNodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  column: number;
  planeIndex: number;
  elevation: number;
}

export interface ComputedEdgeRoute {
  id: string;
  source: string;
  target: string;
  pathD: string;
  labelX: number;
  labelY: number;
  isVerticalConduit: boolean;
}

export interface ComputedPlaneBand {
  id: string;
  label: string;
  elevation: number;
  y: number;
  height: number;
}

export interface ComputedGraphLayout {
  width: number;
  height: number;
  planes: ComputedPlaneBand[];
  nodes: Record<string, ComputedNodePosition>;
  edges: Record<string, ComputedEdgeRoute>;
  unresolvedNodes: string[];
  unresolvedEdges: string[];
}

const NODE_WIDTH = 228;
const NODE_HEIGHT = 82;
const COL_GAP = 104;
const ROW_GAP = 32;
const PLANE_PADDING_Y = 38;
const CANVAS_PAD_X = 72;
const CANVAS_PAD_Y = 56;

export function computeDeterministicLayout(spec: LivingArchitectureSpec): ComputedGraphLayout {
  const unresolvedNodes: string[] = [];
  const unresolvedEdges: string[] = [];

  const planesSorted = [...(spec.planes || [])].sort((a, b) => b.elevation - a.elevation);
  const planeIndexMap = new Map<string, number>();
  planesSorted.forEach((p, idx) => planeIndexMap.set(p.id, idx));

  const validNodes: ArchitectureNode[] = [];
  const nodeMap = new Map<string, ArchitectureNode>();
  for (const n of spec.nodes || []) {
    if (!planeIndexMap.has(n.planeId)) {
      unresolvedNodes.push(n.id);
      continue;
    }
    validNodes.push(n);
    nodeMap.set(n.id, n);
  }

  // Compute topological column depth (Sugiyama / longest path with cycle guard)
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  validNodes.forEach((n) => {
    incoming.set(n.id, []);
    outgoing.set(n.id, []);
  });

  const validEdges: ArchitectureEdge[] = [];
  for (const e of spec.edges || []) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) {
      unresolvedEdges.push(e.id);
      continue;
    }
    validEdges.push(e);
    outgoing.get(e.source)!.push(e.target);
    incoming.get(e.target)!.push(e.source);
  }

  const colMap = new Map<string, number>();
  const visiting = new Set<string>();

  function assignCol(nodeId: string): number {
    if (colMap.has(nodeId)) return colMap.get(nodeId)!;
    if (visiting.has(nodeId)) return 0; // cycle break
    visiting.add(nodeId);
    const preds = incoming.get(nodeId) || [];
    let col = 0;
    for (const p of preds) {
      col = Math.max(col, assignCol(p) + 1);
    }
    visiting.delete(nodeId);
    colMap.set(nodeId, col);
    return col;
  }

  validNodes.forEach((n) => assignCol(n.id));

  // Group nodes by (planeId, column) to prevent collisions within the same swimlane column
  const planeBands: ComputedPlaneBand[] = [];
  const computedNodes: Record<string, ComputedNodePosition> = {};

  let currentPlaneTop = CANVAS_PAD_Y;
  let maxColumn = 0;

  for (let pIdx = 0; pIdx < planesSorted.length; pIdx++) {
    const plane = planesSorted[pIdx];
    const nodesInPlane = validNodes.filter((n) => n.planeId === plane.id);

    const byCol = new Map<number, ArchitectureNode[]>();
    let maxSubRowsInCol = 1;

    for (const n of nodesInPlane) {
      const c = colMap.get(n.id) ?? 0;
      maxColumn = Math.max(maxColumn, c);
      if (!byCol.has(c)) byCol.set(c, []);
      byCol.get(c)!.push(n);
      maxSubRowsInCol = Math.max(maxSubRowsInCol, byCol.get(c)!.length);
    }

    const bandHeight =
      PLANE_PADDING_Y * 2 +
      maxSubRowsInCol * NODE_HEIGHT +
      Math.max(0, maxSubRowsInCol - 1) * ROW_GAP;

    planeBands.push({
      id: plane.id,
      label: plane.label,
      elevation: plane.elevation,
      y: currentPlaneTop,
      height: bandHeight,
    });

    for (const [col, colNodes] of byCol.entries()) {
      const totalColHeight =
        colNodes.length * NODE_HEIGHT + Math.max(0, colNodes.length - 1) * ROW_GAP;
      const startY = currentPlaneTop + (bandHeight - totalColHeight) / 2;

      colNodes.forEach((node, subIdx) => {
        const defaultX = CANVAS_PAD_X + col * (NODE_WIDTH + COL_GAP);
        const defaultY = startY + subIdx * (NODE_HEIGHT + ROW_GAP);
        const x = typeof node.positionOverride?.x === 'number' ? Math.round(node.positionOverride.x) : defaultX;
        const y = typeof node.positionOverride?.y === 'number' ? Math.round(node.positionOverride.y) : defaultY;
        computedNodes[node.id] = {
          id: node.id,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          column: col,
          planeIndex: pIdx,
          elevation: plane.elevation,
        };
      });
    }

    currentPlaneTop += bandHeight + 24;
  }

  const totalWidth = Math.max(
    1120,
    CANVAS_PAD_X * 2 + (maxColumn + 1) * NODE_WIDTH + maxColumn * COL_GAP + 60
  );
  const totalHeight = Math.max(680, currentPlaneTop + CANVAS_PAD_Y);

  // Route splines between nodes
  const computedEdges: Record<string, ComputedEdgeRoute> = {};

  for (const edge of validEdges) {
    const src = computedNodes[edge.source];
    const tgt = computedNodes[edge.target];
    if (!src || !tgt) {
      unresolvedEdges.push(edge.id);
      continue;
    }

    const isVerticalConduit = src.planeIndex !== tgt.planeIndex;
    let x1: number, y1: number, x2: number, y2: number, pathD: string;

    if (src.column < tgt.column) {
      // Left-to-right standard flow
      x1 = src.x + src.width;
      y1 = src.y + src.height / 2;
      x2 = tgt.x;
      y2 = tgt.y + tgt.height / 2;
      const dx = Math.max(48, (x2 - x1) * 0.52);
      pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    } else if (src.column === tgt.column && src.y !== tgt.y) {
      // Vertical inter-plane or intra-column flow
      const goingDown = tgt.y > src.y;
      x1 = src.x + src.width / 2;
      y1 = goingDown ? src.y + src.height : src.y;
      x2 = tgt.x + tgt.width / 2;
      y2 = goingDown ? tgt.y : tgt.y + tgt.height;
      const dy = (y2 - y1) * 0.45;
      pathD = `M ${x1} ${y1} C ${x1 + 18} ${y1 + dy}, ${x2 + 18} ${y2 - dy}, ${x2} ${y2}`;
    } else {
      // Feedback/return loop (right-to-left)
      x1 = src.x;
      y1 = src.y + src.height * 0.72;
      x2 = tgt.x + tgt.width;
      y2 = tgt.y + tgt.height * 0.72;
      const dx = Math.max(60, Math.abs(x1 - x2) * 0.45);
      const loopSag = Math.max(y1, y2) + 52;
      pathD = `M ${x1} ${y1} C ${x1 - dx * 0.4} ${loopSag}, ${x2 + dx * 0.4} ${loopSag}, ${x2} ${y2}`;
    }

    computedEdges[edge.id] = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      pathD,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2 - 10,
      isVerticalConduit,
    };
  }

  return {
    width: totalWidth,
    height: totalHeight,
    planes: planeBands,
    nodes: computedNodes,
    edges: computedEdges,
    unresolvedNodes,
    unresolvedEdges,
  };
}
