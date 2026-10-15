import type { LivingArchitectureSpec } from './schema';

export const BLANK_STARTER_SPEC: LivingArchitectureSpec = {
  meta: {
    title: 'Untitled System Architecture',
    subtitle: 'Workable From-Scratch Canvas · Prompt, Upload Sketch, or Build Directly on Page',
    version: '1.0',
    defaultView: '2d-flow',
  },
  planes: [
    { id: 'plane-experience', label: 'Layer 1: Access Points & Client Surfaces', elevation: 140 },
    { id: 'plane-orchestration', label: 'Layer 2: APIs, Services & Agent Orchestration', elevation: 70 },
    { id: 'plane-data', label: 'Layer 3: Data Stores, Queues & External Platforms', elevation: 0 },
  ],
  nodes: [
    {
      id: 'client-entry',
      label: 'Client Access Point',
      kind: 'actor',
      planeId: 'plane-experience',
      summary: 'Primary user, SDK, or webhook ingress surface. Double-click title to rename or drag to move.',
      metadata: {
        protocol: 'HTTPS',
        accessPoint: 'https://app.example.com',
        artifactPreview: {
          type: 'json',
          content: { client: 'web-sdk', auth: 'Bearer JWT', method: 'POST /v1/dispatch' },
        },
      },
    },
    {
      id: 'core-service',
      label: 'Core Orchestrator API',
      kind: 'service',
      planeId: 'plane-orchestration',
      summary: 'Central business logic, routing, and policy enforcement service.',
      metadata: {
        protocol: 'REST/gRPC',
        artifactPreview: {
          type: 'json',
          content: { service: 'core-orchestrator', slaP99Ms: 25, retries: 3 },
        },
      },
    },
    {
      id: 'primary-store',
      label: 'Primary State Store',
      kind: 'database',
      planeId: 'plane-data',
      summary: 'Transactional persistence layer and event outbox.',
      metadata: {
        protocol: 'SQL',
        artifactPreview: {
          type: 'json',
          content: { engine: 'PostgreSQL', replication: 'multi-az', outboxEnabled: true },
        },
      },
    },
  ],
  edges: [
    {
      id: 'e-client-core',
      source: 'client-entry',
      target: 'core-service',
      label: 'Ingress Request',
      protocol: 'REST',
      motionPrimitive: 'flow',
      payloadSample: { requestId: 'req_01', action: 'execute' },
    },
    {
      id: 'e-core-store',
      source: 'core-service',
      target: 'primary-store',
      label: 'Persist State',
      protocol: 'SQL',
      motionPrimitive: 'pulse',
      payloadSample: { txId: 'tx_99', committed: true },
    },
  ],
  scenes: [
    {
      id: 'scene-1',
      title: '1. End-to-End Request Flow (2D SVG)',
      narrative: 'Requests enter through the Client Access Point, route through the Core Orchestrator API, and persist to the Primary State Store.',
      activeNodes: ['client-entry', 'core-service', 'primary-store'],
      activeEdges: [
        { edgeId: 'e-client-core', stepOrder: 1 },
        { edgeId: 'e-core-store', stepOrder: 2 },
      ],
      camera: { viewMode: '2d-flow' },
    },
    {
      id: 'scene-2',
      title: '2. Layered Plane Separation (2.5D Isometric)',
      narrative: 'Orthographic 2.5D view separating Access Points, Service Orchestration, and Data Persistence planes.',
      activeNodes: ['client-entry', 'core-service', 'primary-store'],
      activeEdges: [
        { edgeId: 'e-client-core', stepOrder: 1 },
        { edgeId: 'e-core-store', stepOrder: 2 },
      ],
      camera: { viewMode: '2.5d-layered' },
    },
    {
      id: 'scene-3',
      title: '3. Spatial Topology (3D WebGL / Three.js)',
      narrative: 'Interactive 3D spatial view showing cross-plane conduits and volumetric component nodes.',
      activeNodes: ['client-entry', 'core-service', 'primary-store'],
      activeEdges: [
        { edgeId: 'e-client-core', stepOrder: 1 },
        { edgeId: 'e-core-store', stepOrder: 2 },
      ],
      camera: { viewMode: '3d-webgl' },
    },
  ],
};

