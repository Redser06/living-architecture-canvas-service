# Product Requirements Document (PRD): Living Architecture Canvas

**Version:** 1.0  
**Date:** October 14, 2026  
**Aesthetic Standard:** Editorial Architectural (Daylight High-Contrast)  
**Builds On:** Spike 001 (`001-architecture-in-motion`)

---

## 1. Executive Summary & Product Positioning

Organizations frequently hit a communication wall when explaining complex systems, cross-platform workflows, and technical concepts to stakeholders. Today, teams are forced to choose between two extremes:

- **Static Slide Decks & Diagrams (PowerPoint, Mermaid, Miro PNG exports):** Easy to share, but lifeless. They flatten multi-dimensional relationships, hide data payloads, and fail to communicate how systems behave over time.
- **Full Product Prototypes:** Interactive and realistic, but expensive to build, brittle to maintain, and blocked by enterprise IT/security policies that restrict deploying live code to external URLs.

**The Solution:** A lightweight, agent-driven generator that compiles natural language ideas, system architectures, and document workflows into a self-contained, interactive HTML artifact. Using a hybrid rendering engine (HTML DOM, SVG, and orthographic 2.5D spatial projection), it produces a portable file that recipients can open locally in any browser—with zero server dependencies or deployment risk—to trace live data flows, inspect documents at specific lifecycle stages, and explore how technologies and platforms interconnect.

| Dimension | Static Decks / Miro Exports | Deployed Prototypes | Living HTML Canvas (This Product) |
| :--- | :--- | :--- | :--- |
| **Interactivity** | None (static boxes and arrows) | High (full app logic) | Targeted (trace flows, inspect payloads, step through scenes) |
| **Distribution** | Universal (`.pptx`, `.pdf`) | High friction (requires hosting, auth, IT approval) | Universal (single `.html` file shared via email/Slack; works offline) |
| **Creation Speed** | Fast (manual dragging) | Slow (days/weeks of engineering) | Instant / Iterative (generated and updated live via coding agent) |
| **Primary Job** | Async reading / 20-person workshops | User usability testing | Executive storytelling, system comprehension, and live architectural ideation |

---

## 2. Core User Modes (The Three Postures)

Rather than building separate tools for diagramming, presenting, and whiteboarding, the artifact operates as a single HTML canvas with three first-class postures:

### Mode 1: Guided Presentation ("Narrative Architecture")
- **User Story:** As a PM, Solutions Consultant, or Architect presenting to executives, I want to step through a system’s behavior scene-by-scene so stakeholders immediately grasp value and technical flow without reading a wall of boxes.
- **Capabilities:**
  - **Ordered Scenes:** Click-to-advance (or keyboard arrow) state machine that progressively reveals the architecture.
  - **Active Path Highlighting:** Inactive nodes dim to 30% opacity while active integrations, APIs, and documents animate along the exact path a request touches.
  - **Contextual Drawer:** Clicking any node, edge, or flowing packet opens a clean inspection panel showing sample JSON payloads, actual document templates (e.g., PDF/contract schemas), or SLA metrics.

### Mode 2: Live Ideation ("Spitballing with an Agent")
- **User Story:** As a system designer working through an idea, I want to talk to a coding agent in natural language (e.g., *"Add an event queue between the gateway and the worker agent, and link the compliance PDF output to the audit bucket"*) and see the canvas reorganize and animate within seconds.
- **Capabilities:**
  - **Declarative Graph Spec:** The artifact separates the underlying Graph Schema (JSON) from the Rendering Engine, allowing an LLM/coding agent to modify nodes, links, and scenes in milliseconds without rewriting boilerplate rendering code.
  - **Hot-Reloading State:** Preserves current camera angle and selected scene when the agent updates the underlying file.

### Mode 3: Virtual Whiteboard ("In-Meeting Annotation")
- **User Story:** When an executive asks during a presentation, *"Where does the ERP reconciliation step fit into this?"*, I want to draw directly on the live architecture canvas to sketch a new node or reroute a flow on the fly.
- **Capabilities:**
  - **Vector Freehand Overlay:** Smooth SVG ink layer anchored to the canvas coordinate space (pans and zooms with the diagram).
  - **Semantic Diff Export:** Drawn boxes, arrows, and text notes can be exported as a structured "Whiteboard Diff" payload back to the coding agent, which converts the rough sketch into permanent, styled architecture nodes.

---

## 3. Design System & Visual Aesthetic: "Editorial Architectural"

