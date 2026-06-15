import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/context/EmpresaContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BrandingConfig {
  id?: string;
  logo_url: string;
  sub_logo_url: string;
  favicon_url: string;
  background_url: string;
  primary_color: string;
  secondary_color: string;
  company_name: string;
  company_slogan: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (updates: Partial<BrandingConfig>) => Promise<void>;
  updateLogo: (url: string) => Promise<void>;
  updateSubLogo: (url: string) => Promise<void>;
  updateFavicon: (url: string) => Promise<void>;
  updateBackground: (url: string) => Promise<void>;
  updateColors: (primary: string, secondary: string) => Promise<void>;
  updateCompanyName: (name: string) => Promise<void>;
  updateCompanySlogan: (slogan: string) => Promise<void>;
  loading: boolean;
}

// ─── Padrão ───────────────────────────────────────────────────────────────────

export const defaultBranding: BrandingConfig = {
  // ── Assets do Design System (public/brand/) ──
  logo_url:    '/brand/panalearn-horizontal-on-white.png', // logo para fundos claros
  sub_logo_url: '/brand/panalearn-mark-white.png',         // símbolo branco (fundos escuros)
  favicon_url:  '/brand/favicon-32.png',
  background_url: '',
  // ── Cores do Branding Book ──
  primary_color:   '#417B5A',  // Jungle Teal — CTA principal
  secondary_color: '#1F2041',  // Space Indigo — sidebar / headers
  company_name:  'PanaLearn',
  company_slogan: 'Conhecimento em Conexão',
};

// ─── Aplicar cores ao DOM ─────────────────────────────────────────────────────

/**
 * Aplica as cores do branding como CSS variables no :root.
 * Mapeia primary_color → --accent (usado pelo tokens.css e toda a sidebar)
 * e também --primary-color para compatibilidade com código legado.
 */
function applyBrandingToDOM(cfg: BrandingConfig) {
  const root = document.documentElement;
  const p = cfg.primary_color;
  const s = cfg.secondary_color;

  // ── Cor primária → --accent (sistema futurista, sidebar, botões) ──
  root.style.setProperty('--accent', p);
  root.style.setProperty('--primary-color', p);

  // Derivadas da cor primária
  root.style.setProperty('--accent-600', darken(p, 15));
  root.style.setProperty('--accent-300', lighten(p, 15));
  root.style.setProperty('--accent-glow', hexToRgba(p, 0.35));
  root.style.setProperty('--ring', hexToRgba(p, 0.6));
  root.style.setProperty('--sidebar-ring', p);
  root.style.setProperty('--sidebar-primary', p);

  // ── Cor secundária → fundo dark ──
  root.style.setProperty('--secondary-color', s);
  root.style.setProperty('--bg', s);
  root.style.setProperty('--surface', lighten(s, 5));
  root.style.setProperty('--surface-2', lighten(s, 10));
  root.style.setProperty('--border', lighten(s, 18));
  root.style.setProperty('--sidebar-background', s);

  // ── Favicon dinâmico ──
  if (cfg.favicon_url) {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = cfg.favicon_url;
  }

  // ── Título da página ──
  if (cfg.company_name) {
    document.title = cfg.company_name;
  }
}

// ─── Helpers de cor ───────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, pct: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - pct / 100;
  return rgbToHex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}

