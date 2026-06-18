-- Bloqueia novos uploads no bucket training-videos.
-- O fluxo correto agora é Bunny Stream — videos.bunny_video_id / videos.url_video.
-- Sem policy de INSERT, RLS bloqueia por default ("new row violates row-level security policy").
DROP POLICY IF EXISTS "Permitir upload para autenticados 17j27xn_0" ON storage.objects;
