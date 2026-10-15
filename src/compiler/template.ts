// Chunk 11: src/compiler/template.ts (<= 55 lines)
export const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{TITLE}} — Living Architecture Canvas</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <header id="topbar">
    <div class="brand-block">
      <span class="brand-title">{{TITLE}}</span>
      <span class="brand-meta">v{{VERSION}} · EDITORIAL ARCHITECTURAL · DIRECT-EDIT ENABLED</span>
    </div>
    <div class="toolbar-group">
      <button id="btn-view-2d" class="btn">2D SVG</button>
      <button id="btn-toggle-25d" class="btn">2.5D Isometric Stack</button>
      <button id="btn-view-3d" class="btn">3D WebGL / Three.js</button>
      <button id="btn-add-node" class="btn">+ Add Node</button>
      <button id="btn-toggle-wb" class="btn">✎ Connect / Draw</button>
      <button id="btn-pin-note" class="btn">📌 Annotate</button>
      <button id="btn-export-diff" class="btn">Copy Diff (0)</button>
      <button id="btn-refactor-agent" class="btn btn-accent">✨ Refactor HTML</button>
    </div>
  </header>

  <main id="viewport">
    <div id="world">
      <div id="planes-layer"></div>
      <svg id="edges-svg"></svg>
      <div id="nodes-layer"></div>
      <div id="pins-layer"></div>
      <svg id="whiteboard-svg"></svg>
    </div>
    <canvas id="webgl-canvas"></canvas>
    <div id="direct-edit-hint">Double-click node text to edit · Drag node to move · + Add Node · ✎ Connect · 📌 Annotate → ✨ Refactor HTML</div>
  </main>

  <aside id="inspector"></aside>
  <footer id="hud-bar"></footer>

  <script id="architecture-spec" type="application/json">{{SPEC_JSON}}</script>
  <script id="computed-layout" type="application/json">{{LAYOUT_JSON}}</script>
  <script>{{RUNTIME_JS}}</script>
</body>
</html>`;
