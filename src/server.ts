import { compileLivingArchitectureHtml } from './compiler/bundler';
import { applyWhiteboardDiff } from './ideation';
import { DEFAULT_STARTER_SPEC, PRESET_SPECS } from './presets';
import {
  generateArchitectureFromPrompt,
  refactorArchitectureWithAgent,
  exportSvgAndThreeJsArtifacts,
  type GeminiModelTier,
} from './llm';
import { validateRenderedHtmlInBrowser } from './validator-browser';
import { renderStudioPageHtml } from './studio';
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
        return Response.json(
          {
            status: 'ok',
            service: 'living-architecture-canvas',
            version: '3.8',
            models: { baseline: 'gemini-3.8-flash', heavyLift: 'gemini-4-argon' },
          },
          { headers: corsHeaders }
        );
      }

      if (url.pathname === '/presets' && req.method === 'GET') {
        const name = url.searchParams.get('name');
        if (name && PRESET_SPECS[name]) {
          const spec = PRESET_SPECS[name];
          const compiled = await compileLivingArchitectureHtml(spec);
          return Response.json(
            { presets: Object.keys(PRESET_SPECS), spec, html: compiled.html },
            { headers: corsHeaders }
          );
        }
        return Response.json(
          { presets: Object.keys(PRESET_SPECS), defaultSpec: DEFAULT_STARTER_SPEC },
          { headers: corsHeaders }
        );
      }

      if (url.pathname === '/render' && req.method === 'POST') {
        try {
          const body = (await req.json()) as { spec?: LivingArchitectureSpec };
          const spec = body.spec || DEFAULT_STARTER_SPEC;
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
          const mutated = applyWhiteboardDiff(body.spec || DEFAULT_STARTER_SPEC, body.diff);
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

      if (url.pathname === '/api/generate' && req.method === 'POST') {
        try {
          const body = (await req.json()) as {
            prompt: string;
            images?: Array<{ mimeType: string; dataBase64: string; name?: string }>;
            model?: GeminiModelTier;
            apiKey?: string;
          };
          const generated = await generateArchitectureFromPrompt(body);
          const compiled = await compileLivingArchitectureHtml(generated.spec);
          const exports3d = exportSvgAndThreeJsArtifacts(generated.spec);
          return Response.json(
            {
              engine: generated.engine,
              summary: generated.summary,
              spec: generated.spec,
              html: compiled.html,
              svg: exports3d.svg,
              threeJsSceneJson: exports3d.threeJsSceneJson,
            },
            { headers: corsHeaders }
          );
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      if (url.pathname === '/api/refactor' && req.method === 'POST') {
        try {
          const body = (await req.json()) as {
            spec: LivingArchitectureSpec;
            diff?: WhiteboardDiffPayload;
            prompt?: string;
            images?: Array<{ mimeType: string; dataBase64: string; name?: string }>;
            model?: GeminiModelTier;
            apiKey?: string;
          };
          const refactored = await refactorArchitectureWithAgent(body);
          const compiled = await compileLivingArchitectureHtml(refactored.spec);
          return Response.json(
            {
              engine: refactored.engine,
              summary: refactored.summary,
              appliedCount: refactored.appliedCount,
              ignoredOperations: refactored.ignoredOperations,
              spec: refactored.spec,
              html: compiled.html,
            },
            { headers: corsHeaders }
          );
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      if (url.pathname === '/api/export-3d' && req.method === 'POST') {
        try {
          const body = (await req.json()) as { spec?: LivingArchitectureSpec };
          const spec = body.spec || DEFAULT_STARTER_SPEC;
          const out = exportSvgAndThreeJsArtifacts(spec);
          return Response.json(out, { headers: corsHeaders });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      if (url.pathname === '/api/validate-render' && req.method === 'POST') {
        try {
          const body = (await req.json()) as {
            html?: string;
            spec?: LivingArchitectureSpec;
            captureScreenshot?: boolean;
          };
          const spec = body.spec || DEFAULT_STARTER_SPEC;
          const html = body.html || (await compileLivingArchitectureHtml(spec)).html;
          const report = await validateRenderedHtmlInBrowser(
            html,
            spec,
            body.captureScreenshot !== false
          );
          return Response.json(report, { headers: corsHeaders });
        } catch (err: any) {
          return Response.json({ error: err.message }, { status: 400, headers: corsHeaders });
        }
      }

      const { html: compiledStarterHtml } = await compileLivingArchitectureHtml(DEFAULT_STARTER_SPEC);

      if (url.pathname === '/canvas' || url.searchParams.get('raw') === '1') {
        return new Response(compiledStarterHtml, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Default GET / serves the Living Architecture Studio starting on the clean Blank Starter Canvas
      const studioHtml = renderStudioPageHtml(DEFAULT_STARTER_SPEC, compiledStarterHtml);
      return new Response(studioHtml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    },
  });
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 4321);
  const srv = createCompilerService(port);
  console.log(`Living Architecture Canvas Studio & Service listening on http://localhost:${srv.port}`);
}
