import { compileLivingArchitectureHtml } from './compiler/bundler';
import { applyWhiteboardDiff } from './ideation';
import { STEPHEN_STRANGE_SPEC } from './presets';
import type { LivingArchitectureSpec, WhiteboardDiffPayload } from './schema';

export function createCompilerService(port = 4321) {
  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (url.pathname === '/health') {
        return Response.json({ status: 'ok', service: 'living-architecture-canvas' }, { headers: corsHeaders });
      }

      if (url.pathname === '/presets' && req.method === 'GET') {
        return Response.json({ presets: ['stephen-strange'], defaultSpec: STEPHEN_STRANGE_SPEC }, { headers: corsHeaders });
      }

      if (url.pathname === '/render' && req.method === 'POST') {
        try {
          const body = (await req.json()) as { spec?: LivingArchitectureSpec };
          const spec = body.spec || STEPHEN_STRANGE_SPEC;
          const result = await compileLivingArchitectureHtml(spec);
          return new Response(result.html, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
          });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      if (url.pathname === '/scenes/add' && req.method === 'POST') {
        try {
          const body = (await req.json()) as {
            spec: LivingArchitectureSpec;
            diff: WhiteboardDiffPayload;
          };
          const mutated = applyWhiteboardDiff(body.spec || STEPHEN_STRANGE_SPEC, body.diff);
          const compiled = await compileLivingArchitectureHtml(mutated.spec);
          return Response.json(
            {
              appliedCount: mutated.appliedCount,
              ignoredOperations: mutated.ignoredOperations,
              spec: mutated.spec,
              html: compiled.html,
            },
            { headers: corsHeaders }
          );
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      // Default GET / serves the compiled Stephen Strange interactive artifact
      const { html } = await compileLivingArchitectureHtml(STEPHEN_STRANGE_SPEC);
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    },
  });
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 4321);
  const srv = createCompilerService(port);
  console.log(`Living Architecture Canvas service listening on http://localhost:${srv.port}`);
}
