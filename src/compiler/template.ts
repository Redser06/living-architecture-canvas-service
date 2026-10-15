// Chunk 11: src/compiler/template.ts (<= 40 lines)
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
      <span class="brand-meta">v{{VERSION}} · EDITORIAL ARCHITECTURAL</span>
    </div>
    <div class="toolbar-group">
      <button id="btn-toggle-25d" class="btn">2.5D Isometric Stack</button>
      <button id="btn-toggle-wb" class="btn">✎ Whiteboard</button>
      <button id="btn-export-diff" class="btn">Copy Diff (0)</button>
    </div>
  </header>

  <main id="viewport">
    <div id="world">
      <div id="planes-layer"></div>
      <svg id="edges-svg"></svg>
      <div id="nodes-layer"></div>
      <svg id="whiteboard-svg"></svg>
    </div>
  </main>

  <aside id="inspector"></aside>
  <footer id="hud-bar"></footer>

  <script id="architecture-spec" type="application/json">{{SPEC_JSON}}</script>
  <script id="computed-layout" type="application/json">{{LAYOUT_JSON}}</script>
  <script>{{RUNTIME_JS}}</script>
</body>
</html>`;
