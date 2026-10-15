import type { LivingArchitectureSpec } from './schema';

export const STEPHEN_STRANGE_SPEC: LivingArchitectureSpec = {
  meta: {
    title: 'Stephen Strange: Market Horizon',
    version: '3.0',
    defaultView: '2d-flow',
  },
  planes: [
    { id: 'plane-experience', label: 'Layer 1: Executive Experience & Briefs', elevation: 140 },
    { id: 'plane-orchestration', label: 'Layer 2: Stochastic Solver & DAG Engine', elevation: 70 },
    { id: 'plane-data', label: 'Layer 3: DuckDB & Cloud Persistence', elevation: 0 },
  ],
  nodes: [
    {
      id: 'exec-scrubber',
      label: 'Time Machine Scrubber',
      kind: 'actor',
      planeId: 'plane-experience',
      summary: 'Interactive 60-month horizon slider branching roadmap realities.',
      metadata: {
        protocol: 'REACT-19',
        artifactPreview: { type: 'json', content: { branchMonth: 14, preset: 'Competitor Moves First' } },
      },
    },
    {
      id: 'leave-brief',
      label: 'Leave-the-Room Brief',
      kind: 'document',
      planeId: 'plane-experience',
      summary: '3-page printable executive verdict memo with P10/P50/P90 ARR.',
      metadata: {
        protocol: 'PDF/MEMO',
        artifactPreview: {
          type: 'markdown',
          content: '# Executive Verdict\nMedian 5Y NPV: $142.8M | Payback: Month 19 | VaR(P05): -$11.2M',
        },
      },
    },
    {
      id: 'dag-solver',
      label: 'Topological DAG Solver',
      kind: 'agent',
      planeId: 'plane-orchestration',
      summary: 'Discrete quarterly capacity scheduler (250 pts/qtr) with shadow prices.',
      metadata: {
        protocol: 'TS/PY',
        artifactPreview: { type: 'json', content: { capacityPerQuarter: 250, shadowPricePerPt: '$48.2K' } },
      },
    },
    {
      id: 'monte-carlo',
      label: 'Vectorized Monte Carlo',
      kind: 'service',
      planeId: 'plane-orchestration',
      summary: '25,000-path stochastic diffusion engine with Poisson preemption.',
      metadata: {
        protocol: 'NUMPY',
        artifactPreview: { type: 'json', content: { paths: 25000, wacc: 0.1, parityDeltaPct: 1.42 } },
      },
    },
    {
      id: 'duckdb-store',
      label: 'DuckDB SEC Baseline',
      kind: 'database',
      planeId: 'plane-data',
      summary: 'Historical 2021-2024 financial baseline & TAM overlap matrices.',
      metadata: {
        protocol: 'SQL',
        artifactPreview: { type: 'json', content: { table: 'sec_baselines', rows: 14200 } },
      },
    },
    {
      id: 'firestore-sync',
      label: 'Cloud Firestore Briefs',
      kind: 'database',
      planeId: 'plane-data',
      summary: 'Immutable scenario brief snapshots for instant boardroom sharing.',
      metadata: {
        protocol: 'NOSQL',
        artifactPreview: { type: 'json', content: { collection: '/scenario_briefs', ttlDays: 365 } },
      },
    },
  ],
  edges: [
    { id: 'e-scrub-dag', source: 'exec-scrubber', target: 'dag-solver', label: 'Branch Spec', protocol: 'REST', motionPrimitive: 'pulse', payloadSample: { overrideKilled: ['feat-legacy'] } },
    { id: 'e-duck-dag', source: 'duckdb-store', target: 'dag-solver', label: 'Baseline Constraints', protocol: 'SQL', motionPrimitive: 'flow' },
    { id: 'e-dag-mc', source: 'dag-solver', target: 'monte-carlo', label: 'Scheduled Quarters', protocol: 'gRPC', motionPrimitive: 'fork' },
    { id: 'e-mc-brief', source: 'monte-carlo', target: 'leave-brief', label: 'NPV Distribution', protocol: 'Document-Link', motionPrimitive: 'join' },
    { id: 'e-mc-fire', source: 'monte-carlo', target: 'firestore-sync', label: 'Persist Snapshot', protocol: 'Webhook', motionPrimitive: 'pulse' },
  ],
  scenes: [
    {
      id: 'scene-1',
      title: 'Executive Branching & Capacity Scheduling',
      narrative: 'An executive scrubs to Month 14 and branches the roadmap; the DAG solver immediately re-allocates quarterly engineering capacity.',
      activeNodes: ['exec-scrubber', 'duckdb-store', 'dag-solver'],
      activeEdges: [
        { edgeId: 'e-scrub-dag', stepOrder: 1 },
        { edgeId: 'e-duck-dag', stepOrder: 2 },
      ],
      camera: { viewMode: '2d-flow' },
    },
    {
      id: 'scene-2',
      title: 'Stochastic Simulation & Executive Memo Generation',
      narrative: 'The Monte Carlo engine evaluates 25,000 paths with Poisson competitor preemption and compiles the 3-page Leave-the-Room Brief.',
      activeNodes: ['dag-solver', 'monte-carlo', 'leave-brief', 'firestore-sync'],
      activeEdges: [
        { edgeId: 'e-dag-mc', stepOrder: 1 },
        { edgeId: 'e-mc-brief', stepOrder: 2 },
        { edgeId: 'e-mc-fire', stepOrder: 3 },
      ],
      camera: { viewMode: '2.5d-layered' },
    },
  ],
};
