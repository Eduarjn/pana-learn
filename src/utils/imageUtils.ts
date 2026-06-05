/**
 * Utilitários para gerenciar caminhos de imagens
 * Funciona tanto no localhost quanto no Vercel
 */

// Detectar se estamos no Vercel
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

// Base URL para imagens
const getBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  // Se estamos no Vercel, usar a URL base do projeto
  if (isVercel) {
    console.log('🔍 Detectado ambiente Vercel:', window.location.origin);
    return window.location.origin;
  }
  
  // Se estamos no localhost, usar caminho relativo
  console.log('🔍 Detectado ambiente localhost');
  return '';
};

/**
 * Resolve o caminho de uma imagem
 * @param path - Caminho da imagem (ex: '/logotipoeralearn.png')
 * @returns URL completa da imagem
 */
export const resolveImagePath = (path: string): string => {
  if (!path) return '';
  
  // Se já é uma URL completa, retornar como está
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Se é um caminho relativo, adicionar base URL
  const baseUrl = getBaseUrl();
  const fullPath = `${baseUrl}${path}`;
  
  console.log('🔍 Resolvendo imagem:', { path, baseUrl, fullPath });
  
  return fullPath;
};

/**
 * Resolve o caminho do logo principal
 * @param customLogoUrl - URL customizada do logo (opcional)
 * @returns URL do logo
 */
export const resolveLogoPath = (customLogoUrl?: string): string => {
  // Se há uma URL customizada, usar ela
  if (customLogoUrl) {
    return resolveImagePath(customLogoUrl);
  }
  
  // Fallback para o logo padrão
  return resolveImagePath('/brand/panalearn-horizontal-on-white.png');
};

/**
 * Resolve o caminho do favicon
 * @param customFaviconUrl - URL customizada do favicon (opcional)
 * @returns URL do favicon
 */
export const resolveFaviconPath = (customFaviconUrl?: string): string => {
  if (customFaviconUrl) {
    return resolveImagePath(customFaviconUrl);
  }
  
  return resolveImagePath('/panalearn-favicon.png');
};

/**
 * Resolve o caminho da imagem de fundo
 * @param customBackgroundUrl - URL customizada da imagem de fundo (opcional)
 * @returns URL da imagem de fundo
 */
export const resolveBackgroundPath = (customBackgroundUrl?: string): string => {
  if (customBackgroundUrl) {
    return resolveImagePath(customBackgroundUrl);
  }
  
  return resolveImagePath('/lovable-uploads/aafcc16a-d43c-4f66-9fa4-70da46d38ccb.png');
};

/**
 * Testa se uma imagem carrega corretamente
 * @param url - URL da imagem
 * @returns Promise<boolean>
 */
export const testImageLoad = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      console.log('✅ Imagem carregada com sucesso:', url);
      resolve(true);
    };
    img.onerror = () => {
      console.error('❌ Erro ao carregar imagem:', url);
      resolve(false);
    };
    img.src = url;
  });
};

/**
 * Lista de fallbacks para imagens
 */
export const imageFallbacks = {
  logo: [
    '/brand/panalearn-horizontal-on-white.png',
    '/brand/panalearn-horizontal-color.png',
    '/placeholder.svg',
  ],
  favicon: [
    '/brand/favicon-32.png',
    '/brand/app-icon-indigo-192.png',
  ],
  background: [
    '/lovable-uploads/aafcc16a-d43c-4f66-9fa4-70da46d38ccb.png',
    '/placeholder.svg'
  ]
};

/**
 * Tenta carregar uma imagem com fallbacks
 * @param primaryUrl - URL principal
 * @param fallbacks - Lista de URLs de fallback
 * @returns Promise<string> - Primeira URL que carrega com sucesso
 */
export const loadImageWithFallbacks = async (
  primaryUrl: string,
  fallbacks: string[] = []
): Promise<string> => {
  // Testar URL principal primeiro
  if (await testImageLoad(resolveImagePath(primaryUrl))) {
    return primaryUrl;
  }
  
  // Testar fallbacks
  for (const fallback of fallbacks) {
    if (await testImageLoad(resolveImagePath(fallback))) {
      console.log(`✅ Imagem carregada com fallback: ${fallback}`);
      return fallback;
    }
  }
  
  // Se nenhuma funcionar, retornar a primeira
  console.warn(`⚠️ Nenhuma imagem carregou, usando: ${primaryUrl}`);
  return primaryUrl;
};




