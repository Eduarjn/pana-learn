import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings, Globe, Mail, Shield, Database, Bell,
  Palette, UserCheck, Award, Image as ImageIcon,
  Building, Upload, Check, Eye, RefreshCw, Loader2,
  Music, Trash2, Plus, Link, FileAudio, X
} from 'lucide-react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useQuizAudios } from '@/hooks/useQuizAudios';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBranding, defaultBranding } from '@/context/BrandingContext';
import { useTheme } from '@/components/theme-provider';

type TabKey = 'preferencias' | 'conta' | 'whitelabel' | 'audios' | 'integracoes' | 'seguranca';

const CONFIG_SECTIONS: { key: TabKey; label: string; icon: React.ComponentType<{className?:string}>; adminOnly: boolean }[] = [
  { key: 'preferencias', label: 'Preferências',     icon: Settings,  adminOnly: false },
  { key: 'conta',        label: 'Minha conta',      icon: UserCheck, adminOnly: false },
  { key: 'whitelabel',   label: 'White-Label',      icon: Palette,   adminOnly: true  },
  { key: 'audios',       label: 'Biblioteca de Áudios', icon: Music, adminOnly: true  },
  { key: 'integracoes',  label: 'Integrações & API', icon: Database, adminOnly: true  },
  { key: 'seguranca',    label: 'Segurança',        icon: Shield,    adminOnly: true  },
];

// ─── Seção: Preferências ──────────────────────────────────────────────────────

