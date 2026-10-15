# Frontend Runtime & Compiler: Chunking Plan

This plan breaks down the remaining "Living Architecture Canvas" frontend and compiler work into modular files, each strictly <= 90 lines of code, to avoid tool-call timeouts and facilitate rapid building.

## 1. Runtime Framework (Client-Side JS)
The runtime is a vanilla JS application that will be injected into the final HTML. It uses the `ComputedGraphLayout` produced by `layout.ts`.

| File | Responsibility | Inputs | Outputs | Line Cap |
| :--- | :--- | :--- | :--- | :--- |
| `runtime/store.ts` | Reactive state for scene, camera, selection. | `LivingArchitectureSpec` | State change events | 60 |
| `runtime/dom-utils.ts` | SVG/HTML element creation & attribute helpers. | Tag names, attrs | DOM Elements | 50 |
| `runtime/renderer-grid.ts` | Renders the dot-matrix background & planes. | `ComputedGraphLayout` | Static Canvas elements | 70 |
| `runtime/renderer-nodes.ts` | Renders Node cards with kind-based icons. | `ComputedGraphLayout` | Node DOM nodes | 85 |
| `runtime/renderer-edges.ts` | Renders SVG Bezier paths & protocol markers. | `ComputedGraphLayout` | SVG Path elements | 80 |
| `runtime/renderer-packets.ts` | Animates "flow" dots along edge paths. | `SceneActiveEdge` | SVG Animate elements | 70 |
| `runtime/ui-narrative.ts` | Scene stepper, title, and narrative text box. | `ArchitectureScene` | UI HUD (Top/Bottom) | 80 |
| `runtime/ui-inspector.ts` | Node/Edge detail panel (JSON/Markdown). | `ArtifactPreview` | Sidebar DOM | 90 |
| `runtime/whiteboard.ts` | Freehand SVG ink layer & Diff exporter. | Mouse/Touch events | `WhiteboardDiffPayload` | 90 |
| `runtime/app.ts` | Entry point: wires store to renderers & events. | `LivingArchitectureSpec` | Initialized App | 80 |

## 2. HTML Compiler Service (Build-Side)
Node.js utility to bundle all assets into a single portable `.html` file.

| File | Responsibility | Inputs | Outputs | Line Cap |
| :--- | :--- | :--- | :--- | :--- |
| `compiler/template.ts` | Minimal HTML skeleton with `{{SLOTS}}`. | N/A | Template String | 40 |
| `compiler/bundler.ts` | Reads CSS/JS, minifies, and injects data. | Specs, Styles, JS | Final HTML String | 90 |

## 3. Build & Integration Sequence

1.  **Phase 1: Core Rendering**
    - Implement `dom-utils.ts` and `store.ts`.
    - Implement `renderer-grid.ts`, `renderer-nodes.ts`, and `renderer-edges.ts`.
    - Test: Can we render a static spec?
2.  **Phase 2: Narrative & Motion**
    - Implement `renderer-packets.ts` and `ui-narrative.ts`.
    - Wires up the "Next Scene" button to the animation engine.
3.  **Phase 3: Deep Dive & Whiteboarding**
    - Implement `ui-inspector.ts` and `whiteboard.ts`.
4.  **Phase 4: Distribution**
    - Implement `compiler/template.ts` and `compiler/bundler.ts`.

## 4. Evals (Success Metrics)

1.  **Self-Contained Check:** The output `.html` file must contain no `import` statements or external `<script src="...">` tags (zero dependencies).
2.  **Line Count Audit:** Every file in `src/runtime/` and `src/compiler/` must be < 90 lines.
3.  **Deterministic Layout:** The same input JSON must result in the exact same node coordinates every time.
4.  **Scene Transitions:** Switching scenes must update the narrative text and dim inactive nodes/edges within 300ms.
5.  **2.5D Perspective:** Toggling '2.5d-layered' must apply the CSS transform `rotateX(45deg) rotateZ(-20deg)` (or similar) to the canvas container.
6.  **Packet Animation:** Flowing packets must follow the curved SVG path exactly, not a straight line.
7.  **Inspector Clarity:** Clicking a node with a `json` preview must render a formatted code block in the sidebar.
8.  **Whiteboard Accuracy:** Drawing a loop around a node must preserve the coordinates relative to the canvas zoom/pan.
9.  **Error Resilience:** A missing `planeId` in a node must be caught by the validator and not crash the runtime.
10. **Build Speed:** The compiler must produce the artifact in < 500ms on a standard laptop.

## 5. Definition of Done
- All 12 chunks (10 runtime, 2 compiler) are implemented.
- A "Demo Arch" spec is included.
- A single command (e.g., `npm run build`) generates a working `dist/canvas.html`.
- The `canvas.html` is visually verified to match the "Editorial Architectural" daylight aesthetic.
