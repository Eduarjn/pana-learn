import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Globe, Mail, Shield, Database, Bell, Palette } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Configuracoes = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isAdmin = userProfile?.tipo_usuario === 'admin';

  const [config, setConfig] = useState({
    // Configurações Gerais
    nomeEmpresa: 'PANA LEARN',
    slogan: 'Smart Training',
    email: 'admin@panalearn.com',
    telefone: '+55 (11) 99999-9999',
    endereco: 'Rua das Empresas, 123 - São Paulo/SP',
    
    // Configurações de Sistema
    maxUsuarios: '100',
    tempoSessao: '120',
    backup: 'Diário',
    manutencao: 'Domingo 02:00',
    
    // Configurações de Notificações
    emailNotificacoes: true,
    pushNotificacoes: true,
    relatoriosAutomaticos: true,
    
    // Configurações de Certificados
    validadeCertificado: '365',
    modeloCertificado: 'Padrão PANA',
    assinaturaDigital: true
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConfigChange = (field: string, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Salvar configurações no localStorage (ou banco de dados se necessário)
      localStorage.setItem('pana-learn-config', JSON.stringify(config));
      
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

  // Função para alterar senha
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
    // Validar senha atual
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: userProfile.email, password: currentPassword });
    if (signInError) {
      toast({ title: 'Senha atual incorreta', variant: 'destructive' });
      setChangingPassword(false);
      return;
    }
    // Atualizar senha
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    }
  };

  // Função para upload de foto de perfil
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
    // Atualizar perfil
    await supabase.from('usuarios').update({ avatar_url: data.publicUrl }).eq('id', userProfile.id);
    toast({ title: 'Foto de perfil atualizada!' });
    setUploading(false);
  };

  return (
    <ERALayout>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-era-dark-blue">Configurações</h1>
          <p className="text-era-gray">Gerencie sua conta</p>
        </div>
        {/* Foto de perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-era-dark-blue">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <img
              src={avatarUrl || '/placeholder.svg'}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border"
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Selecionar Foto'}
            </Button>
          </CardContent>
        </Card>
        {/* Alterar senha */}
        <Card>
          <CardHeader>
            <CardTitle className="text-era-dark-blue">Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ERALayout>
  );
};

export default Configuracoes;
