import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  logo_url: '/logotipoeralearn.png',
  sub_logo_url: '/era-sub-logo.png',
  favicon_url: '/favicon.ico',
  background_url: '',
  primary_color: '#3AB26A',   // verde Panalearn
  secondary_color: '#1E1B4B', // roxo escuro
  company_name: 'Panalearn',
  company_slogan: 'Plataforma de Ensino Online',
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const BrandingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loading, setLoading] = useState(true);

  // Carrega do banco (com fallback para localStorage)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('branding_config')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          const cfg = { ...defaultBranding, ...data };
          setBranding(cfg);
          applyBrandingToDOM(cfg);
          localStorage.setItem('panalearn-branding', JSON.stringify(cfg));
        } else {
          // fallback localStorage
          const saved = localStorage.getItem('panalearn-branding');
          const cfg = saved ? { ...defaultBranding, ...JSON.parse(saved) } : defaultBranding;
          setBranding(cfg);
          applyBrandingToDOM(cfg);
        }
      } catch {
        const saved = localStorage.getItem('panalearn-branding');
        const cfg = saved ? { ...defaultBranding, ...JSON.parse(saved) } : defaultBranding;
        setBranding(cfg);
        applyBrandingToDOM(cfg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Persiste no banco + localStorage e aplica ao DOM imediatamente
  const updateBranding = useCallback(async (updates: Partial<BrandingConfig>) => {
    const next = { ...branding, ...updates };
    
    // Aplica ao DOM instantaneamente (feedback imediato)
    applyBrandingToDOM(next);
    setBranding(next);
    localStorage.setItem('panalearn-branding', JSON.stringify(next));

    // Persiste no banco
    try {
      const { data: existing } = await supabase
        .from('branding_config')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing?.id) {
        await supabase.from('branding_config').update(updates).eq('id', existing.id);
      } else {
        await supabase.from('branding_config').insert({ ...next });
      }
    } catch (err) {
      console.warn('Branding não persistido no banco (usando localStorage):', err);
    }
  }, [branding]);

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