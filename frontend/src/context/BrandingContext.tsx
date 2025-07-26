import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Branding {
  logo_url?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  nome?: string;
}

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
}

const BrandingContext = createContext<BrandingContextType>({ branding: {}, loading: true });

export function BrandingProvider({ empresaId, children }: { empresaId?: string; children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) {
      setBranding({});
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setBranding({});
        } else {
          setBranding({
            logo_url: data.logo_url,
            cor_primaria: data.cor_primaria,
            cor_secundaria: data.cor_secundaria,
            nome: data.nome,
          });
        }
        setLoading(false);
      });
  }, [empresaId]);

  return (
    <BrandingContext.Provider value={{ branding, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
} 