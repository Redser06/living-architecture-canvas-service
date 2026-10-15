import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import {
  validateArchitectureSpec,
  type LivingArchitectureSpec,
  type WhiteboardDiffPayload,
  type NodeKind,
  type EdgeProtocol,
  type MotionPrimitive,
} from './schema';
import { applyWhiteboardDiff, inferNodeKind, inferDefaultProtocol, slugifyId } from './ideation';
import { computeDeterministicLayout } from './layout';
import { DEFAULT_STARTER_SPEC, PAYMENT_GATEWAY_BLUEPRINT, AGENTIC_INTEROP_BLUEPRINT } from './presets';

export type GeminiModelTier = 'gemini-3.8-flash' | 'gemini-4-argon';

export const BASELINE_MODEL: GeminiModelTier = 'gemini-3.8-flash';
export const HEAVY_LIFT_MODEL: GeminiModelTier = 'gemini-4-argon';

export interface GenerateArchitectureInput {
  prompt: string;
  images?: Array<{ mimeType: string; dataBase64: string; name?: string }>;
  baseSpec?: LivingArchitectureSpec;
  model?: GeminiModelTier;
  apiKey?: string;
}

export interface RefactorArchitectureInput {
  spec: LivingArchitectureSpec;
  diff?: WhiteboardDiffPayload;
  prompt?: string;
  images?: Array<{ mimeType: string; dataBase64: string; name?: string }>;
  model?: GeminiModelTier;
  apiKey?: string;
}

export function resolveGoogleApiKey(explicitKey?: string): string | null {
  if (explicitKey === 'offline') return null;
  if (explicitKey && explicitKey.trim()) return explicitKey.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();

  const envPaths = [
    join(process.cwd(), '.env'),
    join(homedir(), '.hermes', '.env'),
    join(homedir(), '.hermes', 'profiles', 'coder-prototyper', '.env'),
  ];
  for (const p of envPaths) {
    try {
      if (!existsSync(p)) continue;
      const content = readFileSync(p, 'utf8');
      const match = content.match(/^(?:GOOGLE_API_KEY|GEMINI_API_KEY)=(.+)$/m);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      // ignore
    }
  }
  return null;
}

const SYSTEM_INSTRUCTION = `You are the Living Architecture Canvas Compiler Agent.
Given a user prompt, optional architecture sketch/diagram image(s), or an existing LivingArchitectureSpec + in-page HTML annotations/diffs, output ONLY a valid JSON object conforming strictly to LivingArchitectureSpec:
{
  "meta": { "title": "string", "subtitle": "string", "version": "1.0", "defaultView": "2d-flow" },
  "planes": [
    { "id": "plane-experience", "label": "Layer 1: Access Points & Experience", "elevation": 140 },
    { "id": "plane-orchestration", "label": "Layer 2: Core Services, AI & Interop", "elevation": 70 },
    { "id": "plane-data", "label": "Layer 3: Data Platforms & Persistence", "elevation": 0 }
  ],
  "nodes": [
    {
      "id": "kebab-id",
      "label": "Human Readable Title",
      "kind": "actor" | "platform" | "service" | "agent" | "database" | "document" | "queue",
      "planeId": "plane-experience" | "plane-orchestration" | "plane-data",
      "summary": "Clear architectural role, access points, and SLA/interop detail.",
      "metadata": {
        "protocol": "REST" | "gRPC" | "EVENT" | "SQL" | "mTLS" | "PDF/JSON" | "GRAPHQL",
        "accessPoint": "optional endpoint or URI",
        "artifactPreview": { "type": "json" | "markdown", "content": { "sample": "value" } }
      }
    }
  ],
  "edges": [
    {
      "id": "e-src-tgt",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "Concise Action / Payload",
      "protocol": "REST" | "gRPC" | "Webhook" | "Event" | "Document-Link" | "SQL",
      "motionPrimitive": "flow" | "pulse" | "fork" | "join" | "error",
      "payloadSample": { "exampleField": "value" }
    }
  ],
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene 1 Title",
      "narrative": "Executive narrative explaining data flow and platform interoperability.",
      "activeNodes": ["node-id-1", "node-id-2"],
      "activeEdges": [{ "edgeId": "e-src-tgt", "stepOrder": 1 }],
      "camera": { "viewMode": "2d-flow" | "2.5d-layered" | "3d-webgl" }
    }
  ]
}
Rules:
1. Every node.planeId MUST match an id in planes.
2. Every edge.source and edge.target MUST match an id in nodes.
3. Every scene activeNodes and activeEdges.edgeId MUST match existing nodes and edges.
4. Create 3 scenes: Scene 1 in "2d-flow", Scene 2 in "2.5d-layered", Scene 3 in "3d-webgl".
5. Return raw JSON only (no markdown fences).`;