function lighten(hex: string, pct: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = pct / 100;
  return rgbToHex(
    Math.round(r + (255 - r) * f),
    Math.round(g + (255 - g) * f),
    Math.round(b + (255 - b) * f),
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
};

// ─── Migração automática de assets antigos ────────────────────────────────────

const OLD_ASSETS: Record<string, string> = {
  // assets antigos → novos paths do Design System
  '/logotipoeralearn.png':      '/brand/panalearn-horizontal-on-white.png',
  '/logotipoeralearn.svg':      '/brand/panalearn-horizontal-on-white.png',
  '/panalearnlogo.jpg':         '/brand/panalearn-horizontal-on-white.png',
  '/panalearn-logo.png':        '/brand/panalearn-horizontal-on-white.png',
  '/panalearn-logo-horizontal.png': '/brand/panalearn-horizontal-on-white.png',
  '/era-sub-logo.png':          '/brand/panalearn-mark-white.png',
  '/panalearn-icon-dark.png':   '/brand/panalearn-mark-white.png',
  '/favicon.ico':               '/brand/favicon-32.png',
  '/panalearn-favicon.png':     '/brand/favicon-32.png',
};

const OLD_COLORS: Record<string, string> = {
  '#3AB26A': '#22c55e',
  '#3ab26a': '#22c55e',
  '#1E1B4B': '#1f2937',
  '#1e1b4b': '#1f2937',
  '#FCA311': '#22c55e',
  '#fca311': '#22c55e',
  '#14213D': '#1f2937',
  '#14213d': '#1f2937',
};

function migrateBranding(cfg: BrandingConfig): BrandingConfig {
  const migrated = { ...cfg };
  // Migrar URLs de assets (paths locais)
  if (migrated.logo_url && OLD_ASSETS[migrated.logo_url]) migrated.logo_url = OLD_ASSETS[migrated.logo_url];
  if (migrated.sub_logo_url && OLD_ASSETS[migrated.sub_logo_url]) migrated.sub_logo_url = OLD_ASSETS[migrated.sub_logo_url];
  if (migrated.favicon_url && OLD_ASSETS[migrated.favicon_url]) migrated.favicon_url = OLD_ASSETS[migrated.favicon_url];
  // Migrar URLs completas (Supabase Storage) que contenham nomes antigos
  const oldLogoNames = ['logotipoeralearn', 'panalearnlogo', 'era-sub-logo', 'eralearn'];
  if (migrated.logo_url && oldLogoNames.some(n => migrated.logo_url.includes(n))) {
    migrated.logo_url = '/brand/panalearn-horizontal-on-white.png';
  }
  if (migrated.sub_logo_url && oldLogoNames.some(n => migrated.sub_logo_url.includes(n))) {
    migrated.sub_logo_url = '/panalearn-icon-dark.png';
  }
  // Migrar cores
  if (migrated.primary_color && OLD_COLORS[migrated.primary_color]) migrated.primary_color = OLD_COLORS[migrated.primary_color];
  if (migrated.secondary_color && OLD_COLORS[migrated.secondary_color]) migrated.secondary_color = OLD_COLORS[migrated.secondary_color];
  // Migrar slogan
  if (migrated.company_slogan === 'Plataforma de Ensino Online' || migrated.company_slogan === 'Smart Training') {
    migrated.company_slogan = 'Conhecimento em Conexão';
  }
  return migrated;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { empresa } = useEmpresa();
  const empresaId = empresa?.id ?? null;
  const cacheKey = empresaId ? `panalearn-branding-${empresaId}` : 'panalearn-branding';

  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loading, setLoading] = useState(true);

  // Carrega o branding DA EMPRESA ATUAL (isolado por tenant). Recarrega quando
  // a empresa muda (ex.: admin_master entrando em "modo visualização").
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Sem empresa resolvida (login/público/admin_master sem masquerade):
        // usa cache local se houver, senão o padrão.
        if (!empresaId) {
          const saved = localStorage.getItem(cacheKey);
          const cfg = saved ? migrateBranding({ ...defaultBranding, ...JSON.parse(saved) }) : defaultBranding;
          setBranding(cfg);
          applyBrandingToDOM(cfg);
          return;
        }

        const { data, error } = await supabase
          .from('branding_config')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const cfg = migrateBranding({ ...defaultBranding, ...data });
          setBranding(cfg);
          applyBrandingToDOM(cfg);
          localStorage.setItem(cacheKey, JSON.stringify(cfg));
        } else {
          const saved = localStorage.getItem(cacheKey);
          const cfg = saved ? migrateBranding({ ...defaultBranding, ...JSON.parse(saved) }) : defaultBranding;
          setBranding(cfg);
          applyBrandingToDOM(cfg);
        }
      } catch {
        const saved = localStorage.getItem(cacheKey);
        const cfg = saved ? migrateBranding({ ...defaultBranding, ...JSON.parse(saved) }) : defaultBranding;
        setBranding(cfg);
        applyBrandingToDOM(cfg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [empresaId, cacheKey]);

  // Persiste o branding DA EMPRESA ATUAL (escopado por empresa_id).
  const updateBranding = useCallback(async (updates: Partial<BrandingConfig>) => {
    const next = { ...branding, ...updates };

    applyBrandingToDOM(next);
    setBranding(next);
    localStorage.setItem(cacheKey, JSON.stringify(next));

    // Sem empresa resolvida não persiste no banco (evita escrever em registro
    // de outro tenant — causa do bug "muda o nome de todas as empresas").
    if (!empresaId) return;

    try {
      const { data: existing } = await supabase
        .from('branding_config')
        .select('id')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await supabase.from('branding_config').update(updates).eq('id', existing.id);
      } else {
        await supabase.from('branding_config').insert({ ...next, empresa_id: empresaId });
      }
    } catch (err) {
      console.warn('Branding não persistido no banco (usando localStorage):', err);
    }
  }, [branding, empresaId, cacheKey]);

  const updateLogo         = (url: string)                    => updateBranding({ logo_url: url });
  const updateSubLogo      = (url: string)                    => updateBranding({ sub_logo_url: url });
  const updateFavicon      = (url: string)                    => updateBranding({ favicon_url: url });
  const updateBackground   = (url: string)                    => updateBranding({ background_url: url });
  const updateColors       = (primary: string, secondary: string) => updateBranding({ primary_color: primary, secondary_color: secondary });
  const updateCompanyName  = (name: string)                   => updateBranding({ company_name: name });
  const updateCompanySlogan = (slogan: string)                => updateBranding({ company_slogan: slogan });

  return (
    <BrandingContext.Provider value={{
      branding, loading,
      updateBranding, updateLogo, updateSubLogo, updateFavicon,
      updateBackground, updateColors, updateCompanyName, updateCompanySlogan,
    }}>
      {children}
    </BrandingContext.Provider>
  );
};