export const PAYMENT_GATEWAY_BLUEPRINT: LivingArchitectureSpec = {
  meta: {
    title: 'Omnichannel Payment & Real-Time Risk Mesh',
    subtitle: 'POS/E-Com Access Points, Zero-Trust mTLS Gateway, AI Fraud Scoring & Multi-Rail Settlement',
    version: '2.4',
    defaultView: '2d-flow',
  },
  planes: [
    { id: 'plane-access', label: 'Layer 1: Merchant Access Points & SDKs', elevation: 150 },
    { id: 'plane-core', label: 'Layer 2: API Gateway, AI Risk & Routing Mesh', elevation: 75 },
    { id: 'plane-rails', label: 'Layer 3: Card Rails, Token Vault & Ledger', elevation: 0 },
  ],
  nodes: [
    {
      id: 'pos-terminal',
      label: 'SmartPOS & Web Checkout SDK',
      kind: 'actor',
      planeId: 'plane-access',
      summary: 'Contactless terminal & hosted checkout WebSDK with P2PE encryption.',
      metadata: {
        protocol: 'mTLS/REST',
        accessPoint: 'wss://pos-edge.gateway.internal/v2',
        artifactPreview: { type: 'json', content: { merchantId: 'MERCH-99412', amountMinor: 14500, currency: 'EUR', channel: 'CP_EMV' } },
      },
    },
    {
      id: 'merchant-portal',
      label: 'Reconciliation Portal',
      kind: 'document',
      planeId: 'plane-access',
      summary: 'Real-time reconciliation dashboard & settlement batch manifest.',
      metadata: {
        protocol: 'GRAPHQL',
        artifactPreview: { type: 'markdown', content: '# Settlement Manifest\nAuth Rate: 99.42% | Fraud Blocked: €18.4K | T+0 Instant Payout Ready' },
      },
    },
    {
      id: 'edge-gateway',
      label: 'Edge API Gateway',
      kind: 'platform',
      planeId: 'plane-core',
      summary: 'Zero-trust mTLS ingress, rate limiting, and idempotency key router.',
      metadata: {
        protocol: 'REST/gRPC',
        artifactPreview: { type: 'json', content: { slaP99Ms: 14, idempotencyTtlSec: 86400, region: 'eu-west-1' } },
      },
    },
    {
      id: 'risk-agent',
      label: 'AI Fraud & Auth Scorer',
      kind: 'agent',
      planeId: 'plane-core',
      summary: 'Sub-25ms feature scorer evaluating velocity, device fingerprint & MCC.',
      metadata: {
        protocol: 'gRPC',
        artifactPreview: { type: 'json', content: { riskScore: 0.018, decision: 'APPROVE', modelVersion: 'fraud-v4.2' } },
      },
    },
    {
      id: 'event-bus',
      label: 'Kafka Acquiring Bus',
      kind: 'queue',
      planeId: 'plane-core',
      summary: 'Partitioned event stream fanning out auth events to clearing and merchant webhooks.',
      metadata: {
        protocol: 'EVENT',
        artifactPreview: { type: 'json', content: { topic: 'acquiring.auth.v2', partitions: 64, lagMs: 4 } },
      },
    },
    {
      id: 'pci-vault',
      label: 'PCI-DSS Token Vault',
      kind: 'database',
      planeId: 'plane-rails',
      summary: 'HSM-backed PAN tokenization and network token provisioning.',
      metadata: {
        protocol: 'SQL',
        artifactPreview: { type: 'json', content: { token: 'tok_8f92a1c', networkToken: true, pciScope: 'CDE-Isolated' } },
      },
    },
    {
      id: 'settlement-ledger',
      label: 'ISO-8583 & Settlement Ledger',
      kind: 'platform',
      planeId: 'plane-rails',
      summary: 'Dual-message clearing adapter and immutable double-entry ledger.',
      metadata: {
        protocol: 'Webhook',
        artifactPreview: { type: 'json', content: { isoMti: '0100->0110', clearingWindow: 'T+0', ledgerBalanced: true } },
      },
    },
  ],
  edges: [
    { id: 'e-pos-gw', source: 'pos-terminal', target: 'edge-gateway', label: 'mTLS Auth Req', protocol: 'REST', motionPrimitive: 'flow' },
    { id: 'e-gw-vault', source: 'edge-gateway', target: 'pci-vault', label: 'Detokenize PAN', protocol: 'SQL', motionPrimitive: 'pulse' },
    { id: 'e-gw-risk', source: 'edge-gateway', target: 'risk-agent', label: 'Score Context', protocol: 'gRPC', motionPrimitive: 'flow' },
    { id: 'e-risk-bus', source: 'risk-agent', target: 'event-bus', label: 'Approved Event', protocol: 'Event', motionPrimitive: 'fork' },
    { id: 'e-bus-ledger', source: 'event-bus', target: 'settlement-ledger', label: 'ISO-8583 Clear', protocol: 'Webhook', motionPrimitive: 'flow' },
    { id: 'e-bus-portal', source: 'event-bus', target: 'merchant-portal', label: 'Live Webhook', protocol: 'Document-Link', motionPrimitive: 'join' },
  ],
  scenes: [
    {
      id: 'scene-ingress',
      title: '1. Zero-Trust Access Point & PCI Vault Tokenization',
      narrative: 'A SmartPOS terminal initiates an mTLS transaction; the Edge Gateway swaps the raw PAN for a network token inside the isolated PCI-DSS Vault.',
      activeNodes: ['pos-terminal', 'edge-gateway', 'pci-vault'],
      activeEdges: [
        { edgeId: 'e-pos-gw', stepOrder: 1 },
        { edgeId: 'e-gw-vault', stepOrder: 2 },
      ],
      camera: { viewMode: '2d-flow' },
    },
    {
      id: 'scene-scoring',
      title: '2. Sub-25ms AI Fraud Scoring & Event Fan-Out',
      narrative: 'The AI Fraud Scorer evaluates cross-merchant velocity over gRPC and publishes the approved decision onto the partitioned Kafka Bus.',
      activeNodes: ['edge-gateway', 'risk-agent', 'event-bus'],
      activeEdges: [
        { edgeId: 'e-gw-risk', stepOrder: 1 },
        { edgeId: 'e-risk-bus', stepOrder: 2 },
      ],
      camera: { viewMode: '2.5d-layered' },
    },
    {
      id: 'scene-settlement',
      title: '3. Multi-Rail ISO-8583 Clearing & 3D Platform Interop',
      narrative: 'Events simultaneously commit to the ISO-8583 Settlement Ledger and stream live reconciliation manifests back to the Reconciliation Portal.',
      activeNodes: ['pos-terminal', 'edge-gateway', 'risk-agent', 'event-bus', 'pci-vault', 'settlement-ledger', 'merchant-portal'],
      activeEdges: [
        { edgeId: 'e-pos-gw', stepOrder: 1 },
        { edgeId: 'e-gw-risk', stepOrder: 2 },
        { edgeId: 'e-risk-bus', stepOrder: 3 },
        { edgeId: 'e-bus-ledger', stepOrder: 4 },
        { edgeId: 'e-bus-portal', stepOrder: 5 },
      ],
      camera: { viewMode: '3d-webgl' },
    },
  ],
};