export async function callGeminiForSpec(
  userPrompt: string,
  images: Array<{ mimeType: string; dataBase64: string }> = [],
  preferredModel: GeminiModelTier = BASELINE_MODEL,
  apiKey?: string
): Promise<{ spec: LivingArchitectureSpec; modelUsed: GeminiModelTier } | null> {
  const key = resolveGoogleApiKey(apiKey);
  if (!key) return null;

  const parts: any[] = [{ text: userPrompt }];
  for (const img of images) {
    const cleanB64 = img.dataBase64.replace(/^data:[^;]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: img.mimeType || 'image/png',
        data: cleanB64,
      },
    });
  }

  // Strictly use Gemini 3.8 Flash (baseline) and Gemini 4 Argon (heavy lift). Never legacy 2.x models.
  const models: GeminiModelTier[] =
    preferredModel === HEAVY_LIFT_MODEL
      ? [HEAVY_LIFT_MODEL, BASELINE_MODEL]
      : [BASELINE_MODEL, HEAVY_LIFT_MODEL];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 22000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const cand = data?.candidates?.[0];
      const rawText = (cand?.content?.parts || [])
        .filter((p: any) => !p.thought)
        .map((p: any) => p.text || '')
        .join('');
      if (!rawText) continue;
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned) as LivingArchitectureSpec;
      const check = validateArchitectureSpec(parsed);
      if (check.valid) {
        return { spec: parsed, modelUsed: model };
      }
    } catch {
      // try next allowed model tier or fallback
    }
  }
  return null;
}

/**
 * Deterministic Architecture Synthesizer fallback when offline or in fast local tests.
 */
