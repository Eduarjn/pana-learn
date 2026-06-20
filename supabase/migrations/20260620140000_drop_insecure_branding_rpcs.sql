-- Remove RPCs de branding órfãs e inseguras.
--
-- update_branding_config (2 overloads) e get_branding_config eram SECURITY DEFINER
-- sem nenhuma checagem de auth e operavam no branding_config "mais recente"
-- globalmente (order by created_at desc limit 1), ou seja, NÃO escopadas por tenant
-- — qualquer um podia reescrever/ler a branding de outro tenant.
--
-- Estão órfãs: nenhum código do frontend chama rpc('update_branding_config') ou
-- rpc('get_branding_config'), e nenhuma outra função do banco as referencia.
-- O app usa acesso direto à tabela branding_config escopado por empresa_id
-- (src/context/BrandingContext.tsx e src/hooks/useBranding.ts), respeitando RLS.
--
-- Removê-las elimina a superfície de ataque e o código morto.

drop function if exists public.update_branding_config(text,text,text,text,text,text,text);
drop function if exists public.update_branding_config(text,text,text,text,text,text,text,text);
drop function if exists public.get_branding_config();