const Preferencias = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(localStorage.getItem('pl-fontsize') || 'medium');
  const [language, setLanguage] = useState(localStorage.getItem('pl-lang') || 'pt-BR');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('pl-fontsize', fontSize);
    localStorage.setItem('pl-lang', language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: 'Preferências salvas!' });
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={Palette} title="Aparência" desc="Tema e tamanho de fonte">
        <div className="space-y-5">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Tema</Label>
            <div className="flex gap-2">
              {[['light','Claro'],['dark','Escuro']].map(([val,label]) => (
                <button key={val} onClick={() => setTheme(val)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                    theme === val
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Tamanho da fonte</Label>
            <select value={fontSize} onChange={e => setFontSize(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-slate-400">
              <option value="small">Pequeno</option>
              <option value="medium">Médio</option>
              <option value="large">Grande</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Globe} title="Idioma" desc="Idioma da interface">
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-slate-400">
          <option value="pt-BR">Português (BR)</option>
          <option value="en-US">English (US)</option>
          <option value="es">Español</option>
        </select>
      </SectionCard>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  );
};

// ─── Seção: Conta ─────────────────────────────────────────────────────────────

const Conta = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${userProfile.id}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Erro no upload', variant: 'destructive' }); setUploading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    await supabase.from('usuarios').update({ avatar_url: data.publicUrl }).eq('id', userProfile.id);
    toast({ title: 'Foto atualizada!' });
    setUploading(false);
  };

  const handleChangePwd = async () => {
    if (!currentPwd || !newPwd) { toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return; }
    if (newPwd !== confirmPwd) { toast({ title: 'Senhas não coincidem', variant: 'destructive' }); return; }
    if (newPwd.length < 6) { toast({ title: 'Mínimo 6 caracteres', variant: 'destructive' }); return; }
    setChangingPwd(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: userProfile.email, password: currentPwd });
    if (signInErr) { toast({ title: 'Senha atual incorreta', variant: 'destructive' }); setChangingPwd(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setChangingPwd(false);
    if (error) { toast({ title: 'Erro ao alterar senha', variant: 'destructive' }); return; }
    toast({ title: 'Senha alterada!' });
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={UserCheck} title="Informações pessoais" desc="Foto de perfil e dados básicos">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
              : <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-medium text-slate-400">
                  {userProfile?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            }
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="border-slate-200 text-slate-600 text-sm flex items-center gap-2">
              {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Enviando...</>
                : <><Upload className="h-3.5 w-3.5" />Alterar foto</>}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            <p className="text-xs text-slate-400 mt-1">JPG, PNG ou GIF · máx. 5MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome</Label>
            <Input defaultValue={userProfile?.nome || ''} className="border-slate-200 text-sm rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Email</Label>
            <Input defaultValue={userProfile?.email || ''} disabled className="border-slate-200 text-sm rounded-lg bg-slate-50" />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Shield} title="Segurança" desc="Altere sua senha de acesso">
        <div className="space-y-3">
          {[
            ['currentPwd','Senha atual','password',currentPwd,setCurrentPwd],
            ['newPwd','Nova senha','password',newPwd,setNewPwd],
            ['confirmPwd','Confirmar nova senha','password',confirmPwd,setConfirmPwd],
          ].map(([id,label,type,val,fn]) => (
            <div key={id as string}>
              <Label className="text-xs font-medium text-slate-600 mb-1.5 block">{label as string}</Label>
              <Input type={type as string} value={val as string} onChange={e => (fn as Function)(e.target.value)}
                className="border-slate-200 text-sm rounded-lg" />
            </div>
          ))}
          <Button onClick={handleChangePwd} disabled={changingPwd || !currentPwd || !newPwd || newPwd !== confirmPwd}
            className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 mt-1">
            {changingPwd ? 'Alterando...' : 'Alterar senha'}
          </Button>
        </div>
      </SectionCard>
    </div>
  );
};

// ─── Seção: White-Label ───────────────────────────────────────────────────────

const WhiteLabel = () => {
  const { toast } = useToast();
  const { branding, updateBranding } = useBranding();

  // Estado local (edição sem salvar ainda)
  const [form, setForm] = useState({ ...branding });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincronizar quando branding externo mudar
  useEffect(() => { setForm({ ...branding }); }, [branding]);

  const set = (key: keyof typeof form, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  // Upload genérico para Supabase Storage
  const uploadFile = async (file: File, folder: string, name: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${name}.${ext}`;
    const { error } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl;
  };

  const handleImagePick = (
    field: 'logo_url' | 'background_url',
    setPreview: (v: string) => void,
    maxMB: number = 5
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Selecione uma imagem', variant: 'destructive' }); return; }
    if (file.size > maxMB * 1024 * 1024) { toast({ title: `Máximo ${maxMB}MB`, variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    // Guarda o file no estado para upload posterior
    setForm(prev => ({ ...prev, [`_file_${field}`]: file } as any));
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      const updates: Partial<typeof form> = { ...form };

      // Upload de arquivos pendentes
      if ((form as any)['_file_logo_url']) {
        updates.logo_url = await uploadFile((form as any)['_file_logo_url'], 'logos', 'main-logo');
        setLogoPreview(null);
      }
      if ((form as any)['_file_background_url']) {
        updates.background_url = await uploadFile((form as any)['_file_background_url'], 'backgrounds', 'login-bg');
        setBgPreview(null);
      }

      // Remove chaves internas _file_*
      const clean = Object.fromEntries(
        Object.entries(updates).filter(([k]) => !k.startsWith('_file_'))
      ) as Partial<typeof branding>;

      await updateBranding(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: 'Branding salvo!', description: 'As alterações já estão visíveis na plataforma.' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Restaurar as configurações padrão da plataforma?')) return;
    await updateBranding(defaultBranding);
    setForm({ ...defaultBranding });
    setLogoPreview(null);
    setBgPreview(null);
    toast({ title: 'Configurações restauradas!' });
  };

  // Preview em tempo real das cores (aplica ao vivo no onChange, não apenas no save)
  useEffect(() => {
    document.documentElement.style.setProperty('--preview-primary', form.primary_color);
    document.documentElement.style.setProperty('--accent', form.primary_color);
    document.documentElement.style.setProperty('--primary-color', form.primary_color);
  }, [form.primary_color]);

  useEffect(() => {
    document.documentElement.style.setProperty('--bg', form.secondary_color);
    document.documentElement.style.setProperty('--secondary-color', form.secondary_color);
  }, [form.secondary_color]);

  return (
    <div className="space-y-5">

      {/* Preview ao vivo */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Preview ao vivo</span>
          </div>
          <span className="text-xs text-slate-400">As alterações aparecem imediatamente</span>
        </div>
        <div className="p-5">
          <div className="rounded-xl overflow-hidden border border-slate-200" style={{ background: form.secondary_color }}>
            {/* Mini sidebar preview */}
            <div className="flex h-28">
              <div className="w-14 flex flex-col items-center pt-4 gap-3 border-r" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {logoPreview || form.logo_url
                  ? <img src={logoPreview || form.logo_url} alt="logo" className="w-8 h-8 object-contain rounded" />
                  : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: form.primary_color }}>{form.company_name.charAt(0)}</div>
                }
                {[1,2,3].map(i => <div key={i} className="w-6 h-1.5 rounded-full opacity-40" style={{ background: form.primary_color }} />)}
              </div>
              <div className="flex-1 p-4">
                <div className="text-white text-sm font-semibold mb-1">{form.company_name || 'Nome da empresa'}</div>
                <div className="text-xs mb-3 opacity-50 text-white">{form.company_slogan || 'Slogan'}</div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ background: form.primary_color }}>
                    Botão primário
                  </div>
                  <div className="px-3 py-1 rounded-lg text-xs font-medium border" style={{ borderColor: form.primary_color, color: form.primary_color }}>
                    Secundário
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Identidade */}
      <SectionCard icon={Building} title="Identidade da empresa" desc="Nome e slogan exibidos na plataforma">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome da empresa</Label>
            <Input value={form.company_name} onChange={e => set('company_name', e.target.value)}
              placeholder="Ex: Panalearn" className="border-slate-200 text-sm rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Slogan</Label>
            <Input value={form.company_slogan} onChange={e => set('company_slogan', e.target.value)}
              placeholder="Ex: Plataforma de Ensino Online" className="border-slate-200 text-sm rounded-lg" />
          </div>
        </div>
      </SectionCard>

      {/* Cores */}
      <SectionCard icon={Palette} title="Cores da marca" desc="Cor primária (botões, acentos, sidebar) e cor de fundo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Cor primária</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
              <Input value={form.primary_color} onChange={e => set('primary_color', e.target.value)}
                placeholder="#3AB26A" className="border-slate-200 text-sm rounded-lg font-mono" />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {['#3AB26A','#2563EB','#7C3AED','#EA580C','#DC2626','#0891B2','#CA8A04'].map(c => (
                <button key={c} onClick={() => set('primary_color', c)}
                  className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: form.primary_color === c ? '#1e293b' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Cor de fundo / sidebar</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={form.secondary_color} onChange={e => set('secondary_color', e.target.value)}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
              <Input value={form.secondary_color} onChange={e => set('secondary_color', e.target.value)}
                placeholder="#1E1B4B" className="border-slate-200 text-sm rounded-lg font-mono" />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {['#0F172A','#1E1B4B','#18181B','#0B0F0C','#1C1917','#0F1629','#161B22'].map(c => (
                <button key={c} onClick={() => set('secondary_color', c)}
                  className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                  style={{ background: c, borderColor: form.secondary_color === c ? '#94a3b8' : 'transparent' }} />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Logo */}
      <SectionCard icon={ImageIcon} title="Logo e imagens" desc="Logo principal e imagem de fundo da tela de login">
        <div className="space-y-5">
          {/* Logo principal */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Logo principal</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoPreview || form.logo_url
                  ? <img src={logoPreview || form.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
                  : <ImageIcon className="h-6 w-6 text-slate-300" />
                }
              </div>
              <div>
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Escolher arquivo
                  </div>
                </label>
                <input id="logo-upload" type="file" accept="image/*"
                  onChange={handleImagePick('logo_url', setLogoPreview, 5)} className="hidden" />
                <p className="text-xs text-slate-400 mt-1">PNG, SVG, JPG · máx. 5MB · fundo transparente recomendado</p>
              </div>
            </div>
          </div>

          {/* Imagem de fundo */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Imagem de fundo (tela de login)</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {bgPreview || form.background_url
                  ? <img src={bgPreview || form.background_url} alt="bg" className="w-full h-full object-cover" />
                  : <ImageIcon className="h-5 w-5 text-slate-300" />
                }
              </div>
              <div>
                <label htmlFor="bg-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Escolher imagem
                  </div>
                </label>
                <input id="bg-upload" type="file" accept="image/*"
                  onChange={handleImagePick('background_url', setBgPreview, 10)} className="hidden" />
                <p className="text-xs text-slate-400 mt-1">JPG, PNG · máx. 10MB · resolução mínima 1280×720</p>
                {form.background_url && (
                  <button onClick={() => set('background_url', '')}
                    className="text-xs text-rose-500 hover:text-rose-700 mt-1">
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Botões */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={handleReset}
          className="border-slate-200 text-slate-500 hover:text-slate-700 text-sm flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Restaurar padrão
        </Button>
        <SaveButton onClick={handleSave} saved={saved} loading={uploading} label="Salvar branding" />
      </div>
    </div>
  );
};

// ─── Seção: Integrações ───────────────────────────────────────────────────────

const Integracoes = () => {
  const { toast } = useToast();
  const [apiKey] = useState('sk-••••••••••••••••');
  const [webhook, setWebhook] = useState('');
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpPwd, setSmtpPwd] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: 'Integrações salvas!' });
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={Database} title="API REST" desc="Chave e webhook para integrações externas">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Chave da API</Label>
            <div className="flex gap-2">
              <Input value={apiKey} readOnly className="border-slate-200 text-sm rounded-lg font-mono flex-1" />
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 text-xs px-3">Gerar nova</Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Use esta chave no header <code className="bg-slate-100 px-1 rounded">Authorization: Bearer sk-...</code></p>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Webhook URL</Label>
            <Input value={webhook} onChange={e => setWebhook(e.target.value)}
              placeholder="https://sua-api.com/webhook" className="border-slate-200 text-sm rounded-lg" />
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Mail} title="Servidor de e-mail (SMTP)" desc="Configurações para envio de notificações e certificados">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Endereço SMTP</Label>
            <Input value={smtpEmail} onChange={e => setSmtpEmail(e.target.value)}
              placeholder="smtp@exemplo.com" className="border-slate-200 text-sm rounded-lg" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Porta</Label>
            <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
              placeholder="587" className="border-slate-200 text-sm rounded-lg" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Senha SMTP</Label>
            <Input type="password" value={smtpPwd} onChange={e => setSmtpPwd(e.target.value)}
              placeholder="••••••••" className="border-slate-200 text-sm rounded-lg" />
          </div>
        </div>
      </SectionCard>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  );
};

// ─── Seção: Segurança ─────────────────────────────────────────────────────────

const Seguranca = () => {
  const { toast } = useToast();
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTime, setSessionTime] = useState('8');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: 'Configurações de segurança salvas!' });
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={Shield} title="Autenticação" desc="Configurações de login e sessão">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Autenticação de dois fatores (2FA)</p>
              <p className="text-xs text-slate-400 mt-0.5">Exige um segundo método de verificação no login</p>
            </div>
            <button onClick={() => setTwoFA(!twoFA)}
              className={`relative w-11 h-6 rounded-full transition-colors ${twoFA ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${twoFA ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-2 block">Tempo de expiração da sessão</Label>
            <select value={sessionTime} onChange={e => setSessionTime(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm">
              <option value="1">1 hora</option>
              <option value="8">8 horas</option>
              <option value="24">24 horas</option>
              <option value="168">7 dias</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Bell} title="Monitoramento" desc="Sessões ativas e logs de acesso">
        <div className="space-y-3">
          {[
            ['Sessões ativas', '3 dispositivos conectados'],
            ['Logs de acesso', 'Últimas 30 entradas'],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 text-xs">Ver</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveButton onClick={handleSave} saved={saved} />
    </div>
  );
};

// ─── Shared components ────────────────────────────────────────────────────────

const SectionCard = ({ icon: Icon, title, desc, children }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; children: React.ReactNode;
}) => (
  <div style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 32, height: 32, background: 'rgba(252,163,17,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon className="h-4 w-4" style={{ color: '#FCA311' }} />
      </div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>{title}</h3>
        <p style={{ fontSize: 12, color: 'rgba(229,229,229,0.45)' }}>{desc}</p>
      </div>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const SaveButton = ({ onClick, saved, loading = false, label = 'Salvar alterações' }: {
  onClick: () => void; saved: boolean; loading?: boolean; label?: string;
}) => (
  <div className="flex justify-end">
    <Button onClick={onClick} disabled={loading || saved}
      className="text-sm px-5 flex items-center gap-2 min-w-[160px] justify-center"
      style={{ backgroundColor: saved ? '#22c55e' : '#FCA311', color: '#000000', fontWeight: 700 }}>
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
        : saved
        ? <><Check className="h-4 w-4" />Salvo!</>
        : label
      }
    </Button>
  </div>
);
// ─── Seção: Biblioteca de Áudios ──────────────────────────────────────────────

const BibliotecaAudios = () => {
  const { toast } = useToast();
  const { audios, loading, uploading, uploadAudioFile, addAudioByUrl, deleteAudio } = useQuizAudios();
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'upload' | 'url'>('upload');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [urlExterna, setUrlExterna] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setNome(''); setDescricao(''); setCategoria(''); setUrlExterna('');
    setSelectedFile(null); setShowForm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast({ title: 'Erro', description: 'Selecione um arquivo de áudio (MP3, WAV, etc.)', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    if (!nome) setNome(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome do áudio.', variant: 'destructive' });
      return;
    }
    try {
      if (formMode === 'upload') {
        if (!selectedFile) {
          toast({ title: 'Erro', description: 'Selecione um arquivo.', variant: 'destructive' });
          return;
        }
        await uploadAudioFile(selectedFile, { nome: nome.trim(), descricao: descricao.trim(), categoria: categoria.trim() });
      } else {
        if (!urlExterna.trim()) {
          toast({ title: 'Erro', description: 'Informe a URL do áudio.', variant: 'destructive' });
          return;
        }
        await addAudioByUrl({ nome: nome.trim(), descricao: descricao.trim(), audio_url: urlExterna.trim(), categoria: categoria.trim() });
      }
      toast({ title: 'Sucesso', description: 'Áudio adicionado à biblioteca!' });
      resetForm();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao importar áudio.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este áudio da biblioteca?')) return;
    setDeleting(id);
    try {
      await deleteAudio(id);
      toast({ title: 'Sucesso', description: 'Áudio excluído!' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <SectionCard icon={Music} title="Biblioteca de Áudios" desc="Importe áudios para usar nas perguntas de quiz">
        {/* Add button */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            style={{ background: '#FCA311', color: '#000', fontWeight: 700 }}
            className="flex items-center gap-2 text-sm mb-4"
          >
            <Plus className="h-4 w-4" />Importar Áudio
          </Button>
        )}

        {/* Import form */}
        {showForm && (
          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(252,163,17,0.15)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div className="flex items-center justify-between mb-4">
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#FCA311' }}>Importar Áudio</h4>
              <button onClick={resetForm} className="text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              {([['upload', 'Upload de arquivo', FileAudio], ['url', 'URL externa', Link]] as const).map(([mode, label, Icon]) => (
                <button key={mode} onClick={() => setFormMode(mode)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2"
                  style={{
                    background: formMode === mode ? 'rgba(252,163,17,0.15)' : 'transparent',
                    borderColor: formMode === mode ? 'rgba(252,163,17,0.4)' : 'rgba(255,255,255,0.1)',
                    color: formMode === mode ? '#FCA311' : 'rgba(229,229,229,0.6)',
                  }}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {formMode === 'upload' ? (
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Arquivo de áudio *</Label>
                  <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 px-4 rounded-lg border-2 border-dashed transition-colors text-center"
                    style={{ borderColor: selectedFile ? 'rgba(252,163,17,0.4)' : 'rgba(255,255,255,0.1)', background: selectedFile ? 'rgba(252,163,17,0.05)' : 'transparent' }}>
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileAudio className="h-5 w-5" style={{ color: '#FCA311' }} />
                        <span style={{ color: '#FCA311', fontSize: 13, fontWeight: 500 }}>{selectedFile.name}</span>
                        <span style={{ color: 'rgba(229,229,229,0.4)', fontSize: 11 }}>({formatSize(selectedFile.size)})</span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-6 w-6 mx-auto mb-2" style={{ color: 'rgba(229,229,229,0.3)' }} />
                        <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>Clique para selecionar um arquivo MP3</p>
                        <p style={{ color: 'rgba(229,229,229,0.3)', fontSize: 11, marginTop: 4 }}>MP3, WAV, OGG — até 50MB</p>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">URL do áudio *</Label>
                  <Input value={urlExterna} onChange={e => setUrlExterna(e.target.value)}
                    placeholder="https://exemplo.com/audio.mp3"
                    className="border-slate-700 bg-slate-900 text-white text-sm" />
                </div>
              )}

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Nome *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Gravação de atendimento #1"
                  className="border-slate-700 bg-slate-900 text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Categoria</Label>
                  <Input value={categoria} onChange={e => setCategoria(e.target.value)}
                    placeholder="Ex: Call Center"
                    className="border-slate-700 bg-slate-900 text-white text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Descrição</Label>
                  <Input value={descricao} onChange={e => setDescricao(e.target.value)}
                    placeholder="Opcional"
                    className="border-slate-700 bg-slate-900 text-white text-sm" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSubmit} disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                  style={{ background: '#FCA311', color: '#000', fontWeight: 700 }}>
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" />Importando...</> : <><Upload className="h-4 w-4" />Importar</>}
                </Button>
                <Button onClick={resetForm} variant="outline" className="border-slate-700 text-slate-400 text-sm">Cancelar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Audio list */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" style={{ color: '#FCA311' }} />
            <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>Carregando áudios...</p>
          </div>
        ) : audios.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-10 w-10 mx-auto mb-3" style={{ color: 'rgba(229,229,229,0.2)' }} />
            <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 13 }}>Nenhum áudio importado ainda.</p>
            <p style={{ color: 'rgba(229,229,229,0.3)', fontSize: 12, marginTop: 4 }}>Clique em "Importar Áudio" para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {audios.map(audio => (
              <div key={audio.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(252,163,17,0.1)', borderRadius: 10, padding: '12px 16px' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileAudio className="h-4 w-4 flex-shrink-0" style={{ color: '#FCA311' }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{audio.nome}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {audio.categoria && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(252,163,17,0.1)', color: '#FCA311', fontWeight: 600 }}>{audio.categoria}</span>}
                      <span style={{ fontSize: 11, color: 'rgba(229,229,229,0.4)' }}>{formatSize(audio.tamanho_bytes)}</span>
                      <span style={{ fontSize: 11, color: 'rgba(229,229,229,0.4)' }}>{new Date(audio.data_criacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(audio.id)} disabled={deleting === audio.id}
                    style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === audio.id ? 0.5 : 1 }}>
                    {deleting === audio.id ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#f87171' }} /> : <Trash2 className="h-3 w-3" style={{ color: '#f87171' }} />}
                  </button>
                </div>
                <AudioPlayer src={audio.audio_url} compact />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};



const TAB_COMPONENTS: Record<TabKey, React.FC> = {
  preferencias: Preferencias,
  conta: Conta,
  whitelabel: WhiteLabel,
  audios: BibliotecaAudios,
  integracoes: Integracoes,
  seguranca: Seguranca,
};

const Configuracoes = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';
  const [activeTab, setActiveTab] = useState<TabKey>('preferencias');

  const visible = CONFIG_SECTIONS.filter(s => !s.adminOnly || isAdmin);
  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <ERALayout>
      <div style={{ minHeight: '100vh', background: '#08111f' }}>
        {/* Header */}
        <div style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)', borderRadius: 16, margin: '4px 4px 24px 4px', overflow: 'hidden' }}>
          <div style={{ padding: '32px 40px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(252,163,17,0.1)', border: '1px solid rgba(252,163,17,0.25)', color: '#FCA311', fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 99, marginBottom: 12 }}>
              <Settings className="w-3 h-3" />
              Configurações
            </span>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', margin: '8px 0 4px' }}>Configurações</h1>
            <p style={{ color: 'rgba(229,229,229,0.5)', fontSize: 14 }}>Personalize a plataforma e gerencie sua conta.</p>
          </div>
        </div>

        <div style={{ padding: '0 4px 32px' }}>
          <div style={{ display: 'flex', gap: 20, flexDirection: 'row' }}>
            {/* Sidebar de abas */}
            <nav style={{ width: 210, flexShrink: 0 }}>
              <div style={{ background: '#14213D', border: '1px solid rgba(252,163,17,0.12)', borderRadius: 12, overflow: 'hidden' }}>
                {visible.map(s => {
                  const active = activeTab === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveTab(s.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                        padding: '12px 16px', fontSize: 14, border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: active ? '3px solid #FCA311' : '3px solid transparent',
                        background: active ? 'rgba(252,163,17,0.1)' : 'transparent',
                        color: active ? '#FCA311' : 'rgba(229,229,229,0.7)',
                        fontWeight: active ? 600 : 400,
                        textAlign: 'left', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(252,163,17,0.05)'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <s.icon className="h-4 w-4" style={{ flexShrink: 0 }} />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Conteúdo da aba ativa */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </ERALayout>
  );
};

export default Configuracoes;