export function synthesizeDeterministicSpecFromPrompt(
  prompt: string,
  images?: Array<{ mimeType: string; dataBase64: string; name?: string }>
): LivingArchitectureSpec {
  const lower = prompt.toLowerCase();
  if (lower.includes('payment') || lower.includes('gpn') || lower.includes('merchant') || lower.includes('acquir') || lower.includes('stripe') || lower.includes('fraud')) {
    const clone = JSON.parse(JSON.stringify(PAYMENT_GATEWAY_BLUEPRINT)) as LivingArchitectureSpec;
    if (images && images.length > 0) {
      clone.meta.subtitle = `Synthesized from Prompt + ${images.length} Uploaded Diagram Image(s)`;
    }
    return clone;
  }
  if (lower.includes('copilot') || lower.includes('agent') || lower.includes('mcp') || lower.includes('hermes') || lower.includes('second brain')) {
    const clone = JSON.parse(JSON.stringify(AGENTIC_INTEROP_BLUEPRINT)) as LivingArchitectureSpec;
    if (images && images.length > 0) {
      clone.meta.subtitle = `Synthesized from Prompt + ${images.length} Uploaded Diagram Image(s)`;
    }
    return clone;
  }

  const titleMatch = prompt.match(/(?:for|of|called|titled)\s+["']?([A-Za-z0-9\s\-:&]+?)["']?(?:[,.]|with|that|showing|$)/i);
  const title = titleMatch?.[1]?.trim()
    ? titleMatch[1].trim().slice(0, 48)
    : prompt.trim().slice(0, 44) || 'Custom System Architecture';

  const planes = [
    { id: 'plane-experience', label: 'Layer 1: Client Access Points & Edge Portals', elevation: 140 },
    { id: 'plane-orchestration', label: 'Layer 2: API Gateway, AI Agents & Interop Bus', elevation: 70 },
    { id: 'plane-data', label: 'Layer 3: Data Stores, Vaults & External Platforms', elevation: 0 },
  ];

  const tokens = prompt
    .split(/[,;.\n]+|\b(?:and|with|to|from|between|into|via)\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 36 && !/^(build|create|design|show|make|system|architecture|diagram)$/i.test(s));

  const pickedLabels = tokens.slice(0, 6);
  while (pickedLabels.length < 6) {
    const defaults = [
      'Client Web & Mobile Portal',
      'Zero-Trust API Gateway',
      'Orchestrator & Policy Agent',
      'Kafka Event Interop Bus',
      'Primary Operational Ledger DB',
      'External Partner Webhook API',
    ];
    pickedLabels.push(defaults[pickedLabels.length]);
  }

  const nodes = pickedLabels.map((raw, idx) => {
    const label = raw.replace(/\b\w/g, (c) => c.toUpperCase());
    const id = `node-${idx + 1}-${slugifyId(label).slice(0, 18)}`;
    const kind: NodeKind = idx === 0 ? 'actor' : inferNodeKind(label);
    const planeId =
      idx < 2 ? 'plane-experience' : idx < 4 ? 'plane-orchestration' : 'plane-data';
    const protocol = inferDefaultProtocol(kind);
    return {
      id,
      label,
      kind,
      planeId,
      summary: `${label} (${protocol} access point & interoperability node synthesized from prompt${images?.length ? ' + image upload' : ''}).`,
      metadata: {
        protocol,
        accessPoint: `https://api.internal/${slugifyId(label)}`,
        techStack: [kind.toUpperCase(), protocol],
        artifactPreview: {
          type: 'json' as const,
          content: {
            nodeId: id,
            component: label,
            protocol,
            interoperability: 'bidirectional',
            imageGrounded: Boolean(images?.length),
          },
        },
      },
    };
  });

  const protocols: EdgeProtocol[] = ['REST', 'gRPC', 'Event', 'SQL', 'Webhook'];
  const motions: MotionPrimitive[] = ['flow', 'pulse', 'fork', 'join', 'flow'];
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge-${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      label: `${protocols[i % protocols.length]} Hop ${i + 1}`,
      protocol: protocols[i % protocols.length],
      motionPrimitive: motions[i % motions.length],
      payloadSample: {
        hop: i + 1,
        from: nodes[i].label,
        to: nodes[i + 1].label,
        protocol: protocols[i % protocols.length],
      },
    });
  }

  return {
    meta: {
      title,
      subtitle: images?.length
        ? `Multimodal Architecture (${images.length} image(s) + NL spec)`
        : 'Interactive Data Flow, Access Points & Platform Interoperability',
      version: '1.0',
      defaultView: '2d-flow',
    },
    planes,
    nodes,
    edges,
    scenes: [
      {
        id: 'scene-1',
        title: '1. Ingress Access Points & Edge Validation',
        narrative: `Requests enter via ${nodes[0].label} and traverse ${nodes[1].label} into ${nodes[2].label}.`,
        activeNodes: [nodes[0].id, nodes[1].id, nodes[2].id],
        activeEdges: [
          { edgeId: 'edge-1', stepOrder: 1 },
          { edgeId: 'edge-2', stepOrder: 2 },
        ],
        camera: { viewMode: '2d-flow' },
      },
      {
        id: 'scene-2',
        title: '2. Cross-Platform Orchestration & Event Fan-Out',
        narrative: `${nodes[2].label} coordinates with ${nodes[3].label} and persists state to ${nodes[4].label}.`,
        activeNodes: [nodes[2].id, nodes[3].id, nodes[4].id],
        activeEdges: [
          { edgeId: 'edge-3', stepOrder: 1 },
          { edgeId: 'edge-4', stepOrder: 2 },
        ],
        camera: { viewMode: '2.5d-layered' },
      },
      {
        id: 'scene-3',
        title: '3. End-to-End 3D Spatial Topology & Interoperability',
        narrative: `Full 3D WebGL inspection across all three architectural planes through ${nodes[5].label}.`,
        activeNodes: nodes.map((n) => n.id),
        activeEdges: edges.map((e, i) => ({ edgeId: e.id, stepOrder: i + 1 })),
        camera: { viewMode: '3d-webgl' },
      },
    ],
  };
}

