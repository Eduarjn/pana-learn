import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Globe, Mail, Shield, Database, Bell, Palette, UserCheck, Award } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Routes, Route, Outlet } from 'react-router-dom';
import { usePreferences, FontSize, Language } from '../../frontend/src/context/PreferencesContext';
import QuizConfig from './configuracoes/QuizConfig';

// Componente Preferências
const Preferencias = () => {
  const { toast } = useToast();
  const {
    theme, setTheme,
    language, setLanguage,
    fontSize, setFontSize,
    keyboardShortcuts, setKeyboardShortcuts
  } = usePreferences();

  const handleSave = async () => {
    toast({ 
      title: 'Configurações salvas com sucesso!', 
      description: 'As alterações foram aplicadas ao sistema.' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tema, Acessibilidade & Idioma
        </CardTitle>
        <CardDescription>
          Personalize a aparência e comportamento da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Modo Escuro</Label>
              <div className="mt-2 flex gap-2">
                <Button variant={theme === 'dark' ? 'default' : 'outline'} className="flex-1" onClick={() => setTheme('dark')}>Ativado</Button>
                <Button variant={theme === 'light' ? 'default' : 'outline'} className="flex-1" onClick={() => setTheme('light')}>Desativado</Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Tamanho da Fonte</Label>
              <div className="mt-2">
                <select className="w-full p-2 border rounded-md" value={fontSize} onChange={e => setFontSize(e.target.value as FontSize)}>
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Idioma</Label>
              <div className="mt-2">
                <select className="w-full p-2 border rounded-md" value={language} onChange={e => setLanguage(e.target.value as Language)}>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Atalhos de Teclado</Label>
              <div className="mt-2 flex gap-2">
                <Button variant={keyboardShortcuts ? 'default' : 'outline'} className="flex-1" onClick={() => setKeyboardShortcuts(true)}>Ativados</Button>
                <Button variant={!keyboardShortcuts ? 'default' : 'outline'} className="flex-1" onClick={() => setKeyboardShortcuts(false)}>Desativados</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Preferências</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Conta
const Conta = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userProfile.email, password: currentPassword });
    if (signInError) {
      toast({ title: 'Senha atual incorreta', variant: 'destructive' });
      setChangingPassword(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${userProfile.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Erro ao fazer upload da foto', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    await supabase.from('usuarios').update({ avatar_url: data.publicUrl }).eq('id', userProfile.id);
    toast({ title: 'Foto de perfil atualizada!' });
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Informações da Conta
        </CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais e credenciais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-medium text-gray-500">
                  {userProfile?.nome ? userProfile.nome.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Fazendo upload...' : 'Alterar foto'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input 
              id="nome" 
              defaultValue={userProfile?.nome || ''} 
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              defaultValue={userProfile?.email || ''} 
              className="mt-1"
              disabled
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button 
              onClick={handleChangePassword} 
              disabled={changingPassword}
              className="w-full md:w-auto"
            >
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente WhiteLabel
const WhiteLabel = () => {
  const { toast } = useToast();
  
  const handleSave = async () => {
    try {
      localStorage.setItem('pana-learn-config', JSON.stringify({}));
      toast({ 
        title: 'Configurações salvas com sucesso!', 
        description: 'As alterações foram aplicadas ao sistema.' 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar configurações', 
        description: 'Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          White-Label / Branding
        </CardTitle>
        <CardDescription>
          Personalize a aparência da plataforma com sua marca
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Logo da Empresa</Label>
              <div className="mt-2">
                <Button variant="outline" className="w-full">
                  Upload Logo
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Favicon</Label>
              <div className="mt-2">
                <Button variant="outline" className="w-full">
                  Upload Favicon
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Cor Primária</Label>
              <div className="mt-2">
                <Input type="color" defaultValue="#3B82F6" className="w-full h-10" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Cor Secundária</Label>
              <div className="mt-2">
                <Input type="color" defaultValue="#10B981" className="w-full h-10" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Branding</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Certificado
const Certificado = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    templateFile: null as File | null,
    validade: 365,
    assinaturaDigital: true,
    qrCode: true,
    qrCodePosition: 'rodape',
    layoutTemplate: 'padrao',
    nomeSignatario: '',
    cargoSignatario: '',
    corPrimaria: '#3B82F6',
    fonteTexto: 'Roboto',
    alinhamento: 'centro'
  });

  // Buscar configurações existentes
  useEffect(() => {
    const fetchConfiguracoes = async () => {
      try {
        // Simular busca de configurações existentes
        const mockConfig = {
          validade: 365,
          assinaturaDigital: true,
          qrCode: true,
          qrCodePosition: 'rodape',
          layoutTemplate: 'padrao',
          nomeSignatario: 'João Silva',
          cargoSignatario: 'Diretor de Treinamento',
          corPrimaria: '#3B82F6',
          fonteTexto: 'Roboto',
          alinhamento: 'centro'
        };
        setFormData(mockConfig);
      } catch (error) {
        toast({ 
          title: 'Erro ao carregar configurações', 
          description: 'Tente novamente.',
          variant: 'destructive' 
        });
      }
    };
    fetchConfiguracoes();
  }, [toast]);

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedTemplate(file);
      setFormData(prev => ({ ...prev, templateFile: file }));
      
      // Criar preview da primeira página
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ 
        title: 'Arquivo inválido', 
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive' 
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/svg+xml')) {
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({ 
        title: 'Arquivo inválido', 
        description: 'Por favor, selecione uma imagem PNG ou SVG.',
        variant: 'destructive' 
      });
    }
  };

  const handleSave = async () => {
    if (!formData.templateFile && formData.layoutTemplate === 'custom') {
      toast({ 
        title: 'Template obrigatório', 
        description: 'Faça upload de um template PDF ou selecione um template padrão.',
        variant: 'destructive' 
      });
      return;
    }

    if (formData.validade < 1 || formData.validade > 3650) {
      toast({ 
        title: 'Validade inválida', 
        description: 'A validade deve estar entre 1 e 3650 dias.',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      // Simular envio para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({ 
        title: 'Configurações salvas com sucesso!', 
        description: 'As alterações foram aplicadas ao sistema.' 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar configurações', 
        description: 'Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.validade >= 1 && formData.validade <= 3650 && 
    (formData.templateFile || formData.layoutTemplate !== 'custom');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Configurações de Certificado
          </CardTitle>
          <CardDescription>
            Personalize o template e conteúdo dos certificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              {/* Layout do Certificado */}
              <div>
                <Label className="text-sm font-medium">Layout do Certificado</Label>
                <div className="mt-2">
                  <select 
                    className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                    value={formData.layoutTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, layoutTemplate: e.target.value }))}
                  >
                    <option value="padrao">Template Padrão</option>
                    <option value="moderno">Template Moderno</option>
                    <option value="classico">Template Clássico</option>
                    <option value="custom">Template Personalizado</option>
                  </select>
                </div>
              </div>

              {/* Template do Certificado */}
              {formData.layoutTemplate === 'custom' && (
                <div>
                  <Label className="text-sm font-medium">Template do Certificado</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleTemplateUpload}
                      className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                    />
                  </div>
                  {templatePreview && (
                    <div className="mt-2">
                      <div className="relative w-32 h-40 border rounded-md overflow-hidden">
                        <iframe 
                          src={templatePreview} 
                          className="w-full h-full"
                          title="Preview do template"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setShowPreviewModal(true)}
                      >
                        Visualizar Exemplo
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Validade */}
              <div>
                <Label className="text-sm font-medium">Validade (dias)</Label>
                <div className="mt-2">
                  <Input 
                    type="number" 
                    min="1"
                    max="3650"
                    value={formData.validade}
                    onChange={(e) => setFormData(prev => ({ ...prev, validade: parseInt(e.target.value) || 0 }))}
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defina por quantos dias o certificado será válido
                  </p>
                </div>
              </div>

              {/* Assinatura Digital */}
              <div>
                <Label className="text-sm font-medium">Assinatura Digital</Label>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm">Ativada</span>
                  <Button 
                    variant={formData.assinaturaDigital ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, assinaturaDigital: !prev.assinaturaDigital }))}
                  >
                    {formData.assinaturaDigital ? 'Ativada' : 'Desativada'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              {/* QR Code */}
              <div>
                <Label className="text-sm font-medium">QR Code</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Incluir</span>
                    <Button 
                      variant={formData.qrCode ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, qrCode: !prev.qrCode }))}
                    >
                      {formData.qrCode ? 'Ativado' : 'Desativado'}
                    </Button>
                  </div>
                  {formData.qrCode && (
                    <select 
                      className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                      value={formData.qrCodePosition}
                      onChange={(e) => setFormData(prev => ({ ...prev, qrCodePosition: e.target.value }))}
                    >
                      <option value="topo">Topo</option>
                      <option value="rodape">Rodapé</option>
                      <option value="canto">Canto</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Informações do Signatário */}
              <div>
                <Label className="text-sm font-medium">Nome do Signatário</Label>
                <div className="mt-2">
                  <Input 
                    value={formData.nomeSignatario}
                    onChange={(e) => setFormData(prev => ({ ...prev, nomeSignatario: e.target.value }))}
                    placeholder="Ex: João Silva"
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Cargo do Signatário</Label>
                <div className="mt-2">
                  <Input 
                    value={formData.cargoSignatario}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargoSignatario: e.target.value }))}
                    placeholder="Ex: Diretor de Treinamento"
                    className="dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                  />
                </div>
              </div>

              {/* Logo */}
              <div>
                <Label className="text-sm font-medium">Logo da Empresa</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".png,.svg"
                    onChange={handleLogoUpload}
                    className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                  />
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain border rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Estilo */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Estilo do Certificado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Cor Primária</Label>
                <div className="mt-2">
                  <Input 
                    type="color" 
                    value={formData.corPrimaria}
                    onChange={(e) => setFormData(prev => ({ ...prev, corPrimaria: e.target.value }))}
                    className="w-full h-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Fonte do Texto</Label>
                <div className="mt-2">
                  <select 
                    className="w-full p-2 border rounded-md dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
                    value={formData.fonteTexto}
                    onChange={(e) => setFormData(prev => ({ ...prev, fonteTexto: e.target.value }))}
                  >
                    <option value="Roboto">Roboto</option>
                    <option value="Inter">Inter</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Alinhamento</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="esquerda"
                      name="alinhamento"
                      value="esquerda"
                      checked={formData.alinhamento === 'esquerda'}
                      onChange={(e) => setFormData(prev => ({ ...prev, alinhamento: e.target.value }))}
                    />
                    <Label htmlFor="esquerda" className="text-sm">Esquerda</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="centro"
                      name="alinhamento"
                      value="centro"
                      checked={formData.alinhamento === 'centro'}
                      onChange={(e) => setFormData(prev => ({ ...prev, alinhamento: e.target.value }))}
                    />
                    <Label htmlFor="centro" className="text-sm">Centro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="direita"
                      name="alinhamento"
                      value="direita"
                      checked={formData.alinhamento === 'direita'}
                      onChange={(e) => setFormData(prev => ({ ...prev, alinhamento: e.target.value }))}
                    />
                    <Label htmlFor="direita" className="text-sm">Direita</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!isFormValid || loading}
              className="bg-era-blue hover:bg-era-dark-green text-white"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Preview */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold dark:text-white">Preview do Certificado</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </Button>
              </div>
              <div className="border rounded-lg p-8 bg-gray-50 dark:bg-neutral-700">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CERTIFICADO</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Certificamos que <strong>Maria Santos</strong> concluiu com êxito o curso
                  </p>
                  <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                    Fundamentos de PABX
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    com carga horária de 20 horas
                  </p>
                  <div className="mt-8 pt-8 border-t">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      São Paulo, {new Date().toLocaleDateString('pt-BR')}
                    </p>
                    <div className="mt-4">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formData.nomeSignatario || 'João Silva'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formData.cargoSignatario || 'Diretor de Treinamento'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                  Fechar
                </Button>
                <Button className="bg-era-blue hover:bg-era-dark-green text-white">
                  Baixar PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente Integracoes
