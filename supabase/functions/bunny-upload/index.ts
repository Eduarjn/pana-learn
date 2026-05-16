// supabase/functions/bunny-upload/index.ts
// Proxy seguro para a API do Bunny Stream.
// A BUNNY_API_KEY fica no servidor – nunca exposta ao browser.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BUNNY_LIBRARY_ID  = Deno.env.get("BUNNY_LIBRARY_ID")  ?? "";
const BUNNY_API_KEY     = Deno.env.get("BUNNY_API_KEY")     ?? "";
const BUNNY_CDN_HOSTNAME = Deno.env.get("BUNNY_CDN_HOSTNAME") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-action, x-video-guid, x-video-title",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
};

serve(async (req) => {
  // Pre-flight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const action = req.headers.get("x-action"); // "create" | "upload"

    // ── Acção 1: Criar registo do vídeo e obter GUID ──────────────────────────
    if (action === "create") {
      const { title } = await req.json() as { title: string };

      const bunnyRes = await fetch(
        `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
        {
          method: "POST",
          headers: {
            AccessKey: BUNNY_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        }
      );

      if (!bunnyRes.ok) {
        const err = await bunnyRes.text();
        return new Response(
          JSON.stringify({ error: `Bunny criar falhou (${bunnyRes.status}): ${err}` }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const data = await bunnyRes.json() as { guid: string };
      const cdnUrl = `https://${BUNNY_CDN_HOSTNAME}/${data.guid}/play_720p.mp4`;

      return new Response(
        JSON.stringify({ guid: data.guid, cdnUrl }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── Acção 2: Enviar ficheiro binário para o Bunny ─────────────────────────
    if (action === "upload") {
      const guid = req.headers.get("x-video-guid");
      if (!guid) {
        return new Response(
          JSON.stringify({ error: "x-video-guid header obrigatório" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const videoBytes = await req.arrayBuffer();

      const bunnyRes = await fetch(
        `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${guid}`,
        {
          method: "PUT",
          headers: {
            AccessKey: BUNNY_API_KEY,
            "Content-Type": "application/octet-stream",
          },
          body: videoBytes,
        }
      );

      if (!bunnyRes.ok) {
        const err = await bunnyRes.text();
        return new Response(
          JSON.stringify({ error: `Bunny upload falhou (${bunnyRes.status}): ${err}` }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "x-action inválido. Use 'create' ou 'upload'." }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
