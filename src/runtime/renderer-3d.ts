// Chunk 13: src/runtime/renderer-3d.ts (<= 85 lines)
import type { CanvasRuntimeState } from './store';

const KIND_HEX: Record<string, string> = {
  actor: '#6D28D9', platform: '#1D4ED8', service: '#0F766E',
  agent: '#EA580C', database: '#15803D', document: '#B45309', queue: '#BE185D',
};

export function start3DRenderer(
  canvas: HTMLCanvasElement,
  getState: () => CanvasRuntimeState,
  setState: (p: Partial<CanvasRuntimeState>) => void
): void {
  let dragging = false, lx = 0, ly = 0;
  let projectedBoxes: Array<{ id: string; x: number; y: number; r: number }> = [];

  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging || getState().viewMode !== '3d-webgl') return;
    const s = getState();
    setState({ orbitYaw: s.orbitYaw + (e.clientX - lx) * 0.007, orbitPitch: Math.max(0.15, Math.min(1.25, s.orbitPitch + (e.clientY - ly) * 0.007)) });
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener('pointerup', (e) => {
    if (dragging && Math.hypot(e.clientX - lx, e.clientY - ly) < 4 && getState().viewMode === '3d-webgl') {
      const rect = canvas.getBoundingClientRect();
      const hit = projectedBoxes.find((b) => Math.hypot(e.clientX - rect.left - b.x, e.clientY - rect.top - b.y) <= b.r);
      if (hit) setState({ selectedItem: { type: 'node', id: hit.id } });
    }
    dragging = false;
  });

  const project = (wx: number, wy: number, wz: number, cx: number, cy: number, s: CanvasRuntimeState) => {
    const cyaw = Math.cos(s.orbitYaw), syaw = Math.sin(s.orbitYaw), cp = Math.cos(s.orbitPitch), sp = Math.sin(s.orbitPitch);
    const rx = wx * cyaw - wy * syaw, ry = wx * syaw + wy * cyaw;
    const py = ry * cp - wz * sp, pz = ry * sp + wz * cp + 950;
    const fov = (820 * s.zoom) / Math.max(220, pz);
    return { x: cx + rx * fov, y: cy + py * fov, scale: fov };
  };

  const drawFrame = (now: number) => {
    const s = getState();
    const ctx = s.viewMode === '3d-webgl' ? canvas.getContext('2d') : null;
    if (ctx) {
      const w = (canvas.width = canvas.clientWidth || 1100), h = (canvas.height = canvas.clientHeight || 680);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2 + 20, lw = s.layout.width || 1120, lh = s.layout.height || 680;
      for (const pl of s.layout.planes || []) {
        const z = (pl.elevation - 70) * 1.65;
        const c1 = project(-lw * 0.42, pl.y - lh / 2, z, cx, cy, s), c2 = project(lw * 0.42, pl.y - lh / 2, z, cx, cy, s);
        const c3 = project(lw * 0.42, pl.y + pl.height - lh / 2, z, cx, cy, s), c4 = project(-lw * 0.42, pl.y + pl.height - lh / 2, z, cx, cy, s);
        ctx.fillStyle = 'rgba(255,255,255,0.58)'; ctx.strokeStyle = '#C8C4B8'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#686763'; ctx.font = '600 10px monospace'; ctx.fillText(`${pl.label} [Z:${pl.elevation}]`, c1.x + 12, c1.y + 16);
      }
      const activeEdges = new Set((s.spec.scenes?.[s.sceneIndex]?.activeEdges || []).map((a: any) => a.edgeId));
      for (const edge of s.spec.edges || []) {
        const sn = s.layout.nodes?.[edge.source], tn = s.layout.nodes?.[edge.target];
        if (!sn || !tn) continue;
        const p1 = project(sn.x + sn.width / 2 - lw / 2, sn.y + sn.height / 2 - lh / 2, (sn.elevation - 70) * 1.65 + 18, cx, cy, s);
        const p2 = project(tn.x + tn.width / 2 - lw / 2, tn.y + tn.height / 2 - lh / 2, (tn.elevation - 70) * 1.65 + 18, cx, cy, s);
        const isAct = activeEdges.has(edge.id), mx = (p1.x + p2.x) / 2, my = Math.min(p1.y, p2.y) - 34;
        ctx.strokeStyle = isAct ? '#1D4ED8' : 'rgba(158,157,153,0.35)'; ctx.lineWidth = isAct ? 2.6 : 1.2;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(mx, my, p2.x, p2.y); ctx.stroke();
        if (isAct && s.playing) {
          const t = (now % 1800) / 1800, qx = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * mx + t * t * p2.x, qy = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * my + t * t * p2.y;
          ctx.fillStyle = '#EA580C'; ctx.beginPath(); ctx.arc(qx, qy, 5.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      projectedBoxes = [];
      for (const node of s.spec.nodes || []) {
        const pos = s.layout.nodes?.[node.id];
        if (!pos) continue;
        const top = project(pos.x + pos.width / 2 - lw / 2, pos.y + pos.height / 2 - lh / 2, (pos.elevation - 70) * 1.65 + 32, cx, cy, s);
        const bw = 96 * top.scale, bh = 36 * top.scale, color = KIND_HEX[node.kind] || '#1D4ED8';
        ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.fillRect(top.x - bw / 2, top.y - bh / 2, bw, bh); ctx.strokeRect(top.x - bw / 2, top.y - bh / 2, bw, bh);
        ctx.fillStyle = '#141413'; ctx.font = `600 ${Math.max(10, Math.round(12 * top.scale))}px sans-serif`;
        ctx.fillText(node.label.slice(0, 22), top.x - bw / 2 + 8, top.y + 4);
        projectedBoxes.push({ id: node.id, x: top.x, y: top.y, r: Math.max(bw, bh) * 0.55 });
      }
    }
    requestAnimationFrame(drawFrame);
  };
  requestAnimationFrame(drawFrame);
}
