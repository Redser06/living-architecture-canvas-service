import type {
  LivingArchitectureSpec,
  WhiteboardDiffPayload,
  NodeKind,
  EdgeProtocol,
  MotionPrimitive,
} from './schema';

export interface DiffApplicationResult {
  spec: LivingArchitectureSpec;
  appliedCount: number;
  ignoredOperations: Array<{ index: number; reason: string }>;
}

export function slugifyId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'node-' + Math.random().toString(36).slice(2, 6)
  );
}

/**
 * Applies a structured WhiteboardDiffPayload, direct HTML page edits, or natural-language instruction
 * to an existing LivingArchitectureSpec.
 */
export function applyWhiteboardDiff(
  baseSpec: LivingArchitectureSpec,
  diff: WhiteboardDiffPayload
): DiffApplicationResult {
  const spec: LivingArchitectureSpec = JSON.parse(JSON.stringify(baseSpec));
  if (!Array.isArray(spec.annotations)) spec.annotations = [];
  const ignoredOperations: Array<{ index: number; reason: string }> = [];
  let appliedCount = 0;

  const planeIds = new Set(spec.planes.map((p) => p.id));
  const defaultPlaneId = spec.planes[Math.floor(spec.planes.length / 2)]?.id || spec.planes[0]?.id;

  const ops = [...(diff.operations || [])];

  // If the user provided a natural language instruction alongside or instead of raw ops, parse it
  if (diff.instruction && diff.instruction.trim()) {
    const parsedOps = parseNaturalLanguageEdit(spec, diff.instruction);
    ops.push(...parsedOps);
  }

  ops.forEach((op, index) => {
    if (op.action === 'ADD_NODE') {
      const id = op.id || `node-${slugifyId(op.label)}`;
      if (spec.nodes.some((n) => n.id === id)) {
        ignoredOperations.push({ index, reason: `Node "${id}" already exists` });
        return;
      }
      const targetPlane = planeIds.has(op.planeId) ? op.planeId : defaultPlaneId;
      if (!targetPlane) {
        ignoredOperations.push({ index, reason: 'No valid plane available for ADD_NODE' });
        return;
      }

      const inferredKind: NodeKind = op.kind || inferNodeKind(op.label);
      spec.nodes.push({
        id,
        label: op.label,
        kind: inferredKind,
        planeId: targetPlane,
        summary: op.summary || `Added via live ideation: ${op.label}`,
        metadata: {
          protocol: op.protocol || inferDefaultProtocol(inferredKind),
          techStack: [inferredKind.toUpperCase()],
          artifactPreview: {
            type: 'json',
            content: {
              component: op.label,
              status: 'active',
              addedAt: diff.timestamp || new Date().toISOString(),
            },
          },
        },
      });

      const targetScene =
        spec.scenes.find((s) => s.id === diff.sceneId) || spec.scenes[spec.scenes.length - 1];
      if (targetScene && !targetScene.activeNodes.includes(id)) {
        targetScene.activeNodes.push(id);
      }

      appliedCount++;
    } else if (op.action === 'ADD_EDGE') {
      const srcExists = spec.nodes.some((n) => n.id === op.from);
      const tgtExists = spec.nodes.some((n) => n.id === op.to);
      if (!srcExists || !tgtExists) {
        ignoredOperations.push({
          index,
          reason: `Cannot connect "${op.from}" -> "${op.to}": missing endpoint node`,
        });
        return;
      }

      const edgeId = op.id || `edge-${op.from}-to-${op.to}`;
      if (spec.edges.some((e) => e.id === edgeId)) {
        ignoredOperations.push({ index, reason: `Edge "${edgeId}" already exists` });
        return;
      }

      const motion: MotionPrimitive = op.motionPrimitive || 'pulse';
      const protocol: EdgeProtocol = op.protocol || 'Event';

      spec.edges.push({
        id: edgeId,
        source: op.from,
        target: op.to,
        label: op.label || `${protocol} Flow`,
        protocol,
        motionPrimitive: motion,
        payloadSample: {
          source: op.from,
          target: op.to,
          protocol,
          timestamp: new Date().toISOString(),
        },
      });

      const targetScene =
        spec.scenes.find((s) => s.id === diff.sceneId) || spec.scenes[spec.scenes.length - 1];
      if (targetScene) {
        if (!targetScene.activeNodes.includes(op.from)) targetScene.activeNodes.push(op.from);
        if (!targetScene.activeNodes.includes(op.to)) targetScene.activeNodes.push(op.to);
        const maxOrder = targetScene.activeEdges.reduce((m, e) => Math.max(m, e.stepOrder), 0);
        targetScene.activeEdges.push({
          edgeId,
          stepOrder: maxOrder + 1,
        });
      }

      appliedCount++;
    } else if (op.action === 'REMOVE_NODE') {
      const beforeCount = spec.nodes.length;
      spec.nodes = spec.nodes.filter((n) => n.id !== op.nodeId);
      if (spec.nodes.length === beforeCount) {
        ignoredOperations.push({ index, reason: `Node "${op.nodeId}" not found` });
        return;
      }
      const removedEdges = new Set(
        spec.edges.filter((e) => e.source === op.nodeId || e.target === op.nodeId).map((e) => e.id)
      );
      spec.edges = spec.edges.filter((e) => !removedEdges.has(e.id));
      spec.scenes.forEach((s) => {
        s.activeNodes = s.activeNodes.filter((id) => id !== op.nodeId);
        s.activeEdges = s.activeEdges.filter((ae) => !removedEdges.has(ae.edgeId));
      });
      appliedCount++;
    } else if (op.action === 'REMOVE_EDGE') {
      const beforeCount = spec.edges.length;
      spec.edges = spec.edges.filter((e) => e.id !== op.edgeId);
      if (spec.edges.length === beforeCount) {
        ignoredOperations.push({ index, reason: `Edge "${op.edgeId}" not found` });
        return;
      }
      spec.scenes.forEach((s) => {
        s.activeEdges = s.activeEdges.filter((ae) => ae.edgeId !== op.edgeId);
      });
      appliedCount++;
    } else if (op.action === 'ANNOTATE_NODE') {
      const node = spec.nodes.find((n) => n.id === op.nodeId);
      if (!node) {
        ignoredOperations.push({ index, reason: `Node "${op.nodeId}" not found for annotation` });
        return;
      }
      node.summary = `${node.summary} — [Note: ${op.note}]`;
      if (!Array.isArray(node.annotations)) node.annotations = [];
      node.annotations.push(op.note);
      // If annotation describes adding/connecting a component, synthesize it into the graph as well
      const derivedOps = parseNaturalLanguageEdit(spec, op.note, node.id);
      if (derivedOps.length > 0) {
        const subResult = applyWhiteboardDiff(spec, {
          timestamp: diff.timestamp,
          sceneId: diff.sceneId,
          operations: derivedOps,
        });
        spec.nodes = subResult.spec.nodes;
        spec.edges = subResult.spec.edges;
        spec.scenes = subResult.spec.scenes;
      }
      appliedCount++;
    } else if (op.action === 'UPDATE_NODE') {
      const node = spec.nodes.find((n) => n.id === op.nodeId);
      if (!node) {
        ignoredOperations.push({ index, reason: `Node "${op.nodeId}" not found for UPDATE_NODE` });
        return;
      }
      if (typeof op.label === 'string' && op.label.trim()) node.label = op.label.trim();
      if (typeof op.summary === 'string' && op.summary.trim()) node.summary = op.summary.trim();
      if (op.kind) node.kind = op.kind;
      if (typeof op.protocol === 'string' && op.protocol.trim()) {
        node.metadata = { ...(node.metadata || {}), protocol: op.protocol.trim() };
      }
      appliedCount++;
    } else if (op.action === 'MOVE_NODE') {
      const node = spec.nodes.find((n) => n.id === op.nodeId);
      if (!node) {
        ignoredOperations.push({ index, reason: `Node "${op.nodeId}" not found for MOVE_NODE` });
        return;
      }
      node.positionOverride = { x: Math.round(op.x), y: Math.round(op.y) };
      if (op.planeId && planeIds.has(op.planeId)) {
        node.planeId = op.planeId;
      }
      appliedCount++;
    } else if (op.action === 'ADD_PIN_NOTE') {
      const pinId = op.id || `pin-${slugifyId(op.text).slice(0, 16)}-${spec.annotations!.length + 1}`;
      spec.annotations!.push({
        id: pinId,
        x: Math.round(op.x),
        y: Math.round(op.y),
        planeId: op.planeId || defaultPlaneId,
        nearNodeId: op.nearNodeId,
        text: op.text,
      });
      // Also parse the pin note for actionable architectural instructions (e.g. "Add OAuth2 gateway here")
      const derivedOps = parseNaturalLanguageEdit(spec, op.text, op.nearNodeId);
      if (derivedOps.length > 0) {
        const subRes = applyWhiteboardDiff(spec, {
          timestamp: diff.timestamp,
          sceneId: diff.sceneId,
          operations: derivedOps,
        });
        spec.nodes = subRes.spec.nodes;
        spec.edges = subRes.spec.edges;
        spec.scenes = subRes.spec.scenes;
      }
      appliedCount++;
    }
  });

  return { spec, appliedCount, ignoredOperations };
}

