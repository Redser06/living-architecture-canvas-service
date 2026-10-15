# Living Architecture Canvas — Studio, Compiler & Agent Refactor Runtime

A lightweight, agent-driven studio, compiler, and HTTP service that transforms natural-language prompts, uploaded architecture sketches/images, and declarative system specifications (`LivingArchitectureSpec`) into self-contained, interactive `.html`, `.svg`, and Three.js WebGL 3D artifacts—and allows users to **annotate and edit nodes directly on the HTML page** so the agent/model can pick up those changes and refactor the page live.

## Key Capabilities

1. **Editorial Architectural Landing Page & Studio Workbench (`GET /`)**
   - Boots cleanly on a workable-from-scratch **Blank Starter Architecture Canvas** (`blank-starter`), plus optional generic blueprints (*Omnichannel Payment & Real-Time Risk Mesh*, *Multi-Agent MCP & Knowledge Graph Interop*).
   - Split-pane Studio Workbench pairing a multimodal Agent Chat & Sketch Uploader with a 4-tab execution workspace.
2. **Multimodal Chat & Sketch/Image Upload (`POST /api/generate`)**
   - Uses **Gemini 3.8 Flash (`gemini-3.8-flash`)** as the baseline model and **Gemini 4 Argon (`gemini-4-argon`)** for heavy-lift synthesis (selectable in the Studio UI), with a deterministic architecture synthesizer fallback.
   - Generates strongly-typed `LivingArchitectureSpec` AST with access points, protocols (`REST`, `gRPC`, `Webhook`, `Event`, `Document-Link`, `SQL`), payload schemas, and narrative scenes.
3. **Direct In-Page HTML Manipulation & Annotation -> Agent Refactor Loop (`POST /api/refactor`)**
   - **Add Components Directly (`+ Add Node`):** Add new components right from the HTML canvas toolbar (`ADD_NODE`).
   - **Inline DOM Editing:** Double-click any node title on the rendered HTML page to edit it in-place (`UPDATE_NODE`).
   - **Direct Node Dragging:** Drag any node card on the HTML canvas to reposition it and recompute spline conduits (`MOVE_NODE`).
   - **Freehand Whiteboard & Semantic Hit-Testing (`✎ Connect / Draw`):** Draw directly between nodes to wire new edges (`ADD_EDGE`) or sketch new components (`ADD_NODE`).
   - **Contextual Annotation Pins (`📌 Annotate`):** Drop annotation pins directly onto the HTML canvas or inside the node inspector (`ADD_PIN_NOTE` / `ANNOTATE_NODE`), then click **✨ Refactor HTML** so the agent/LLM incorporates your changes and recompiles the page.
4. **2D SVG, 2.5D Isometric Stack & 3D WebGL / Three.js Outputs (`POST /api/export-3d`)**
   - **2D SVG + HTML DOM (`2d-flow`):** Crisp cubic Bezier splines, protocol badges, and animated packets (`flow`, `pulse`, `fork`, `join`, `error`).
   - **2.5D Orthographic Isometric Stack (`2.5d-layered`):** CSS3D multi-layer elevation planes.
   - **3D WebGL Spatial Canvas (`3d-webgl`) & Three.js Scene Exporter:** Interactive orbital 3D layer slabs, extruded node volumes, 3D `TubeGeometry` conduits, and animated 3D spheres, plus 1-click export to standalone `.html`, `.svg`, or Three.js WebGL `.html`.
5. **Live Code & AST Execution Sandbox**
   - Edit `LivingArchitectureSpec` JSON or raw compiled HTML/SVG/JS directly in the browser and execute it live.
6. **Headless Browser & Screenshot Validation (`POST /api/validate-render`)**
   - Launches headless Chromium (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`) to render the compiled artifact, capture a 1440×900 PNG screenshot, and run automated DOM/SVG/3D integrity checks.

## Quick Start

```bash
# Run automated eval suite (5 eval suites, 54 assertions)
bun test

# Build standalone demo HTML, SVG, Three.js 3D, and Studio artifacts to dist/
bun run build:demos

# Start the Studio & Compiler HTTP service (http://localhost:4321)
bun run dev
```

## HTTP Service Endpoints

- `GET /` — Serves the **Living Architecture Studio** (Landing Page + Multimodal Chat + Live Renderer + Code Executor + Browser Validator).
- `GET /canvas` — Serves the standalone zero-dependency compiled `.html` artifact directly.
- `GET /health` — Health check.
- `GET /presets` — Lists built-in starter & blueprint architecture specs (`?name=blank-starter|payment-gateway-blueprint|agentic-interop-blueprint`).
- `POST /render` — Compiles `{ "spec": LivingArchitectureSpec }` into a standalone `.html` response.
- `POST /scenes/add` — Applies a `WhiteboardDiffPayload` or natural-language `instruction` to a spec and returns updated spec + HTML.
- `POST /api/generate` — Generates a new `LivingArchitectureSpec`, compiled HTML, SVG, and Three.js scene from `{ prompt, images }`.
- `POST /api/refactor` — Picks up direct HTML page edits/annotations (`diff`) + `prompt` and refactors the spec & HTML artifact.
- `POST /api/export-3d` — Exports standalone `.svg` and Three.js WebGL 3D `.html` / scene JSON for a given spec.
- `POST /api/validate-render` — Runs headless Chromium screenshot capture + 6-point DOM/SVG/3D verification.