To establish executive credibility, the UI strictly avoids dark-mode "cyberpunk/Tron" tropes, glowing neon gradients, and sci-fi particle effects. Instead, it draws inspiration from Swiss typographic grids, Stripe Press, Linear’s daylight theme, and Dieter Rams’ industrial design—prioritizing clarity, tactile surfaces, and high-contrast legibility on conference room projectors.

### Color Palette & Surface Tokens
- **Canvas Background:** Warm Alabaster (`#F8F7F4`) with a subtle, precision dot-matrix or architectural blueprint grid (`#E6E4DD`).
- **Surface / Node Cards:** Crisp Pure White (`#FFFFFF`) with `1px solid #E2E0D8` borders and a subtle ambient elevation shadow (`0 2px 6px rgba(20, 20, 19, 0.04)`).
- **Typography & Ink:** Deep Charcoal (`#141413`) for primary labels; Muted Slate (`#686763`) for metadata and protocols; Warm Grey (`#9E9D99`) for inactive states.
- **Semantic Accent Palette (High-Contrast, Non-Neon):**
  - **Data / Happy Path (`flow`):** International Klein Blue (`#1D4ED8`)
  - **Async / Event Trigger (`pulse`):** Braun International Orange (`#EA580C`)
  - **Storage / Document Artifact:** Forest Emerald (`#15803D`)
  - **Human Actor / External Platform:** Deep Plum (`#6D28D9`)
  - **Exception / Retry Path (`error`):** Crimson Brick (`#B91C1C`)

### Typography & Iconography
- **UI & Node Headers:** Inter or Plus Jakarta Sans (Semi-Bold, tight tracking `-0.02em`).
- **Technical Labels, Protocols & Payloads:** JetBrains Mono or Geist Mono (`11px` uppercase badges for `REST`, `gRPC`, `S3`, `PDF`, `LLM`).
- **Visual Hierarchy:** Every node displays a maximum of 3 data points at rest (Icon + Title + Type Badge). Deep technical details live inside progressive-disclosure inspection panels.

### 2D vs. 2.5D Spatial Usage
- **2D View (Default):** Crisp SVG + HTML DOM for rapid flow tracing and reading.
- **2.5D Isometric Planes (Orthographic View):** Used strictly to clarify multi-layer abstraction—separating a system into horizontal planes (`Layer 1: User Experience & Documents` → `Layer 2: Application & AI Orchestration` → `Layer 3: Data Platforms & Infrastructure`) with animated vertical conduits showing how a user action penetrates the stack.

---

## 4. Functional Scope & Non-Goals

### In-Scope (V1)
- **Single-File Portability:** Compiles into a standalone `.html` file with zero external server requirements.
- **Interactive Data-Flow Scrubber:** Play, pause, step forward/backward through a request lifecycle, or click any edge to manually fire a test packet through the graph.
- **Document & Material Previews:** Clicking a "Document" or "Artifact" node opens an inline preview of the material (e.g., how a raw user prompt transforms into a structured JSON schema, and then into a final customer PDF).

### Out-of-Scope (Non-Goals)
- **Multiplayer Sticky-Note Workshops:** Does not replace Miro or FigJam for 20-person brainstorming sessions.
- **Live Production Telemetry:** Simulates and explains system architecture using deterministic state machines; not an observability dashboard (Datadog/Grafana).

---

## 5. Canonical Graph Data Model (`LivingArchitectureSpec`)

```typescript
interface LivingArchitectureSpec {
  meta: {
    title: string;
    version: string;
    defaultView: '2d-flow' | '2.5d-layered';
  };
  planes: Array<{
    id: string;
    label: string;
    elevation: number;
  }>;
  nodes: Array<{
    id: string;
    label: string;
    kind: 'platform' | 'service' | 'agent' | 'database' | 'document' | 'actor' | 'queue';
    planeId: string;
    parentGroupId?: string;
    summary: string;
    metadata: {
      techStack?: string[];
      protocol?: string;
      artifactPreview?: {
        type: 'json' | 'markdown' | 'document-schema' | 'table';
        content: string | Record<string, any>;
      };
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    protocol?: 'REST' | 'gRPC' | 'Webhook' | 'Event' | 'Document-Link' | 'SQL';
    motionPrimitive: 'flow' | 'pulse' | 'fork' | 'join' | 'error';
    payloadSample?: Record<string, any>;
  }>;
  scenes: Array<{
    id: string;
    title: string;
    narrative: string;
    activeNodes: string[];
    activeEdges: Array<{
      edgeId: string;
      stepOrder: number;
      motionOverride?: 'flow' | 'pulse' | 'fork' | 'join' | 'error';
    }>;
    camera: {
      viewMode: '2d-flow' | '2.5d-layered';
      focusNodeIds?: string[];
    };
  }>;
}
```
