import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BrandingConfig {
  subLogoUrl: string;
  mainLogoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  updateSubLogo: (url: string) => void;
  updateMainLogo: (url: string) => void;
  updateFavicon: (url: string) => void;
  updateColors: (primary: string, secondary: string) => void;
}

const defaultBranding: BrandingConfig = {
  subLogoUrl: '/era-logo.png',
  mainLogoUrl: '/era-logo.png',
  faviconUrl: '/era-logo.png',
  primaryColor: '#CCFF00',
  secondaryColor: '#232323'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedBranding = localStorage.getItem('era-learn-branding');
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setBranding({ ...defaultBranding, ...parsed });
        console.log('🔍 Branding carregado do localStorage:', parsed);
      } catch (error) {
        console.error('Erro ao carregar configurações de branding:', error);
        localStorage.removeItem('era-learn-branding');
        setBranding(defaultBranding);
      }
    } else {
      console.log('🔍 Usando configurações padrão de branding:', defaultBranding);
    }
  }, []);

  // Aplicar cores ao carregar
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
  }, [branding.primaryColor, branding.secondaryColor]);

  // Salvar configurações no localStorage
  const saveBranding = (newBranding: BrandingConfig) => {
    localStorage.setItem('era-learn-branding', JSON.stringify(newBranding));
    setBranding(newBranding);
  };

  const updateSubLogo = (url: string) => {
    saveBranding({ ...branding, subLogoUrl: url });
  };

  const updateMainLogo = (url: string) => {
    saveBranding({ ...branding, mainLogoUrl: url });
  };

  const updateFavicon = (url: string) => {
    // Atualizar o favicon no DOM
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = url;
    }
    saveBranding({ ...branding, faviconUrl: url });
  };

  const updateColors = (primary: string, secondary: string) => {
    // Aplicar cores via CSS variables
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    saveBranding({ ...branding, primaryColor: primary, secondaryColor: secondary });
  };

  return (
    <BrandingContext.Provider value={{
      branding,
      updateSubLogo,
      updateMainLogo,
      updateFavicon,
      updateColors
    }}>
      {children}
    </BrandingContext.Provider>
  );
}; 