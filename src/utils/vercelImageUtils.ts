/**
 * Utilitários específicos para imagens no Vercel
 * Solução direta para o problema de carregamento de imagens
 */

// URL base do projeto no Vercel
const VERCEL_BASE_URL = 'https://eralearn-94hi.vercel.app';

// Detectar se estamos no Vercel
const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

/**
 * Resolve URL de imagem para Vercel
 * @param imagePath - Caminho da imagem (ex: '/panalearn-logo.png')
 * @returns URL completa da imagem
 */
export const getVercelImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Se já é uma URL completa, retornar como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Se estamos no Vercel, usar URL absoluta
  if (isVercel) {
    const fullUrl = `${VERCEL_BASE_URL}${imagePath}`;
    console.log('🔍 Vercel Image URL:', { imagePath, fullUrl });
    return fullUrl;
  }
  
  // Se estamos no localhost, usar caminho relativo
  console.log('🔍 Localhost Image Path:', imagePath);
  return imagePath;
};

/**
 * URLs das imagens principais
 */
export const VERCEL_IMAGES = {
  LOGO: getVercelImageUrl('/panalearn-logo.png'),
  FAVICON: getVercelImageUrl('/panalearn-favicon.png'),
  BACKGROUND: getVercelImageUrl('/lovable-uploads/aafcc16a-d43c-4f66-9fa4-70da46d38ccb.png'),
  PLACEHOLDER: getVercelImageUrl('/placeholder.svg')
};

/**
 * Testa se uma imagem carrega no Vercel
 * @param url - URL da imagem
 * @returns Promise<boolean>
 */
export const testVercelImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      console.log('✅ Vercel image loaded:', url);
      resolve(true);
    };
    img.onerror = () => {
      console.error('❌ Vercel image failed:', url);
      resolve(false);
    };
    img.src = url;
  });
};

/**
 * Carrega imagem com fallbacks para Vercel
 * @param primaryPath - Caminho principal da imagem
 * @param fallbacks - Lista de fallbacks
 * @returns Promise<string> - Primeira URL que funciona
 */
export const loadVercelImageWithFallbacks = async (
  primaryPath: string,
  fallbacks: string[] = []
): Promise<string> => {
  const allPaths = [primaryPath, ...fallbacks];
  
  for (const path of allPaths) {
    const url = getVercelImageUrl(path);
    if (await testVercelImage(url)) {
      return url;
    }
  }
  
  // Se nenhuma funcionar, retornar a primeira
  console.warn('⚠️ Nenhuma imagem carregou, usando:', primaryPath);
  return getVercelImageUrl(primaryPath);
};