export function inferNodeKind(label: string): NodeKind {
  const lower = label.toLowerCase();
  if (lower.includes('queue') || lower.includes('kafka') || lower.includes('sqs') || lower.includes('bus') || lower.includes('dlq'))
    return 'queue';
  if (
    lower.includes('db') ||
    lower.includes('database') ||
    lower.includes('postgres') ||
    lower.includes('firestore') ||
    lower.includes('redis') ||
    lower.includes('bucket') ||
    lower.includes('store') ||
    lower.includes('ledger') ||
    lower.includes('vault') ||
    lower.includes('cache')
  )
    return 'database';
  if (lower.includes('pdf') || lower.includes('doc') || lower.includes('schema') || lower.includes('brief') || lower.includes('report'))
    return 'document';
  if (lower.includes('agent') || lower.includes('llm') || lower.includes('solver') || lower.includes('ai') || lower.includes('model'))
    return 'agent';
  if (lower.includes('user') || lower.includes('exec') || lower.includes('client') || lower.includes('actor') || lower.includes('portal') || lower.includes('pos'))
    return 'actor';
  if (lower.includes('stripe') || lower.includes('erp') || lower.includes('platform') || lower.includes('cdn') || lower.includes('gateway') || lower.includes('iso'))
    return 'platform';
  return 'service';
}

