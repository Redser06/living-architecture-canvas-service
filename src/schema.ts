export type ViewMode = '2d-flow' | '2.5d-layered' | '3d-webgl';
export type NodeKind = 'platform' | 'service' | 'agent' | 'database' | 'document' | 'actor' | 'queue';
export type EdgeProtocol = 'REST' | 'gRPC' | 'Webhook' | 'Event' | 'Document-Link' | 'SQL';
export type MotionPrimitive = 'flow' | 'pulse' | 'fork' | 'join' | 'error';

export interface ArchitecturePlane {
  id: string;
  label: string;
  elevation: number; // Z-index / Y-height in 2.5D orthographic & 3D WebGL space
}

export interface ArtifactPreview {
  type: 'json' | 'markdown' | 'document-schema' | 'table';
  content: string | Record<string, any>;
}

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: NodeKind;
  planeId: string;
  parentGroupId?: string;
  summary: string;
  positionOverride?: { x: number; y: number };
  annotations?: string[];
  metadata: {
    techStack?: string[];
    protocol?: string;
    sla?: string;
    accessPoint?: string;
    artifactPreview?: ArtifactPreview;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: EdgeProtocol;
  motionPrimitive: MotionPrimitive;
  payloadSample?: Record<string, any>;
}

export interface SceneActiveEdge {
  edgeId: string;
  stepOrder: number;
  motionOverride?: MotionPrimitive;
}

export interface ArchitectureScene {
  id: string;
  title: string;
  narrative: string;
  activeNodes: string[];
  activeEdges: SceneActiveEdge[];
  camera: {
    viewMode: ViewMode;
    focusNodeIds?: string[];
  };
}

export interface CanvasPinNote {
  id: string;
  x: number;
  y: number;
  planeId?: string;
  nearNodeId?: string;
  text: string;
  author?: string;
}

export interface LivingArchitectureSpec {
  meta: {
    title: string;
    subtitle?: string;
    version: string;
    defaultView: ViewMode;
  };
  planes: ArchitecturePlane[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  scenes: ArchitectureScene[];
  annotations?: CanvasPinNote[];
}

export type WhiteboardAction =
  | {
      action: 'ADD_NODE';
      id?: string;
      label: string;
      kind?: NodeKind;
      planeId: string;
      nearNodeId?: string;
      summary?: string;
      protocol?: string;
    }
  | {
      action: 'ADD_EDGE';
      id?: string;
      from: string;
      to: string;
      label?: string;
      protocol?: EdgeProtocol;
      motionPrimitive?: MotionPrimitive;
    }
  | {
      action: 'REMOVE_NODE';
      nodeId: string;
    }
  | {
      action: 'REMOVE_EDGE';
      edgeId: string;
    }
  | {
      action: 'ANNOTATE_NODE';
      nodeId: string;
      note: string;
    }
  | {
      action: 'UPDATE_NODE';
      nodeId: string;
      label?: string;
      summary?: string;
      protocol?: string;
      kind?: NodeKind;
    }
  | {
      action: 'MOVE_NODE';
      nodeId: string;
      x: number;
      y: number;
      planeId?: string;
    }
  | {
      action: 'ADD_PIN_NOTE';
      id?: string;
      x: number;
      y: number;
      planeId?: string;
      nearNodeId?: string;
      text: string;
    };

export interface WhiteboardDiffPayload {
  timestamp: string;
  sceneId?: string;
  instruction?: string;
  operations: WhiteboardAction[];
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  unresolvedReferences: string[];
}

export function validateArchitectureSpec(spec: LivingArchitectureSpec): ValidationResult {
  const issues: ValidationIssue[] = [];
  const unresolvedReferences: string[] = [];

  if (!spec || typeof spec !== 'object') {
    return {
      valid: false,
      issues: [{ path: 'root', message: 'Spec must be an object', severity: 'error' }],
      unresolvedReferences: ['root'],
    };
  }

  if (!spec.meta?.title?.trim()) {
    issues.push({ path: 'meta.title', message: 'Meta title is required', severity: 'error' });
  }

  if (!Array.isArray(spec.planes) || spec.planes.length === 0) {
    issues.push({ path: 'planes', message: 'At least one plane is required', severity: 'error' });
  }

  if (!Array.isArray(spec.nodes) || spec.nodes.length === 0) {
    issues.push({ path: 'nodes', message: 'At least one node is required', severity: 'error' });
  }

  const planeIds = new Set((spec.planes || []).map((p) => p.id));
  const nodeIds = new Set<string>();

  for (const node of spec.nodes || []) {
    if (nodeIds.has(node.id)) {
      issues.push({
        path: `nodes.${node.id}`,
        message: `Duplicate node ID "${node.id}"`,
        severity: 'error',
      });
    }
    nodeIds.add(node.id);

    if (!planeIds.has(node.planeId)) {
      const ref = `node:${node.id}->plane:${node.planeId}`;
      unresolvedReferences.push(ref);
      issues.push({
        path: `nodes.${node.id}.planeId`,
        message: `Node "${node.id}" references unknown planeId "${node.planeId}"`,
        severity: 'error',
      });
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of spec.edges || []) {
    if (edgeIds.has(edge.id)) {
      issues.push({
        path: `edges.${edge.id}`,
        message: `Duplicate edge ID "${edge.id}"`,
        severity: 'error',
      });
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.source)) {
      const ref = `edge:${edge.id}.source->node:${edge.source}`;
      unresolvedReferences.push(ref);
      issues.push({
        path: `edges.${edge.id}.source`,
        message: `Edge "${edge.id}" references missing source node "${edge.source}"`,
        severity: 'error',
      });
    }
    if (!nodeIds.has(edge.target)) {
      const ref = `edge:${edge.id}.target->node:${edge.target}`;
      unresolvedReferences.push(ref);
      issues.push({
        path: `edges.${edge.id}.target`,
        message: `Edge "${edge.id}" references missing target node "${edge.target}"`,
        severity: 'error',
      });
    }
  }

  if (!Array.isArray(spec.scenes) || spec.scenes.length === 0) {
    issues.push({ path: 'scenes', message: 'At least one narrative scene is required', severity: 'error' });
  } else {
    for (const scene of spec.scenes) {
      for (const activeNodeId of scene.activeNodes || []) {
        if (!nodeIds.has(activeNodeId)) {
          const ref = `scene:${scene.id}.activeNodes->node:${activeNodeId}`;
          unresolvedReferences.push(ref);
          issues.push({
            path: `scenes.${scene.id}.activeNodes`,
            message: `Scene "${scene.id}" references unknown node "${activeNodeId}"`,
            severity: 'error',
          });
        }
      }
      for (const activeEdge of scene.activeEdges || []) {
        if (!edgeIds.has(activeEdge.edgeId)) {
          const ref = `scene:${scene.id}.activeEdges->edge:${activeEdge.edgeId}`;
          unresolvedReferences.push(ref);
          issues.push({
            path: `scenes.${scene.id}.activeEdges`,
            message: `Scene "${scene.id}" references unknown edge "${activeEdge.edgeId}"`,
            severity: 'error',
          });
        }
      }
    }
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    unresolvedReferences,
  };
}
