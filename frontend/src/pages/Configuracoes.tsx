import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useBranding } from '@/context/BrandingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Palette, ImageIcon, UserCheck } from 'lucide-react';

function ImagensConfig() {
  const [imagens, setImagens] = useState(() => {
    const saved = localStorage.getItem('pana-imagens');
    return saved ? JSON.parse(saved) : [];
  });
  const [logoSelecionado, setLogoSelecionado] = useState(() => localStorage.getItem('pana-logo') || '');
  const [faviconSelecionado, setFaviconSelecionado] = useState(() => localStorage.getItem('pana-favicon') || '');
  const fileInput = useRef(null);

  useEffect(() => {
    localStorage.setItem('pana-imagens', JSON.stringify(imagens));
  }, [imagens]);
  useEffect(() => {
    if (logoSelecionado) localStorage.setItem('pana-logo', logoSelecionado);
  }, [logoSelecionado]);
  useEffect(() => {
    if (faviconSelecionado) localStorage.setItem('pana-favicon', faviconSelecionado);
    if (faviconSelecionado) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconSelecionado;
    }
  }, [faviconSelecionado]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagens((imgs) => [...imgs, ev.target.result]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-heading font-bold mb-2 text-pana-indigo">Imagens</h2>
      <p className="mb-2 text-sm text-pana-text-secondary">Faça upload de imagens para usar como logotipo ou favicon.</p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        ref={fileInput}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button
        className="pana-primary-button px-4 py-2 rounded-lg mb-4"
        onClick={() => fileInput.current && fileInput.current.click()}
      >
        Enviar imagem
      </button>
      <div className="flex flex-wrap gap-4">
        {imagens.map((img, idx) => (
          <div key={idx} className="flex flex-col items-center border border-gray-200 p-3 rounded-lg bg-white">
            <img src={img} alt="imagem" className="h-16 w-16 object-contain mb-2 bg-white" />
            <button
              className={`pana-secondary-button px-3 py-1 text-sm mb-1 ${logoSelecionado === img ? 'ring-2 ring-pana-teal' : ''}`}
              onClick={() => setLogoSelecionado(img)}
            >Usar como logotipo</button>
            <button
              className={`pana-secondary-button px-3 py-1 text-sm ${faviconSelecionado === img ? 'ring-2 ring-pana-teal' : ''}`}
              onClick={() => setFaviconSelecionado(img)}
            >Usar como favicon</button>
          </div>
        ))}
      </div>
      {logoSelecionado && (
        <div className="mt-4">
          <span className="font-semibold text-pana-text">Logotipo atual:</span>
          <img src={logoSelecionado} alt="logo atual" className="h-10 inline ml-2 align-middle" />
        </div>
      )}
      {faviconSelecionado && (
        <div className="mt-2">
          <span className="font-semibold text-pana-text">Favicon atual:</span>
          <img src={faviconSelecionado} alt="favicon atual" className="h-6 inline ml-2 align-middle" />
        </div>
      )}
    </div>
  );
}