export async function generateArchitectureFromPrompt(
  input: GenerateArchitectureInput
): Promise<{
  spec: LivingArchitectureSpec;
  engine: string;
  summary: string;
}> {
  const promptText = input.prompt?.trim() || 'Design an enterprise event-driven architecture';
  const targetModel: GeminiModelTier =
    input.model === HEAVY_LIFT_MODEL ? HEAVY_LIFT_MODEL : BASELINE_MODEL;

  const llmRes = await callGeminiForSpec(
    `Create a complete LivingArchitectureSpec from scratch for the following request:\n"${promptText}"\n${
      input.images?.length
        ? `Also incorporate the components, access points, and data flows visible in the ${input.images.length} attached image(s).`
        : ''
    }`,
    input.images || [],
    targetModel,
    input.apiKey
  );

  if (llmRes) {
    return {
      spec: llmRes.spec,
      engine: llmRes.modelUsed,
      summary: `Generated "${llmRes.spec.meta.title}" with ${llmRes.spec.nodes.length} nodes, ${llmRes.spec.edges.length} data-flow edges, and ${llmRes.spec.scenes.length} narrative scenes via ${llmRes.modelUsed}.`,
    };
  }

  const fallbackSpec = synthesizeDeterministicSpecFromPrompt(promptText, input.images);
  return {
    spec: fallbackSpec,
    engine: `deterministic-synthesizer (${targetModel} fallback)`,
    summary: `Synthesized "${fallbackSpec.meta.title}" (${fallbackSpec.nodes.length} nodes, ${fallbackSpec.edges.length} edges, 3 scenes across 2D/2.5D/3D).`,
  };
}

export async function refactorArchitectureWithAgent(
  input: RefactorArchitectureInput
): Promise<{
  spec: LivingArchitectureSpec;
  appliedCount: number;
  ignoredOperations: Array<{ index: number; reason: string }>;
  engine: string;
  summary: string;
}> {
  const baseSpec = input.spec || DEFAULT_STARTER_SPEC;
  const targetModel: GeminiModelTier =
    input.model === HEAVY_LIFT_MODEL ? HEAVY_LIFT_MODEL : BASELINE_MODEL;

  const diffPayload: WhiteboardDiffPayload = input.diff || {
    timestamp: new Date().toISOString(),
    instruction: input.prompt,
    operations: [],
  };
  if (input.prompt && !diffPayload.instruction) {
    diffPayload.instruction = input.prompt;
  }

  // Step 1: Apply all deterministic direct HTML edits (MOVE_NODE, UPDATE_NODE, ADD_NODE, ADD_EDGE, ANNOTATE_NODE, ADD_PIN_NOTE)
  const mutated = applyWhiteboardDiff(baseSpec, diffPayload);

  // Step 2: Upgrade any generic "Sketch Node X" if an instruction is provided
  for (const node of mutated.spec.nodes) {
    if (/^Sketch Node \d+$/i.test(node.label) && diffPayload.instruction) {
      const cleanName = diffPayload.instruction
        .replace(/^(?:add|create|insert|refactor)\s+(?:an?\s+)?/i, '')
        .slice(0, 28)
        .trim();
      if (cleanName) {
        node.label = cleanName.replace(/\b\w/g, (c) => c.toUpperCase());
        node.kind = inferNodeKind(node.label);
      }
    }
  }

  // Step 3: If user supplied complex natural language refactoring or image(s), let Gemini 3.8 Flash / 4 Argon enrich the mutated spec
  const hasComplexPrompt = Boolean(
    (input.prompt && input.prompt.trim().length > 10 && mutated.appliedCount === 0) ||
      (input.images && input.images.length > 0)
  );

  if (hasComplexPrompt) {
    const llmPrompt = `Refactor this existing LivingArchitectureSpec JSON according to the user's direct page annotations and instructions.
Existing Spec:
${JSON.stringify(mutated.spec, null, 2)}

Direct HTML Operations Applied:
${JSON.stringify(diffPayload.operations || [], null, 2)}

User Refactor Instruction:
"${input.prompt || 'Incorporate the annotations and sketch diffs cleanly into the architecture and scenes.'}"`;

    const llmRes = await callGeminiForSpec(llmPrompt, input.images || [], targetModel, input.apiKey);
    if (llmRes) {
      return {
        spec: llmRes.spec,
        appliedCount: Math.max(1, mutated.appliedCount),
        ignoredOperations: mutated.ignoredOperations,
        engine: llmRes.modelUsed,
        summary: `Agent refactored HTML page via ${llmRes.modelUsed}: ${llmRes.spec.nodes.length} nodes & ${llmRes.spec.edges.length} edges active.`,
      };
    }
  }

  return {
    spec: mutated.spec,
    appliedCount: mutated.appliedCount,
    ignoredOperations: mutated.ignoredOperations,
    engine: `ast-diff-refactor (${targetModel} baseline)`,
    summary: `Applied ${mutated.appliedCount} direct HTML/annotation change(s) and recomputed topological layout & 2D/2.5D/3D conduits.`,
  };
}

