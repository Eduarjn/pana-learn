import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// A URL do Supabase é a mesma usada no cliente (hardcoded neste projecto)
// A chave API do Bunny fica nos secrets da Edge Function — nunca no browser
const SUPABASE_URL = "https://oqoxhavdhrgdjvxvajze.supabase.co";
const BUNNY_PROXY  = `${SUPABASE_URL}/functions/v1/super-endpoint`;

export interface BunnyUploadResult {
  /** URL de reprodução no CDN do Bunny (play_720p.mp4) */
  url: string;
  /** GUID único do vídeo no Bunny Stream */
  guid: string;
  /** Nome original do ficheiro enviado */
  name: string;
}

/**
 * Hook para fazer upload de vídeos para o Bunny Stream através de uma
 * Supabase Edge Function (proxy seguro).
 *
 * Fluxo:
 *  1. POST  /bunny-upload  (x-action: create) → obtém o guid
 *  2. POST  /bunny-upload  (x-action: upload) → envia os bytes do ficheiro
 *  3. Devolve a URL de reprodução via CDN
 *
 * A BUNNY_API_KEY nunca sai do servidor — fica nos secrets da Edge Function.
 */
export function useUploadVideo() {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [result, setResult]     = useState<BunnyUploadResult | null>(null);
  const [progress, setProgress] = useState<number>(0);

  async function upload(file: File, title?: string): Promise<BunnyUploadResult | null> {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Obter o token de sessão actual para autorizar a Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const videoTitle = title || file.name.replace(/\.[^/.]+$/, "");

      // ── Passo 1: Criar o registo do vídeo no Bunny (via proxy) ─────────────
      setProgress(5);
      const createRes = await fetch(BUNNY_PROXY, {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
          "x-action": "create",
        },
        body: JSON.stringify({ title: videoTitle }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: createRes.statusText }));
        throw new Error(`Criar vídeo falhou: ${err.error ?? createRes.statusText}`);
      }

      const { guid, cdnUrl } = await createRes.json() as { guid: string; cdnUrl: string };
      if (!guid) throw new Error("GUID não encontrado na resposta do servidor.");
      setProgress(15);

      // ── Passo 2: Enviar o ficheiro binário (via proxy) ──────────────────────
      const uploadRes = await fetch(BUNNY_PROXY, {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/octet-stream",
          "x-action": "upload",
          "x-video-guid": guid,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: uploadRes.statusText }));
        throw new Error(`Upload do vídeo falhou: ${err.error ?? uploadRes.statusText}`);
      }

      setProgress(100);

      // ── Passo 3: Montar o resultado ────────────────────────────────────────
      // Preferir a URL devolvida pelo servidor; fallback para a construída localmente
      const finalUrl = cdnUrl ?? `https://${CDN_HOSTNAME}/${guid}/play_720p.mp4`;

      const uploadResult: BunnyUploadResult = { url: finalUrl, guid, name: file.name };
      setResult(uploadResult);
      return uploadResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido no upload.";
      setError(message);
      console.error("❌ useUploadVideo:", err);
      return null;

    } finally {
      setLoading(false);
    }
  }

  return { upload, result, loading, error, progress };
}