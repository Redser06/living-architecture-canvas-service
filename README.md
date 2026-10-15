# Living Architecture Canvas

A lightweight, agent-driven compiler and HTTP service that compiles declarative system architecture specifications (`LivingArchitectureSpec`) into self-contained, zero-dependency interactive `.html` artifacts.

## Features

- **Mode 1: Guided Presentation ("Narrative Architecture")** — Scene-by-scene narrative stepper with active path highlighting, 5 SVG motion primitives (`flow`, `pulse`, `fork`, `join`, `error`), 2D/2.5D Isometric stack view toggle, and a contextual payload/document inspector drawer.
- **Mode 2: Live Ideation ("Spitballing with an Agent")** — Strongly-typed `LivingArchitectureSpec` AST separated from deterministic topological auto-layout (`src/layout.ts`) and natural-language/structured diff mutation (`src/ideation.ts`).
- **Mode 3: Virtual Whiteboard ("In-Meeting Annotation")** — Coordinate-locked SVG freehand drawing layer with semantic hit-testing that exports `ADD_NODE` and `ADD_EDGE` diff payloads.
- **Editorial Architectural Aesthetic** — Warm Alabaster (`#F8F7F4`) daylight palette, crisp Pure White (`#FFFFFF`) node cards, and high-contrast semantic accents.

## Quick Start

```bash
# Run test suite (5 evals, 31 assertions)
bun test

# Build standalone demo HTML artifact to dist/stephen-strange-architecture.html
bun run build:demos

# Start the compiler HTTP service (http://localhost:4321)
bun run dev
```

## HTTP Service Endpoints

- `GET /` — Serves the compiled interactive demo canvas.
- `GET /health` — Health check.
- `GET /presets` — Lists built-in preset architecture specs.
- `POST /render` — Compiles `{ "spec": LivingArchitectureSpec }` into a standalone `.html` response.
- `POST /scenes/add` — Applies a `WhiteboardDiffPayload` or natural-language `instruction` to a spec and returns the updated spec + compiled HTML.