export function inferDefaultProtocol(kind: NodeKind): string {
  switch (kind) {
    case 'queue':
      return 'EVENT';
    case 'database':
      return 'SQL';
    case 'document':
      return 'PDF/JSON';
    case 'agent':
      return 'gRPC';
    case 'actor':
      return 'HTTPS';
    default:
      return 'REST';
  }
}

/**
 * Lightweight natural-language parser for live ideation commands and in-page annotations
 */
export function parseNaturalLanguageEdit(
  spec: LivingArchitectureSpec,
  instruction: string,
  anchorNodeId?: string
): WhiteboardDiffPayload['operations'] {
  const ops: WhiteboardDiffPayload['operations'] = [];
  const lower = instruction.toLowerCase();

  const betweenMatch = instruction.match(
    /add\s+(?:an?\s+)?([a-zA-Z0-9\s\-_]+?)\s+between\s+([a-zA-Z0-9\s\-_]+?)\s+and\s+([a-zA-Z0-9\s\-_]+?)(?:[,.]|$|\s+and\s+)/i
  );

  const findNodeByFuzzy = (term: string) => {
    const clean = term.trim().toLowerCase().replace(/^the\s+/, '');
    return spec.nodes.find(
      (n) =>
        n.id.toLowerCase() === clean ||
        n.label.toLowerCase().includes(clean) ||
        clean.includes(n.id.toLowerCase())
    );
  };

  if (betweenMatch) {
    const rawLabel = betweenMatch[1].trim();
    const nodeA = findNodeByFuzzy(betweenMatch[2]);
    const nodeB = findNodeByFuzzy(betweenMatch[3]);
    const newId = `node-${slugifyId(rawLabel)}`;
    const kind = inferNodeKind(rawLabel);
    const planeId = nodeA?.planeId || spec.planes[1]?.id || spec.planes[0].id;

    ops.push({
      action: 'ADD_NODE',
      id: newId,
      label: rawLabel.replace(/\b\w/g, (c) => c.toUpperCase()),
      kind,
      planeId,
      summary: `Intermediary ${rawLabel} inserted via Live Ideation.`,
    });

    if (nodeA) {
      ops.push({
        action: 'ADD_EDGE',
        from: nodeA.id,
        to: newId,
        label: 'Enqueue',
        protocol: kind === 'queue' ? 'Event' : 'REST',
        motionPrimitive: 'pulse',
      });
    }
    if (nodeB) {
      ops.push({
        action: 'ADD_EDGE',
        from: newId,
        to: nodeB.id,
        label: 'Dispatch',
        protocol: kind === 'queue' ? 'Event' : 'gRPC',
        motionPrimitive: 'flow',
      });
    }
  }

  const linkMatch = instruction.match(
    /(?:link|connect|route)\s+(?:the\s+)?([a-zA-Z0-9\s\-_]+?)\s+to\s+(?:the\s+)?([a-zA-Z0-9\s\-_]+?)(?:[,.]|$)/i
  );
  if (linkMatch) {
    const srcText = linkMatch[1].trim();
    const tgtText = linkMatch[2].trim();
    let srcNode = findNodeByFuzzy(srcText);
    let tgtNode = findNodeByFuzzy(tgtText);

    if (!srcNode) {
      const id = `node-${slugifyId(srcText)}`;
      ops.push({
        action: 'ADD_NODE',
        id,
        label: srcText.replace(/\b\w/g, (c) => c.toUpperCase()),
        planeId: spec.planes[0]?.id || 'plane-experience',
      });
      srcNode = { id } as any;
    }
    if (!tgtNode) {
      const id = `node-${slugifyId(tgtText)}`;
      ops.push({
        action: 'ADD_NODE',
        id,
        label: tgtText.replace(/\b\w/g, (c) => c.toUpperCase()),
        planeId: spec.planes[spec.planes.length - 1]?.id || 'plane-data',
      });
      tgtNode = { id } as any;
    }

    ops.push({
      action: 'ADD_EDGE',
      from: srcNode!.id,
      to: tgtNode!.id,
      label: 'Sync Link',
      protocol: 'Document-Link',
      motionPrimitive: 'pulse',
    });
  }

  // Remove node pattern: "remove/delete <NodeLabel>"
  const removeMatch = instruction.match(/^(?:remove|delete|drop)\s+(?:the\s+|node\s+)?([a-zA-Z0-9\s\-_]+?)$/i);
  if (ops.length === 0 && removeMatch) {
    const target = findNodeByFuzzy(removeMatch[1]);
    if (target) {
      ops.push({ action: 'REMOVE_NODE', nodeId: target.id });
    }
  }

  // Fallback if simple "add <NodeLabel>" without between/link
  if (ops.length === 0 && lower.startsWith('add ')) {
    const raw = instruction
      .replace(/^add\s+(?:an?\s+)?/i, '')
      .replace(/\s+here$/i, '')
      .trim();
    if (raw) {
      const id = `node-${slugifyId(raw)}`;
      const kind = inferNodeKind(raw);
      const planeId =
        kind === 'database'
          ? spec.planes[spec.planes.length - 1]?.id
          : kind === 'actor' || kind === 'document'
          ? spec.planes[0]?.id
          : spec.planes[1]?.id || spec.planes[0]?.id;

      ops.push({
        action: 'ADD_NODE',
        id,
        label: raw.replace(/\b\w/g, (c) => c.toUpperCase()),
        kind,
        planeId: planeId || 'plane-orchestration',
      });

      const anchor =
        (anchorNodeId && spec.nodes.find((n) => n.id === anchorNodeId)) ||
        spec.nodes[spec.nodes.length - 1];
      if (anchor && anchor.id !== id) {
        ops.push({
          action: 'ADD_EDGE',
          from: anchor.id,
          to: id,
          label: 'Trigger',
          protocol: 'Event',
          motionPrimitive: 'pulse',
        });
      }
    }
  }

  return ops;
}
