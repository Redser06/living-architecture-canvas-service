import type { LivingArchitectureSpec } from './schema';
import { resolveGoogleApiKey } from './llm';

export function renderStudioPageHtml(initialSpec: LivingArchitectureSpec, initialCompiledHtml: string): string {
  const hasApiKey = Boolean(resolveGoogleApiKey());
  const escapedInitialHtml = JSON.stringify(initialCompiledHtml).replace(/<\//g, '<\\/');
  const escapedInitialSpec = JSON.stringify(initialSpec, null, 2).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Living Architecture Studio — Interactive HTML, 2D/3D & Agent Refactoring</title>
  <style>
    :root {
      --bg-canvas: #F8F7F4;
      --grid-dot: #E6E4DD;
      --surface-card: #FFFFFF;
      --border-subtle: #E2E0D8;
      --border-strong: #C8C4B8;
      --ink-primary: #141413;
      --ink-secondary: #686763;
      --ink-muted: #9E9D99;
      --accent-flow: #1D4ED8;
      --accent-pulse: #EA580C;
      --accent-storage: #15803D;
      --accent-actor: #6D28D9;
      --accent-error: #B91C1C;
      --font-sans: "Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-canvas);
      background-image: radial-gradient(var(--grid-dot) 1.25px, transparent 1.25px);
      background-size: 20px 20px;
      color: var(--ink-primary);
      font-family: var(--font-sans);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Studio Top Navigation */
    #studio-nav {
      min-height: 56px;
      background: rgba(248, 247, 244, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 18px;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; white-space: nowrap; flex-shrink: 0; }
    .nav-logo {
      width: 26px; height: 26px; border-radius: 6px;
      background: var(--ink-primary); color: #FFF;
      display: inline-flex; align-items: center; justify-content: center;
      font-family: var(--font-mono); font-size: 12px; font-weight: 700;
    }
    .nav-title { font-size: 14.5px; font-weight: 650; letter-spacing: -0.02em; }
    .nav-badge {
      font-family: var(--font-mono); font-size: 10px; padding: 3px 8px;
      border-radius: 99px; background: #E0E7FF; color: var(--accent-flow); font-weight: 600;
      white-space: nowrap;
    }
    .nav-controls { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
    .btn {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      color: var(--ink-primary);
      font-family: var(--font-sans);
      font-size: 12px; font-weight: 550;
      padding: 6px 10px; border-radius: 6px;
      cursor: pointer; transition: all 0.15s ease;
      display: inline-flex; align-items: center; gap: 5px;
      white-space: nowrap; flex-shrink: 0;
    }
    .btn:hover { border-color: var(--ink-secondary); }
    .btn.active { background: var(--ink-primary); color: #FFF; border-color: var(--ink-primary); }
    .btn-primary { background: var(--accent-flow); color: #FFF; border-color: var(--accent-flow); }
    .btn-primary:hover { background: #1E40AF; }
    .btn-orange { background: var(--accent-pulse); color: #FFF; border-color: var(--accent-pulse); }
    .select-input {
      background: var(--surface-card); border: 1px solid var(--border-subtle);
      padding: 6px 10px; border-radius: 6px; font-size: 12.5px; font-family: var(--font-sans);
      color: var(--ink-primary); font-weight: 500;
    }

    /* Views */
    .studio-view { display: none; }
    .studio-view.active { display: block; }

    /* Landing Page View */
    .landing-container {
      max-width: 1280px; margin: 0 auto; padding: 48px 28px 80px;
    }
    .hero-grid {
      display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 36px; align-items: center;
    }
    .kicker {
      font-family: var(--font-mono); font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-flow);
    }
    .hero-title {
      font-size: 42px; font-weight: 700; letter-spacing: -0.03em;
      line-height: 1.12; margin-top: 12px; color: var(--ink-primary);
    }
    .hero-subtitle {
      font-size: 16.5px; color: var(--ink-secondary); line-height: 1.55; margin-top: 16px;
    }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
    .feature-matrix {
      background: var(--surface-card); border: 1px solid var(--border-subtle);
      border-radius: 12px; padding: 24px; box-shadow: 0 8px 24px rgba(20,20,19,0.05);
    }
    .matrix-row {
      padding: 12px 0; border-bottom: 1px solid var(--border-subtle);
      display: flex; align-items: flex-start; gap: 12px;
    }
    .matrix-row:last-child { border-bottom: none; padding-bottom: 0; }
    .matrix-dot {
      width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; background: #F2F0E8;
    }
    .section-heading {
      margin-top: 56px; margin-bottom: 20px;
      display: flex; align-items: baseline; justify-content: space-between;
    }
    .preset-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .preset-card {
      background: var(--surface-card); border: 1px solid var(--border-subtle);
      border-radius: 10px; padding: 22px; cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .preset-card:hover {
      transform: translateY(-3px); border-color: var(--accent-flow);
      box-shadow: 0 12px 28px rgba(20, 20, 19, 0.08);
    }
    .preset-card h3 { font-size: 16.5px; margin-top: 8px; letter-spacing: -0.02em; }
    .preset-card p { font-size: 13px; color: var(--ink-secondary); margin-top: 8px; line-height: 1.45; }
    .preset-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 16px; }
    .tag {
      font-family: var(--font-mono); font-size: 10px; padding: 3px 7px;
      border-radius: 4px; background: #F2F0E8; color: var(--ink-secondary); font-weight: 600;
    }

    /* Studio Workbench Split Layout */
    #view-workbench.active {
      display: grid;
      grid-template-columns: 400px 1fr;
      height: calc(100vh - 60px);
      overflow: hidden;
    }
    /* Left Sidebar: Chat & Multimodal Prompting */
    .chat-sidebar {
      background: var(--surface-card);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .sidebar-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex; align-items: center; justify-content: space-between;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .msg {
      padding: 11px 14px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.45;
      border: 1px solid var(--border-subtle);
    }
    .msg.agent { background: #F8F7F4; color: var(--ink-primary); }
    .msg.user { background: #EFF6FF; border-color: #BFDBFE; color: #1E3A8A; align-self: flex-end; max-width: 92%; }
    .msg-meta {
      font-family: var(--font-mono); font-size: 10px; color: var(--ink-secondary);
      text-transform: uppercase; margin-bottom: 4px; font-weight: 600;
    }
    /* Direct HTML Diff Queue Box */
    #html-diff-queue-box {
      margin: 0 14px 10px;
      padding: 10px 12px;
      background: #FFFBEB;
      border: 1px solid #F59E0B;
      border-radius: 8px;
      display: none;
    }
    #html-diff-queue-box.visible { display: block; }
    .diff-list {
      font-family: var(--font-mono); font-size: 11px; color: #92400E;
      max-height: 76px; overflow-y: auto; margin: 6px 0 8px;
    }
    /* Composer Area */
    .chat-composer {
      padding: 12px 14px 16px;
      border-top: 1px solid var(--border-subtle);
      background: #FAF9F6;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chip-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
    .chip {
      font-family: var(--font-mono); font-size: 10px; padding: 4px 8px;
      border-radius: 4px; background: var(--surface-card); border: 1px solid var(--border-subtle);
      cursor: pointer; white-space: nowrap; color: var(--ink-secondary);
    }
    .chip:hover { border-color: var(--accent-flow); color: var(--accent-flow); }
    .upload-strip {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .thumb-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: #E0E7FF; color: #1E40AF; padding: 3px 8px;
      border-radius: 6px; font-size: 11px; font-family: var(--font-mono);
    }
    .thumb-pill img { width: 22px; height: 22px; object-fit: cover; border-radius: 3px; }
    #chat-prompt-input {
      width: 100%; min-height: 68px; max-height: 130px; resize: vertical;
      padding: 10px; border-radius: 6px; border: 1px solid var(--border-strong);
      font-family: var(--font-sans); font-size: 13px; background: var(--surface-card);
    }
    .composer-buttons { display: flex; gap: 8px; justify-content: space-between; }

    /* Right Workspace Area */
    .workspace-main {
      display: flex; flex-direction: column; height: 100%; overflow: hidden;
    }
    .workspace-tabs {
      height: 48px; background: var(--surface-card);
      border-bottom: 1px solid var(--border-subtle);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 18px;
    }
    .tab-group { display: flex; gap: 6px; }
    .workspace-panel {
      display: none; flex: 1; height: calc(100% - 48px); overflow: auto; position: relative;
    }
    .workspace-panel.active { display: flex; flex-direction: column; }
    #artifact-iframe, #threejs-iframe {
      width: 100%; height: 100%; border: none; flex: 1; background: var(--bg-canvas);
    }
    .code-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 18px; height: 100%;
    }
    .code-col { display: flex; flex-direction: column; height: 100%; }
    .code-textarea {
      flex: 1; width: 100%; margin-top: 8px; padding: 12px;
      font-family: var(--font-mono); font-size: 12px; line-height: 1.45;
      background: #141413; color: #F8F7F4; border: 1px solid var(--border-strong);
      border-radius: 8px; resize: none;
    }
    /* Validation Panel */
    .validation-container { padding: 24px; max-width: 1100px; margin: 0 auto; width: 100%; }
    .check-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
    .check-card {
      background: var(--surface-card); border: 1px solid var(--border-subtle);
      padding: 12px 14px; border-radius: 8px; display: flex; gap: 10px; align-items: flex-start;
    }
    .check-card.pass { border-left: 4px solid var(--accent-storage); }
    .check-card.fail { border-left: 4px solid var(--accent-error); }
    .screenshot-frame {
      margin-top: 20px; background: var(--surface-card); border: 1px solid var(--border-strong);
      border-radius: 10px; padding: 14px; box-shadow: 0 12px 28px rgba(20,20,19,0.08);
    }
    .screenshot-frame img { width: 100%; border-radius: 6px; border: 1px solid var(--border-subtle); }
  </style>
</head>
<body>
  <header id="studio-nav">
    <div class="nav-brand">
      <span class="nav-logo">LA</span>
      <span class="nav-title">Living Architecture Canvas</span>
      <span class="nav-badge" id="llm-status-badge">${hasApiKey ? '● Gemini 3.8 Flash / 4 Argon Ready' : '● Deterministic AST + Gemini 3.8 / 4 Argon'}</span>
    </div>
    <div class="nav-controls">
      <button id="nav-btn-landing" class="btn">🏛️ Landing Overview</button>
      <button id="nav-btn-workbench" class="btn active">⚡ Studio Workbench</button>
      <select id="model-selector" class="select-input" title="Select Gemini Model Tier">
        <option value="gemini-3.8-flash">Model: ⚡ Gemini 3.8 Flash (Baseline)</option>
        <option value="gemini-4-argon">Model: 🧠 Gemini 4 Argon (Heavy Lift)</option>
      </select>
      <select id="preset-selector" class="select-input" title="Start From Scratch or Load Blueprint">
        <option value="blank-starter">Canvas: Blank Starter (From Scratch)</option>
        <option value="payment-gateway-blueprint">Blueprint: Omnichannel Payment & Risk Mesh</option>
        <option value="agentic-interop-blueprint">Blueprint: Multi-Agent MCP & Knowledge Interop</option>
      </select>
      <button id="btn-download-html" class="btn btn-primary">⬇ Download Self-Contained .HTML</button>
    </div>
  </header>

  <!-- VIEW 1: LANDING PAGE -->
  <section id="view-landing" class="studio-view">
    <div class="landing-container">
      <div class="hero-grid">
        <div>
          <div class="kicker">EDITORIAL ARCHITECTURAL · ZERO-DEPENDENCY HTML ARTIFACTS</div>
          <h1 class="hero-title">Prompt with text or sketches. Articulate data flows in 2D & 3D. Annotate directly on the HTML to refactor.</h1>
          <p class="hero-subtitle">
            Turn rough system ideas, whiteboard photos, and cross-platform specs into self-contained interactive HTML pages. Trace live packets across access points, switch between 2D SVG, 2.5D Isometric, and 3D WebGL/Three.js, edit or annotate directly on the rendered page, and let the agent refactor the architecture in seconds.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="window.switchStudioView('workbench')">Launch Interactive Workbench →</button>
            <button class="btn btn-orange" onclick="window.switchStudioView('workbench'); document.getElementById('btn-sample-sketch').click();">🧪 Try Sketch Image + Prompt Demo</button>
            <button class="btn" onclick="window.switchStudioView('workbench'); window.switchWorkspaceTab('validation'); document.getElementById('btn-run-validation').click();">📸 Run Browser & Screenshot Validation</button>
          </div>
        </div>
        <div class="feature-matrix">
          <div class="kicker" style="margin-bottom: 8px;">END-TO-END CAPABILITY LOOP</div>
          <div class="matrix-row">
            <div class="matrix-dot">1</div>
            <div>
              <strong>Multimodal Chat & Sketch Upload</strong>
              <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:2px;">Prompt with natural language + whiteboard/diagram images. Generates strongly-typed <code>LivingArchitectureSpec</code> AST.</p>
            </div>
          </div>
          <div class="matrix-row">
            <div class="matrix-dot">2</div>
            <div>
              <strong>2D SVG, 2.5D Isometric & 3D WebGL / Three.js Outputs</strong>
              <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:2px;">Inspect data flows, protocols (REST, gRPC, Event, SQL, Webhook), access points, and 3D spatial layer conduits.</p>
            </div>
          </div>
          <div class="matrix-row">
            <div class="matrix-dot">3</div>
            <div>
              <strong>Direct In-Page HTML Annotation & Agent Refactor</strong>
              <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:2px;">Double-click node titles to edit inline, drag nodes, draw freehand edges, or drop 📌 pins directly on the HTML page—the agent picks them up and refactors the artifact.</p>
            </div>
          </div>
          <div class="matrix-row">
            <div class="matrix-dot">4</div>
            <div>
              <strong>Headless Browser & Screenshot Validation</strong>
              <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:2px;">Automated headless Chromium verification captures a pixel-accurate PNG screenshot and audits DOM, SVG splines, and 3D WebGL mounts.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section-heading">
        <div>
          <div class="kicker">START FROM SCRATCH OR BLUEPRINT</div>
          <h2 style="font-size:24px;margin-top:4px;letter-spacing:-0.02em;">Choose a starting canvas in the Studio Workbench</h2>
        </div>
      </div>

      <div class="preset-grid">
        <div class="preset-card" onclick="window.loadPresetIntoWorkbench('blank-starter')">
          <div>
            <div class="kicker">FROM SCRATCH · 3 PLANES</div>
            <h3>Blank Starter Architecture Canvas</h3>
            <p>Clean 3-layer foundation (Access Points, Service Orchestration, Data Persistence). Prompt from scratch, upload a whiteboard image, or click + Add Node directly on the HTML canvas.</p>
          </div>
          <div class="preset-tags">
            <span class="tag">FROM SCRATCH</span><span class="tag">DIRECT HTML EDIT</span><span class="tag">2D / 2.5D / 3D</span>
          </div>
        </div>

        <div class="preset-card" onclick="window.loadPresetIntoWorkbench('payment-gateway-blueprint')">
          <div>
            <div class="kicker">FINTECH & ACQUIRING · 3 SCENES</div>
            <h3>Omnichannel Payment & Real-Time Risk Mesh</h3>
            <p>SmartPOS & Web Checkout SDK access points, Zero-Trust mTLS Edge Gateway, Sub-25ms AI Fraud Scorer, Kafka Acquiring Bus, PCI-DSS Token Vault & ISO-8583 Settlement Ledger.</p>
          </div>
          <div class="preset-tags">
            <span class="tag">mTLS</span><span class="tag">gRPC RISK AI</span><span class="tag">KAFKA</span><span class="tag">ISO-8583</span>
          </div>
        </div>

        <div class="preset-card" onclick="window.loadPresetIntoWorkbench('agentic-interop-blueprint')">
          <div>
            <div class="kicker">AI PLATFORM INTEROP · 2 SCENES</div>
            <h3>Multi-Agent MCP & Knowledge Graph Interop</h3>
            <p>Collaborative prompt surfaces connected via MCP Gateway to the Architecture Synthesizer Agent (Gemini 3.8 Flash / Gemini 4 Argon), Semantic Knowledge Vault, and direct HTML diff loop.</p>
          </div>
          <div class="preset-tags">
            <span class="tag">MCP GATEWAY</span><span class="tag">GEMINI 3.8 / 4 ARGON</span><span class="tag">HTML DIFF</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- VIEW 2: STUDIO WORKBENCH (ACTIVE BY DEFAULT FOR IMMEDIATE INTERACTION) -->
  <section id="view-workbench" class="studio-view active">
    <!-- Left Sidebar: Chat + Image Upload + Direct HTML Diff Queue -->
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <div>
          <div class="kicker">MULTIMODAL ARCHITECT AGENT</div>
          <div style="font-size:13.5px;font-weight:650;">Prompt, Upload Sketch & Refactor HTML</div>
        </div>
        <button id="btn-set-apikey" class="btn" style="font-size:11px;padding:4px 8px;" title="Configure optional Gemini API key">🔑 API Key</button>
      </div>

      <div id="chat-messages" class="chat-messages">
        <div class="msg agent">
          <div class="msg-meta">SYSTEM · LIVING ARCHITECTURE COMPILER</div>
          Welcome! You can:<br/>
          1. <strong>Prompt with text or upload a diagram/whiteboard image</strong> below to generate a new interactive HTML architecture.<br/>
          2. <strong>Interact directly with the HTML page on the right</strong>: double-click any node title to edit it inline, drag nodes to reposition, use <strong>✎ Whiteboard</strong> to draw edges, or click <strong>📌 Annotate</strong> to drop notes on the page — then click <strong>✨ Refactor HTML</strong> so the agent picks up your changes!
        </div>
      </div>

      <!-- Live Queue of Direct Changes Made Against the HTML Page -->
      <div id="html-diff-queue-box">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="kicker" style="color:#B45309;">⚡ DIRECT HTML PAGE EDITS (<span id="diff-count-badge">0</span>)</span>
          <button id="btn-clear-diffs" class="btn" style="padding:2px 6px;font-size:10px;">Clear</button>
        </div>
        <div id="diff-queue-list" class="diff-list"></div>
        <button id="btn-apply-html-refactor" class="btn btn-orange" style="width:100%;justify-content:center;font-weight:600;">
          ✨ Pick Up HTML Changes & Refactor Page
        </button>
      </div>

      <div class="chat-composer">
        <div class="chip-row">
          <span class="chip" data-prompt="Add a Redis Cache between Client Access Point and Core Orchestrator API, and link Core Orchestrator API to an Audit Event Queue">+ Redis Cache & Event Queue</span>
          <span class="chip" data-prompt="Design a Global Payments merchant acquiring, AI fraud scoring, Kafka event bus, and PCI-DSS vault architecture">Build Payment & Risk Mesh</span>
          <span class="chip" data-prompt="Add an OAuth2 mTLS API Gateway and Dead-Letter Queue for failed webhook retries">+ OAuth2 Gateway & DLQ</span>
        </div>

        <div class="upload-strip">
          <label class="btn" style="padding:4px 9px;font-size:11.5px;cursor:pointer;">
            🖼️ Upload Image / Sketch
            <input id="image-upload-input" type="file" accept="image/*" multiple style="display:none;" />
          </label>
          <button id="btn-sample-sketch" class="btn" style="padding:4px 9px;font-size:11.5px;" title="Attach a sample whiteboard architecture sketch image">
            🧪 Sample Sketch Image
          </button>
          <div id="image-preview-strip" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
        </div>

        <textarea id="chat-prompt-input" placeholder="Describe your system architecture, data flows, access points, or how to refactor the annotated HTML page..."></textarea>

        <div class="composer-buttons">
          <button id="btn-chat-refactor" class="btn" style="flex:1;justify-content:center;" title="Apply prompt + direct HTML edits to current page">
            🔧 Refactor Current HTML
          </button>
          <button id="btn-chat-generate" class="btn btn-primary" style="flex:1;justify-content:center;" title="Generate a brand new interactive architecture page">
            ✨ Generate New HTML
          </button>
        </div>
      </div>
    </aside>

    <!-- Right Main Workspace -->
    <main class="workspace-main">
      <div class="workspace-tabs">
        <div class="tab-group">
          <button class="btn active" id="tab-btn-preview" onclick="window.switchWorkspaceTab('preview')">🖥️ Live HTML Renderer (2D / 2.5D / 3D)</button>
          <button class="btn" id="tab-btn-3d" onclick="window.switchWorkspaceTab('3d')">🧊 Three.js WebGL & SVG Outputs</button>
          <button class="btn" id="tab-btn-code" onclick="window.switchWorkspaceTab('code')">⚡ Code & AST Executor</button>
          <button class="btn" id="tab-btn-validation" onclick="window.switchWorkspaceTab('validation')">📸 Browser & Screenshot Validation</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="compile-metrics-pill" style="font-family:var(--font-mono);font-size:11px;color:var(--ink-secondary);">Ready · 0external deps</span>
          <a href="/canvas" target="_blank" class="btn" style="text-decoration:none;font-size:11.5px;padding:5px 10px;">↗ Open Standalone Page</a>
        </div>
      </div>

      <!-- TAB 1: Interactive HTML Renderer -->
      <div id="panel-preview" class="workspace-panel active">
        <iframe id="artifact-iframe" title="Living Architecture Interactive HTML Artifact"></iframe>
      </div>

      <!-- TAB 2: Three.js WebGL 3D Scene & SVG Vector Output -->
      <div id="panel-3d" class="workspace-panel">
        <div style="padding:12px 18px;background:#FAF9F6;border-bottom:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span class="kicker">THREE.JS WEBGL 3D MODEL & VECTOR SVG EXPORTER</span>
            <span style="font-size:12.5px;color:var(--ink-secondary);margin-left:10px;">Dedicated Three.js WebGL orbital mesh scene + standalone SVG diagram</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="btn-download-svg" class="btn">⬇ Export .SVG Diagram</button>
            <button id="btn-download-threejs" class="btn btn-primary">⬇ Export Three.js WebGL .HTML</button>
          </div>
        </div>
        <iframe id="threejs-iframe" title="Three.js 3D WebGL Architecture Model"></iframe>
      </div>

      <!-- TAB 3: Code Execution & AST Editor -->
      <div id="panel-code" class="workspace-panel">
        <div class="code-grid">
          <div class="code-col">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div class="kicker">DECLARATIVE GRAPH AST</div>
                <strong style="font-size:13.5px;">LivingArchitectureSpec JSON</strong>
              </div>
              <button id="btn-exec-spec" class="btn btn-primary">▶ Compile & Execute Spec</button>
            </div>
            <textarea id="spec-json-editor" class="code-textarea" spellcheck="false"></textarea>
          </div>
          <div class="code-col">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div class="kicker">SELF-CONTAINED ARTIFACT SOURCE</div>
                <strong style="font-size:13.5px;">Compiled HTML / SVG / WebGL Runtime</strong>
              </div>
              <button id="btn-exec-raw-html" class="btn btn-orange">▶ Execute Edited HTML Live</button>
            </div>
            <textarea id="raw-html-editor" class="code-textarea" spellcheck="false"></textarea>
          </div>
        </div>
      </div>

      <!-- TAB 4: Headless Browser & Screenshot Validation -->
      <div id="panel-validation" class="workspace-panel">
        <div class="validation-container">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div class="kicker">AUTOMATED VISUAL & DOM QA GATE</div>
              <h2 style="font-size:20px;margin-top:4px;">Headless Chromium Browser & Screenshot Validation</h2>
              <p style="font-size:13px;color:var(--ink-secondary);margin-top:2px;">Renders the compiled HTML artifact in headless Chrome, captures a 1440×900 PNG screenshot, and verifies DOM nodes, SVG splines, and 3D WebGL mounts.</p>
            </div>
            <button id="btn-run-validation" class="btn btn-primary">📸 Run Browser & Screenshot Validation</button>
          </div>
          <div id="validation-results-box" style="margin-top:18px;">
            <div style="padding:20px;background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:8px;color:var(--ink-secondary);font-size:13px;">
              Click <strong>"📸 Run Browser & Screenshot Validation"</strong> to launch headless Chromium and inspect the rendered screenshot + verification checklist.
            </div>
          </div>
        </div>
      </div>
    </main>
  </section>

  <!-- Embedded Initial Spec for Studio Boot + Backward Compatibility -->
  <script id="studio-initial-spec" type="application/json">${escapedInitialSpec}</script>
  <script>
    (function() {
      let currentSpec = JSON.parse(document.getElementById('studio-initial-spec').textContent);
      let currentHtml = ${escapedInitialHtml};
      let queuedHtmlOps = [];
      let uploadedImages = [];
      let customApiKey = '';

      const iframe = document.getElementById('artifact-iframe');
      const threeIframe = document.getElementById('threejs-iframe');
      const specEditor = document.getElementById('spec-json-editor');
      const htmlEditor = document.getElementById('raw-html-editor');
      const chatMessages = document.getElementById('chat-messages');
      const diffBox = document.getElementById('html-diff-queue-box');
      const diffCountBadge = document.getElementById('diff-count-badge');
      const diffList = document.getElementById('diff-queue-list');
      const metricsPill = document.getElementById('compile-metrics-pill');

      function appendChatMessage(role, htmlContent, metaLabel) {
        const div = document.createElement('div');
        div.className = 'msg ' + role;
        div.innerHTML = '<div class="msg-meta">' + (metaLabel || (role === 'user' ? 'YOU' : 'ARCHITECT AGENT')) + '</div><div>' + htmlContent + '</div>';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      function updateArtifactViews(spec, html) {
        currentSpec = spec;
        currentHtml = html;
        iframe.srcdoc = html;
        specEditor.value = JSON.stringify(spec, null, 2);
        htmlEditor.value = html;
        const kb = (new Blob([html]).size / 1024).toFixed(1);
        metricsPill.textContent = spec.nodes.length + ' nodes · ' + spec.edges.length + ' edges · ' + kb + ' KB HTML';
      }

      function renderDiffQueue() {
        diffCountBadge.textContent = String(queuedHtmlOps.length);
        if (queuedHtmlOps.length === 0) {
          diffBox.classList.remove('visible');
          diffList.innerHTML = '';
          return;
        }
        diffBox.classList.add('visible');
        diffList.innerHTML = queuedHtmlOps.map((op, idx) => {
          if (op.action === 'UPDATE_NODE') return (idx + 1) + '. [INLINE EDIT] Node "' + op.nodeId + '" → "' + op.label + '"';
          if (op.action === 'MOVE_NODE') return (idx + 1) + '. [DRAG MOVE] Node "' + op.nodeId + '" → (' + op.x + ', ' + op.y + ')';
          if (op.action === 'ADD_PIN_NOTE') return (idx + 1) + '. [📌 PIN NOTE] "' + op.text + '" at (' + op.x + ', ' + op.y + ')';
          if (op.action === 'ANNOTATE_NODE') return (idx + 1) + '. [NODE NOTE] ' + op.nodeId + ': "' + op.note + '"';
          if (op.action === 'ADD_EDGE') return (idx + 1) + '. [DRAWN EDGE] ' + op.from + ' → ' + op.to;
          if (op.action === 'ADD_NODE') return (idx + 1) + '. [SKETCH NODE] "' + op.label + '" on ' + op.planeId;
          return (idx + 1) + '. ' + op.action;
        }).join('<br/>');
      }

      // Listen for direct HTML edits & annotations coming from inside the compiled artifact iframe
      window.addEventListener('message', (ev) => {
        const data = ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'LIVING_ARCH_OP_QUEUED') {
          if (data.spec) currentSpec = data.spec;
          queuedHtmlOps = data.operations || [...queuedHtmlOps, data.op];
          renderDiffQueue();
        } else if (data.type === 'LIVING_ARCH_REFACTOR_REQUEST') {
          if (data.spec) currentSpec = data.spec;
          if (Array.isArray(data.operations)) queuedHtmlOps = data.operations;
          triggerAgentRefactor();
        }
      });

      window.switchStudioView = function(view) {
        document.getElementById('view-landing').classList.toggle('active', view === 'landing');
        document.getElementById('view-workbench').classList.toggle('active', view === 'workbench');
        document.getElementById('nav-btn-landing').classList.toggle('active', view === 'landing');
        document.getElementById('nav-btn-workbench').classList.toggle('active', view === 'workbench');
      };

      window.switchWorkspaceTab = async function(tab) {
        ['preview', '3d', 'code', 'validation'].forEach((t) => {
          document.getElementById('panel-' + t).classList.toggle('active', t === tab);
          document.getElementById('tab-btn-' + t).classList.toggle('active', t === tab);
        });
        if (tab === '3d') {
          const res = await fetch('/api/export-3d', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec: currentSpec }),
          }).then((r) => r.json());
          if (res.threeJsHtml) threeIframe.srcdoc = res.threeJsHtml;
          window.__lastExport3D = res;
        }
      };

      window.loadPresetIntoWorkbench = async function(presetKey) {
        document.getElementById('preset-selector').value = presetKey;
        window.switchStudioView('workbench');
        window.switchWorkspaceTab('preview');
        const res = await fetch('/presets?name=' + encodeURIComponent(presetKey)).then((r) => r.json());
        if (res.spec && res.html) {
          queuedHtmlOps = [];
          renderDiffQueue();
          updateArtifactViews(res.spec, res.html);
          appendChatMessage('agent', 'Loaded preset <strong>' + res.spec.meta.title + '</strong> (' + res.spec.nodes.length + ' nodes, ' + res.spec.edges.length + ' edges). Try toggling <strong>2D SVG</strong>, <strong>2.5D Isometric Stack</strong>, or <strong>3D WebGL / Three.js</strong>!', 'PRESET LOADER');
        }
      };

      document.getElementById('nav-btn-landing').addEventListener('click', () => window.switchStudioView('landing'));
      document.getElementById('nav-btn-workbench').addEventListener('click', () => window.switchStudioView('workbench'));
      document.getElementById('preset-selector').addEventListener('change', (e) => window.loadPresetIntoWorkbench(e.target.value));

      // Quick chips
      document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          document.getElementById('chat-prompt-input').value = chip.getAttribute('data-prompt') || '';
        });
      });

      // Image upload handling
      function renderImagePreviews() {
        const strip = document.getElementById('image-preview-strip');
        strip.innerHTML = uploadedImages.map((img, i) =>
          '<span class="thumb-pill"><img src="' + img.dataBase64 + '"/>' + (img.name || 'sketch') + ' <b style="cursor:pointer" data-rm="' + i + '">×</b></span>'
        ).join('');
        strip.querySelectorAll('[data-rm]').forEach((el) => {
          el.addEventListener('click', () => {
            uploadedImages.splice(Number(el.getAttribute('data-rm')), 1);
            renderImagePreviews();
          });
        });
      }

      document.getElementById('image-upload-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            uploadedImages.push({ mimeType: file.type || 'image/png', dataBase64: String(reader.result), name: file.name });
            renderImagePreviews();
          };
          reader.readAsDataURL(file);
        });
      });

      // Generate a synthetic whiteboard sketch PNG on canvas for 1-click multimodal testing
      document.getElementById('btn-sample-sketch').addEventListener('click', () => {
        const c = document.createElement('canvas');
        c.width = 480; c.height = 260;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFDF9'; ctx.fillRect(0, 0, 480, 260);
        ctx.strokeStyle = '#1D4ED8'; ctx.lineWidth = 3;
        ctx.strokeRect(24, 80, 110, 65); ctx.strokeRect(185, 80, 110, 65); ctx.strokeRect(345, 80, 110, 65);
        ctx.fillStyle = '#141413'; ctx.font = 'bold 13px monospace';
        ctx.fillText('POS / Web SDK', 34, 115); ctx.fillText('AI Risk Gateway', 192, 115); ctx.fillText('Kafka & Vault', 355, 115);
        ctx.strokeStyle = '#EA580C'; ctx.beginPath(); ctx.moveTo(134, 112); ctx.lineTo(185, 112); ctx.moveTo(295, 112); ctx.lineTo(345, 112); ctx.stroke();
        const dataUrl = c.toDataURL('image/png');
        uploadedImages.push({ mimeType: 'image/png', dataBase64: dataUrl, name: 'whiteboard-sketch.png' });
        renderImagePreviews();
        const input = document.getElementById('chat-prompt-input');
        if (!input.value.trim()) {
          input.value = 'Convert this whiteboard sketch into a Global Payments acquiring & AI fraud scoring architecture with mTLS access points and Kafka event streams.';
        }
      });

      // Generate New Architecture from Prompt + Images
      document.getElementById('btn-chat-generate').addEventListener('click', async () => {
        const promptEl = document.getElementById('chat-prompt-input');
        const prompt = promptEl.value.trim();
        if (!prompt && uploadedImages.length === 0) return;
        appendChatMessage('user', (prompt || '(Image Sketch Upload)') + (uploadedImages.length ? ' <br/><em>[' + uploadedImages.length + ' image(s) attached]</em>' : ''));
        promptEl.value = '';
        const imgs = [...uploadedImages];
        uploadedImages = [];
        renderImagePreviews();

        const selectedModel = document.getElementById('model-selector').value || 'gemini-3.8-flash';
        appendChatMessage('agent', 'Synthesizing architecture spec (' + selectedModel + ') & compiling 2D/2.5D/3D HTML artifact...', 'WORKING');
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, images: imgs, model: selectedModel, apiKey: customApiKey }),
        }).then((r) => r.json());

        if (res.spec && res.html) {
          queuedHtmlOps = [];
          renderDiffQueue();
          updateArtifactViews(res.spec, res.html);
          window.switchWorkspaceTab('preview');
          appendChatMessage('agent', '<strong>' + res.summary + '</strong><br/>Engine: <code>' + res.engine + '</code>. Click any node on the canvas to inspect payloads, double-click titles to edit inline, or switch to <strong>3D WebGL</strong>!', 'COMPILED');
        } else {
          appendChatMessage('agent', 'Error: ' + (res.error || 'Failed to generate'), 'ERROR');
        }
      });

      // Refactor Current HTML Page with Direct Edits + Annotations + Prompt
      async function triggerAgentRefactor() {
        const promptEl = document.getElementById('chat-prompt-input');
        const prompt = promptEl.value.trim();
        const opsToApply = [...queuedHtmlOps];
        if (!prompt && opsToApply.length === 0 && uploadedImages.length === 0) {
          appendChatMessage('agent', 'Tip: Double-click a node title on the HTML page, drag a node, draw with ✎ Whiteboard, drop a 📌 Annotate pin, or type a refactor instruction first!', 'INFO');
          return;
        }
        appendChatMessage(
          'user',
          (prompt ? prompt + '<br/>' : '') +
            (opsToApply.length ? '<code>+ ' + opsToApply.length + ' direct HTML page edit(s)/annotation(s)</code>' : '')
        );
        promptEl.value = '';
        queuedHtmlOps = [];
        renderDiffQueue();

        const selectedModel = document.getElementById('model-selector').value || 'gemini-3.8-flash';
        const res = await fetch('/api/refactor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spec: currentSpec,
            prompt,
            images: uploadedImages,
            model: selectedModel,
            diff: { timestamp: new Date().toISOString(), instruction: prompt, operations: opsToApply },
            apiKey: customApiKey,
          }),
        }).then((r) => r.json());

        uploadedImages = [];
        renderImagePreviews();

        if (res.spec && res.html) {
          updateArtifactViews(res.spec, res.html);
          window.switchWorkspaceTab('preview');
          appendChatMessage('agent', '<strong>' + res.summary + '</strong><br/>Engine: <code>' + res.engine + '</code>', 'REFACTORED HTML');
        } else {
          appendChatMessage('agent', 'Refactor error: ' + (res.error || 'Unknown'), 'ERROR');
        }
      }

      document.getElementById('btn-chat-refactor').addEventListener('click', triggerAgentRefactor);
      document.getElementById('btn-apply-html-refactor').addEventListener('click', triggerAgentRefactor);
      document.getElementById('btn-clear-diffs').addEventListener('click', () => {
        queuedHtmlOps = [];
        renderDiffQueue();
      });

      // Code Execution Tab Handlers
      document.getElementById('btn-exec-spec').addEventListener('click', async () => {
        try {
          const editedSpec = JSON.parse(specEditor.value);
          const res = await fetch('/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spec: editedSpec }),
          });
          if (!res.ok) {
            const err = await res.json();
            alert('Spec Validation Error: ' + err.error);
            return;
          }
          const html = await res.text();
          updateArtifactViews(editedSpec, html);
          window.switchWorkspaceTab('preview');
          appendChatMessage('agent', 'Compiled and executed updated <code>LivingArchitectureSpec</code> JSON AST in live renderer.', 'CODE EXECUTOR');
        } catch (e) {
          alert('Invalid JSON in Spec Editor: ' + e.message);
        }
      });

      document.getElementById('btn-exec-raw-html').addEventListener('click', () => {
        currentHtml = htmlEditor.value;
        iframe.srcdoc = currentHtml;
        window.switchWorkspaceTab('preview');
        appendChatMessage('agent', 'Executed custom edited HTML source directly in the live preview sandbox.', 'HTML EXECUTOR');
      });

      // Browser & Screenshot Validation Handler
      document.getElementById('btn-run-validation').addEventListener('click', async () => {
        const box = document.getElementById('validation-results-box');
        box.innerHTML = '<div style="padding:20px;background:#FFF;border:1px solid var(--border-subtle);border-radius:8px;">Launching Headless Chromium & verifying DOM, SVG splines, and 3D WebGL canvas...</div>';
        const res = await fetch('/api/validate-render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html: currentHtml, spec: currentSpec }),
        }).then((r) => r.json());

        const checksHtml = (res.checks || []).map((c) =>
          '<div class="check-card ' + (c.passed ? 'pass' : 'fail') + '">' +
            '<span style="font-size:16px;">' + (c.passed ? '✅' : '❌') + '</span>' +
            '<div><strong style="font-size:13px;">' + c.label + '</strong><div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">' + c.detail + '</div></div>' +
          '</div>'
        ).join('');

        const shotHtml = res.screenshotDataUrl
          ? '<div class="screenshot-frame"><div class="kicker" style="margin-bottom:8px;">CAPTURED HEADLESS BROWSER SCREENSHOT (' + res.engine.toUpperCase() + ' · ' + res.metrics.renderTimeMs + 'ms)</div><img src="' + res.screenshotDataUrl + '" alt="Validated Artifact Screenshot" /></div>'
          : '';

        box.innerHTML =
          '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">' +
            '<span class="nav-badge" style="background:' + (res.valid ? '#DCFCE7;color:#15803D' : '#FEE2E2;color:#B91C1C') + '">' + (res.valid ? '✓ ALL BROWSER CHECKS PASSED' : '⚠ ISSUES DETECTED') + '</span>' +
            '<span style="font-family:var(--font-mono);font-size:11.5px;color:var(--ink-secondary);">Engine: ' + res.engine + ' · Size: ' + (res.metrics.htmlBytes / 1024).toFixed(1) + ' KB · Nodes: ' + res.metrics.nodeCount + ' · Edges: ' + res.metrics.edgeCount + '</span>' +
          '</div>' +
          '<div class="check-grid">' + checksHtml + '</div>' +
          shotHtml;
      });

      // Download handlers
      function downloadFile(filename, content, mime) {
        const blob = new Blob([content], { type: mime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      }

      document.getElementById('btn-download-html').addEventListener('click', () => {
        const slug = (currentSpec.meta?.title || 'architecture').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        downloadFile(slug + '-living-canvas.html', currentHtml, 'text/html;charset=utf-8');
      });

      document.getElementById('btn-download-svg').addEventListener('click', () => {
        if (window.__lastExport3D?.svg) {
          downloadFile('architecture-diagram.svg', window.__lastExport3D.svg, 'image/svg+xml;charset=utf-8');
        }
      });

      document.getElementById('btn-download-threejs').addEventListener('click', () => {
        if (window.__lastExport3D?.threeJsHtml) {
          downloadFile('architecture-threejs-3d.html', window.__lastExport3D.threeJsHtml, 'text/html;charset=utf-8');
        }
      });

      document.getElementById('btn-set-apikey').addEventListener('click', () => {
        const k = window.prompt('Enter Google Gemini API Key (leave blank to use server environment key):', customApiKey);
        if (k !== null) {
          customApiKey = k.trim();
          document.getElementById('llm-status-badge').textContent = customApiKey ? '● Custom Gemini Key Active' : '● Server Default LLM Ready';
        }
      });

      // Boot initial views
      updateArtifactViews(currentSpec, currentHtml);
    })();
  </script>
</body>
</html>`;
}
