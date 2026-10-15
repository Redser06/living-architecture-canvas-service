// Chunk 1: src/runtime/dom-utils.ts (<= 50 lines)
export function el(tag: string, attrs: Record<string, any> = {}, children: Array<Node | string> = []): HTMLElement {
  const element = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === 'className') element.className = String(v);
    else if (k === 'style' && typeof v === 'object') Object.assign(element.style, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      element.addEventListener(k.slice(2).toLowerCase(), v);
    } else element.setAttribute(k, String(v));
  }
  for (const child of children) {
    element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return element;
}

export function svgEl(tag: string, attrs: Record<string, any> = {}): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null) element.setAttribute(k, String(v));
  }
  return element;
}

export function clearChildren(node: Element | null): void {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}
