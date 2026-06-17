-- ════════════════════════════════════════════════════════════════════════
-- Item 2: bloquear enumeração (listing) dos buckets públicos.
-- (advisor: public_bucket_allows_listing)
--
-- Os 5 buckets são public=true -> getPublicUrl serve pelo CDN sem RLS. As
-- policies de SELECT em storage.objects só habilitam list/download via API
-- (que o app NÃO usa — verificado: só getPublicUrl/upload, sem .list()/
-- .download()) e permitiam anon ENUMERAR todos os arquivos (avatares,
-- branding, áudios e certificados de todos os tenants).
-- Removendo as de SELECT: entrega por URL pública intacta; enumeração some.
-- ════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Permitir leitura de videos para usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública 17j27xn_0"                     ON storage.objects;
DROP POLICY IF EXISTS "Permitir linserir e selecionar 1oj01fe_1"              ON storage.objects;
DROP POLICY IF EXISTS "Public can view org assets"                            ON storage.objects;
DROP POLICY IF EXISTS "Public read audio"                                     ON storage.objects;
DROP POLICY IF EXISTS "certificate-assets: leitura pública"                   ON storage.objects;