const WhiteLabel = () => {
  const { toast } = useToast();
  const { branding, updateLogo, updateFavicon, updateColors, updateCompanyName } = useBranding();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(branding.cor_primaria || '#417B5A');
  const [secondaryColor, setSecondaryColor] = useState(branding.cor_secundaria || '#4B3F72');
  const [companyName, setCompanyName] = useState(branding.nome || '');
  const [uploading, setUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Arquivo inválido', description: 'Por favor, selecione uma imagem.', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'O arquivo deve ter no máximo 5MB.', variant: 'destructive' });
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Arquivo inválido', description: 'Por favor, selecione uma imagem.', variant: 'destructive' });
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'O favicon deve ter no máximo 1MB.', variant: 'destructive' });
        return;
      }
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setFaviconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoFile) {
      toast({ title: 'Nenhum arquivo selecionado', description: 'Por favor, selecione um logo para fazer upload.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await updateLogo(logoFile);
      setLogoFile(null);
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFavicon = async () => {
    if (!faviconFile) {
      toast({ title: 'Nenhum arquivo selecionado', description: 'Por favor, selecione um favicon para fazer upload.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await updateFavicon(faviconFile);
      setFaviconFile(null);
      setFaviconPreview(null);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    } catch (error) {
      console.error('Erro ao salvar favicon:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    setUploading(true);
    try {
      await updateColors(primaryColor, secondaryColor);
    } catch (error) {
      console.error('Erro ao salvar cores:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCompanyName = async () => {
    if (!companyName.trim()) {
      toast({ title: 'Nome da empresa obrigatório', description: 'Por favor, informe o nome da empresa.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await updateCompanyName(companyName.trim());
    } catch (error) {
      console.error('Erro ao salvar nome da empresa:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-hero p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Palette className="h-6 w-6 text-pana-bone" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-pana-bone">Personalização da marca</h1>
            <p className="text-pana-bone/80">Configure o logo, favicon e cores da sua empresa</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pana-indigo text-base">
              <ImageIcon className="h-5 w-5 text-pana-teal" />
              Logo da empresa
            </CardTitle>
            <CardDescription className="text-pana-text-secondary">
              Upload do logo principal que aparecerá em toda a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branding.logo_url && (
              <div className="mb-4">
                <Label className="text-sm font-medium text-pana-text">Logo atual</Label>
                <div className="mt-2 flex items-center gap-4">
                  <img src={branding.logo_url} alt="Logo atual" className="w-20 h-20 object-contain rounded-lg border bg-gray-50" />
                  <div>
                    <p className="text-sm font-medium text-pana-text">Logo configurado</p>
                    <p className="text-xs text-pana-text-secondary">Aparece no cabeçalho, sidebar e tela de login</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-pana-text">Upload novo logo</Label>
              <div className="mt-2 space-y-2">
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logoUpload" />
                <label htmlFor="logoUpload">
                  <Button variant="outline" className="w-full cursor-pointer border-gray-300 hover:border-pana-teal text-pana-text-secondary">
                    Selecionar imagem
                  </Button>
                </label>
                {logoPreview && (
                  <div className="mt-2">
                    <Label className="text-sm font-medium text-pana-text">Preview</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <img src={logoPreview} alt="Preview do logo" className="w-20 h-20 object-contain rounded-lg border bg-gray-50" />
                      <Button onClick={handleSaveLogo} disabled={uploading} className="bg-pana-teal hover:bg-pana-teal/90 text-white">
                        {uploading ? 'Salvando...' : 'Salvar logo'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-pana-text-secondary mt-2">Formatos aceitos: PNG, JPG, SVG. Tamanho máximo: 5MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Favicon */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pana-indigo text-base">
              <ImageIcon className="h-5 w-5 text-pana-teal" />
              Favicon (ícone da aba)
            </CardTitle>
            <CardDescription className="text-pana-text-secondary">
              Ícone que aparece na aba do navegador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branding.favicon_url && (
              <div className="mb-4">
                <Label className="text-sm font-medium text-pana-text">Favicon atual</Label>
                <div className="mt-2 flex items-center gap-4">
                  <img src={branding.favicon_url} alt="Favicon atual" className="w-8 h-8 object-contain rounded border bg-gray-50" />
                  <div>
                    <p className="text-sm font-medium text-pana-text">Favicon configurado</p>
                    <p className="text-xs text-pana-text-secondary">Aparece na aba do navegador</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-pana-text">Upload novo favicon</Label>
              <div className="mt-2 space-y-2">
                <input ref={faviconInputRef} type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" id="faviconUpload" />
                <label htmlFor="faviconUpload">
                  <Button variant="outline" className="w-full cursor-pointer border-gray-300 hover:border-pana-teal text-pana-text-secondary">
                    Selecionar imagem
                  </Button>
                </label>
                {faviconPreview && (
                  <div className="mt-2">
                    <Label className="text-sm font-medium text-pana-text">Preview</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <img src={faviconPreview} alt="Preview do favicon" className="w-8 h-8 object-contain rounded border bg-gray-50" />
                      <Button onClick={handleSaveFavicon} disabled={uploading} className="bg-pana-teal hover:bg-pana-teal/90 text-white">
                        {uploading ? 'Salvando...' : 'Salvar favicon'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-pana-text-secondary mt-2">Formatos aceitos: PNG, ICO, SVG. Tamanho máximo: 1MB</p>
            </div>
          </CardContent>
        </Card>

        {/* Company name */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pana-indigo text-base">
              <UserCheck className="h-5 w-5 text-pana-teal" />
              Nome da empresa
            </CardTitle>
            <CardDescription className="text-pana-text-secondary">
              Nome que aparecerá na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-pana-text">Nome da empresa</Label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Digite o nome da sua empresa"
                  className="flex-1 border-gray-300 focus:border-pana-grape"
                />
                <Button onClick={handleSaveCompanyName} disabled={uploading || !companyName.trim()} className="bg-pana-teal hover:bg-pana-teal/90 text-white">
                  {uploading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pana-indigo text-base">
              <Palette className="h-5 w-5 text-pana-teal" />
              Cores da marca
            </CardTitle>
            <CardDescription className="text-pana-text-secondary">
              Personalize as cores da sua marca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-pana-text">Cor primária</Label>
                <div className="mt-2 flex gap-2">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" placeholder="#417B5A" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-pana-text">Cor secundária</Label>
                <div className="mt-2 flex gap-2">
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1" placeholder="#4B3F72" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveColors} disabled={uploading} className="w-full bg-pana-teal hover:bg-pana-teal/90 text-white">
              {uploading ? 'Salvando...' : 'Salvar cores'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pana-indigo text-base">
            <ImageIcon className="h-5 w-5 text-pana-teal" />
            Preview das configurações
          </CardTitle>
          <CardDescription className="text-pana-text-secondary">
            Como sua marca aparecerá na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-gray-200 rounded-lg bg-pana-background">
            <div className="flex items-center gap-3 mb-2">
              <img src={logoPreview || branding.logo_url || '/era-logo.png'} alt="Preview Logo" className="w-8 h-8 object-contain" />
              <span className="text-sm font-heading font-semibold text-pana-indigo">{companyName || 'Sua empresa'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-pana-text-secondary">
              <span>Plataforma de treinamento</span>
              <img src={faviconPreview || branding.favicon_url || '/favicon.ico'} alt="Preview Favicon" className="w-4 h-4 object-contain" />
            </div>
            <div className="mt-4 flex gap-2 items-center">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor }}></div>
              <div className="w-6 h-6 rounded" style={{ backgroundColor: secondaryColor }}></div>
              <span className="text-xs text-pana-text-secondary">Cores da marca</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImagensConfig;