export const AGENTIC_INTEROP_BLUEPRINT: LivingArchitectureSpec = {
  meta: {
    title: 'Multi-Agent MCP & Knowledge Graph Interop',
    subtitle: 'Collaborative Prompt Surfaces, MCP Tool Gateway & Semantic Knowledge Vault',
    version: '1.8',
    defaultView: '2d-flow',
  },
  planes: [
    { id: 'plane-surface', label: 'Layer 1: Collaborative Prompt & Canvas Surfaces', elevation: 140 },
    { id: 'plane-agents', label: 'Layer 2: MCP Gateway & Autonomous Subagents', elevation: 70 },
    { id: 'plane-knowledge', label: 'Layer 3: Semantic Graph & Enterprise Systems', elevation: 0 },
  ],
  nodes: [
    {
      id: 'prompt-surface',
      label: 'Web Studio & Chat Surface',
      kind: 'actor',
      planeId: 'plane-surface',
      summary: 'Multimodal text and image prompt surface for system designers.',
      metadata: { protocol: 'HTTPS', artifactPreview: { type: 'json', content: { surface: 'Studio Workbench', attachmentSupport: true } } },
    },
    {
      id: 'living-html',
      label: 'Living HTML Canvas Artifact',
      kind: 'document',
      planeId: 'plane-surface',
      summary: 'Self-contained interactive 2D/3D architecture page with direct annotation.',
      metadata: { protocol: 'HTML5/WEBGL', artifactPreview: { type: 'markdown', content: '# Portable Artifact\nZero external deps · 2D SVG + 2.5D Isometric + 3D WebGL' } },
    },
    {
      id: 'mcp-gateway',
      label: 'MCP & OpenAPI Router',
      kind: 'platform',
      planeId: 'plane-agents',
      summary: 'Bridges identity tokens to specialized rendering and research tools.',
      metadata: { protocol: 'REST', artifactPreview: { type: 'json', content: { endpoints: ['/render', '/scenes/add', '/api/refactor'] } } },
    },
    {
      id: 'architect-agent',
      label: 'Architecture Synthesizer Agent',
      kind: 'agent',
      planeId: 'plane-agents',
      summary: 'Multimodal LLM engine (Gemini 3.8 Flash / Gemini 4 Argon) converting sketches and DOM diffs into specs.',
      metadata: { protocol: 'gRPC', artifactPreview: { type: 'json', content: { baselineModel: 'gemini-3.8-flash', heavyLiftModel: 'gemini-4-argon' } } },
    },
    {
      id: 'knowledge-vault',
      label: 'Semantic Knowledge Vault',
      kind: 'database',
      planeId: 'plane-knowledge',
      summary: 'Git-backed markdown ontology, ADRs, and system specifications.',
      metadata: { protocol: 'SQL', artifactPreview: { type: 'json', content: { notesIndexed: 412, semanticEdges: 1280 } } },
    },
  ],
  edges: [
    { id: 'e-cop-mcp', source: 'prompt-surface', target: 'mcp-gateway', label: 'Prompt + Sketch', protocol: 'REST', motionPrimitive: 'flow' },
    { id: 'e-mcp-agent', source: 'mcp-gateway', target: 'architect-agent', label: 'Invoke Skill', protocol: 'gRPC', motionPrimitive: 'pulse' },
    { id: 'e-sb-agent', source: 'knowledge-vault', target: 'architect-agent', label: 'Context Grounding', protocol: 'SQL', motionPrimitive: 'flow' },
    { id: 'e-agent-html', source: 'architect-agent', target: 'living-html', label: 'Compile Artifact', protocol: 'Document-Link', motionPrimitive: 'join' },
    { id: 'e-html-mcp', source: 'living-html', target: 'mcp-gateway', label: 'Direct HTML Diff', protocol: 'Webhook', motionPrimitive: 'pulse' },
  ],
  scenes: [
    {
      id: 'scene-prompt',
      title: '1. Multimodal Prompting & Knowledge Grounding',
      narrative: 'A user uploads a whiteboard sketch or prompt; the MCP Gateway routes it to the Architecture Synthesizer grounded by the Knowledge Vault.',
      activeNodes: ['prompt-surface', 'mcp-gateway', 'knowledge-vault', 'architect-agent'],
      activeEdges: [
        { edgeId: 'e-cop-mcp', stepOrder: 1 },
        { edgeId: 'e-mcp-agent', stepOrder: 2 },
        { edgeId: 'e-sb-agent', stepOrder: 3 },
      ],
      camera: { viewMode: '2d-flow' },
    },
    {
      id: 'scene-loop',
      title: '2. Interactive HTML Compilation & Direct In-Page Refactor Loop',
      narrative: 'The user annotates and edits nodes directly on the compiled HTML page; changes flow back to the agent to refactor the architecture live.',
      activeNodes: ['architect-agent', 'living-html', 'mcp-gateway'],
      activeEdges: [
        { edgeId: 'e-agent-html', stepOrder: 1 },
        { edgeId: 'e-html-mcp', stepOrder: 2 },
        { edgeId: 'e-mcp-agent', stepOrder: 3 },
      ],
      camera: { viewMode: '3d-webgl' },
    },
  ],
};

export const DEFAULT_STARTER_SPEC = BLANK_STARTER_SPEC;

export const PRESET_SPECS: Record<string, LivingArchitectureSpec> = {
  'blank-starter': BLANK_STARTER_SPEC,
  'payment-gateway-blueprint': PAYMENT_GATEWAY_BLUEPRINT,
  'agentic-interop-blueprint': AGENTIC_INTEROP_BLUEPRINT,
};