/**
 * Exports a standalone SVG vector file and a Three.js WebGL 3D scene script from any LivingArchitectureSpec.
 */
export function exportSvgAndThreeJsArtifacts(spec: LivingArchitectureSpec): {
  svg: string;
  threeJsSceneJson: Record<string, any>;
  threeJsHtml: string;
} {
  const layout = computeDeterministicLayout(spec);

  const planeRects = layout.planes
    .map(
      (p) =>
        `<rect x="28" y="${p.y}" width="${layout.width - 56}" height="${p.height}" rx="10" fill="#FFFFFF" fill-opacity="0.65" stroke="#C8C4B8" stroke-dasharray="6 4" />
         <text x="44" y="${p.y + 22}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#686763">${p.label.toUpperCase()} (ELEV +${p.elevation})</text>`
    )
    .join('\n');

  const edgePaths = spec.edges
    .map((e) => {
      const r = layout.edges[e.id];
      if (!r) return '';
      return `<path d="${r.pathD}" fill="none" stroke="#1D4ED8" stroke-width="2" />
              <text x="${r.labelX}" y="${r.labelY}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="#141413">[${e.protocol || 'FLOW'}] ${e.label || ''}</text>`;
    })
    .join('\n');

  const nodeBoxes = spec.nodes
    .map((n) => {
      const pos = layout.nodes[n.id];
      if (!pos) return '';
      return `<g transform="translate(${pos.x}, ${pos.y})">
        <rect width="${pos.width}" height="${pos.height}" rx="8" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="1.5" />
        <text x="14" y="26" font-family="JetBrains Mono, monospace" font-size="10" font-weight="600" fill="#686763">${(n.metadata?.protocol || n.kind).toUpperCase()}</text>
        <text x="14" y="54" font-family="Inter, sans-serif" font-size="13.5" font-weight="600" fill="#141413">${n.label}</text>
      </g>`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" style="background:#F8F7F4">
    ${planeRects}
    ${edgePaths}
    ${nodeBoxes}
  </svg>`;

  const threeJsSceneJson = {
    generator: 'LivingArchitectureCanvas-ThreeJS-Exporter',
    title: spec.meta.title,
    planes: layout.planes.map((p) => ({
      id: p.id,
      label: p.label,
      position3D: [0, p.elevation, p.y + p.height / 2 - layout.height / 2],
      dimensions: [layout.width * 0.85, 4, p.height * 0.85],
    })),
    meshes: spec.nodes.map((n) => {
      const pos = layout.nodes[n.id];
      return {
        id: n.id,
        label: n.label,
        kind: n.kind,
        protocol: n.metadata?.protocol || n.kind.toUpperCase(),
        geometry: 'BoxGeometry(110, 28, 54)',
        position3D: pos
          ? [pos.x + pos.width / 2 - layout.width / 2, pos.elevation + 18, pos.y + pos.height / 2 - layout.height / 2]
          : [0, 0, 0],
      };
    }),
    conduits: spec.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || e.protocol || 'Flow',
      protocol: e.protocol,
      motionPrimitive: e.motionPrimitive,
      geometry: 'TubeGeometry(CatmullRomCurve3)',
    })),
  };

  const threeJsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${spec.meta.title} — Three.js WebGL 3D Architecture Model</title>
  <style>
    body { margin: 0; background: #F8F7F4; font-family: "Inter", -apple-system, sans-serif; overflow: hidden; }
    #hud {
      position: fixed; top: 14px; left: 16px; right: 16px;
      display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.92); backdrop-filter: blur(8px);
      padding: 10px 16px; border: 1px solid #E2E0D8; border-radius: 8px;
      font-size: 13px; color: #141413; z-index: 10;
    }
    .hint { font-family: monospace; font-size: 11px; color: #686763; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="hud">
    <div><strong>${spec.meta.title}</strong> · Three.js WebGL Spatial Model (${spec.nodes.length} Meshes, ${spec.edges.length} 3D Tube Conduits)</div>
    <div class="hint">Drag to Orbit 3D · Scroll to Zoom</div>
  </div>
  <script id="three-scene-data" type="application/json">${JSON.stringify(threeJsSceneJson).replace(/<\//g, '<\\/')}</script>
  <script>
    const data = JSON.parse(document.getElementById('three-scene-data').textContent);
    if (window.THREE) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8f7f4);
      const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 1, 6000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(innerWidth, innerHeight);
      document.body.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.88));
      const dir = new THREE.DirectionalLight(0xffffff, 0.55);
      dir.position.set(260, 620, 380);
      scene.add(dir);

      const root = new THREE.Group();
      scene.add(root);

      const KIND_COLORS = {
        actor: 0x6d28d9, platform: 0x1d4ed8, service: 0x0f766e,
        agent: 0xea580c, database: 0x15803d, document: 0xb45309, queue: 0xbe185d
      };

      function makeLabelSprite(title, badge, colorHex) {
        const c = document.createElement('canvas');
        c.width = 320; c.height = 88;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#' + colorHex.toString(16).padStart(6, '0');
        ctx.lineWidth = 4;
        ctx.fillRect(4, 4, 312, 80);
        ctx.strokeRect(4, 4, 312, 80);
        ctx.fillStyle = '#686763';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(badge, 18, 30);
        ctx.fillStyle = '#141413';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(title.slice(0, 22), 18, 62);
        const tex = new THREE.CanvasTexture(c);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(135, 37, 1);
        return sprite;
      }

      data.planes.forEach((p) => {
        const pGeo = new THREE.BoxGeometry(660, 3, 155);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, roughness: 0.8 });
        const slab = new THREE.Mesh(pGeo, pMat);
        slab.position.set(0, (p.position3D[1] - 70) * 1.45, p.position3D[2] * 0.52);
        root.add(slab);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(pGeo), new THREE.LineBasicMaterial({ color: 0xc8c4b8 }));
        slab.add(edges);
      });

      const meshMap = {};
      data.meshes.forEach((m) => {
        const col = KIND_COLORS[m.kind] || 0x1d4ed8;
        const geo = new THREE.BoxGeometry(108, 26, 54);
        const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.32, metalness: 0.08 });
        const mesh = new THREE.Mesh(geo, mat);
        const px = m.position3D[0] * 0.55;
        const py = (m.position3D[1] - 70) * 1.45 + 16;
        const pz = m.position3D[2] * 0.52;
        mesh.position.set(px, py, pz);
        root.add(mesh);
        meshMap[m.id] = mesh.position.clone();

        const sprite = makeLabelSprite(m.label, m.protocol, col);
        sprite.position.set(px, py + 34, pz);
        root.add(sprite);
      });

      const packets = [];
      data.conduits.forEach((c, idx) => {
        const p1 = meshMap[c.source];
        const p2 = meshMap[c.target];
        if (!p1 || !p2) return;
        const mid = p1.clone().lerp(p2, 0.5);
        mid.y += 28;
        const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
        const tubeGeo = new THREE.TubeGeometry(curve, 28, 2.2, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, transparent: true, opacity: 0.75 });
        root.add(new THREE.Mesh(tubeGeo, tubeMat));

        const pktGeo = new THREE.SphereGeometry(5.5, 16, 16);
        const pktMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
        const pkt = new THREE.Mesh(pktGeo, pktMat);
        root.add(pkt);
        packets.push({ mesh: pkt, curve, offset: idx * 0.22 });
      });

      let yaw = -0.35, pitch = 0.48, dist = 840, dragging = false, lx = 0, ly = 0;
      window.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
      window.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        yaw += (e.clientX - lx) * 0.006;
        pitch = Math.max(0.15, Math.min(1.35, pitch + (e.clientY - ly) * 0.006));
        lx = e.clientX; ly = e.clientY;
      });
      window.addEventListener('pointerup', () => { dragging = false; });
      window.addEventListener('wheel', (e) => { dist = Math.max(380, Math.min(1400, dist + e.deltaY * 0.5)); });

      function animate(now) {
        requestAnimationFrame(animate);
        if (!dragging) yaw += 0.0018;
        camera.position.set(
          Math.sin(yaw) * Math.cos(pitch) * dist,
          Math.sin(pitch) * dist,
          Math.cos(yaw) * Math.cos(pitch) * dist
        );
        camera.lookAt(0, 10, 0);
        packets.forEach((p) => {
          const t = ((now * 0.00045) + p.offset) % 1;
          p.mesh.position.copy(p.curve.getPointAt(t));
        });
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    }
  </script>
</body>
</html>`;

  return { svg, threeJsSceneJson, threeJsHtml };
}