const Integracoes = () => {
  const { toast } = useToast();
  
  const handleSave = async () => {
    try {
      localStorage.setItem('pana-learn-config', JSON.stringify({}));
      toast({ 
        title: 'Configurações salvas com sucesso!', 
        description: 'As alterações foram aplicadas ao sistema.' 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar configurações', 
        description: 'Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Integrações & API
        </CardTitle>
        <CardDescription>
          Configure integrações externas e chaves de API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Chave da API</Label>
            <div className="mt-2 flex gap-2">
              <Input 
                type="password" 
                defaultValue="sk-..." 
                className="flex-1"
              />
              <Button variant="outline">Gerar Nova</Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Webhook URL</Label>
            <Input 
              type="url" 
              placeholder="https://sua-api.com/webhook" 
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Email SMTP</Label>
            <Input 
              type="email" 
              placeholder="smtp@exemplo.com" 
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Integrações</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente Seguranca
const Seguranca = () => {
  const { toast } = useToast();
  
  const handleSave = async () => {
    try {
      localStorage.setItem('pana-learn-config', JSON.stringify({}));
      toast({ 
        title: 'Configurações salvas com sucesso!', 
        description: 'As alterações foram aplicadas ao sistema.' 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar configurações', 
        description: 'Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive' 
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Segurança Avançada
        </CardTitle>
        <CardDescription>
          Configure medidas de segurança adicionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Autenticação de Dois Fatores (2FA)</Label>
            <div className="mt-2">
              <Button variant="outline" className="w-full justify-between">
                <span>Ativada</span>
                <div className="w-4 h-4 bg-primary rounded-full"></div>
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Sessões Ativas</Label>
            <div className="mt-2">
              <Button variant="outline" className="w-full">
                Ver Sessões (3 ativas)
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Logs de Acesso</Label>
            <div className="mt-2">
              <Button variant="outline" className="w-full">
                Ver Logs
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente principal de Configurações
const Configuracoes = () => {
  return (
    <ERALayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Preferencias />} />
          <Route path="/preferencias" element={<Preferencias />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/whitelabel" element={<WhiteLabel />} />
          <Route path="/certificado" element={<Certificado />} />
          <Route path="/quiz" element={<QuizConfig />} />
          <Route path="/integracoes" element={<Integracoes />} />
          <Route path="/seguranca" element={<Seguranca />} />
        </Routes>
      </div>
    </ERALayout>
  );
};

export default Configuracoes;
