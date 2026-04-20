import { ERALayout } from '@/components/ERALayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings, Globe, Mail, Shield, Database, Bell,
  Palette, UserCheck, Award, Image as ImageIcon,
  Building, Upload, Check, Eye, RefreshCw, Loader2
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useBranding, defaultBranding } from '@/context/BrandingContext';

// ─── Nav lateral de configurações ─────────────────────────────────────────────

const CONFIG_SECTIONS = [
  { path: '/configuracoes/preferencias', label: 'Preferências',    icon: Settings,   adminOnly: false },
  { path: '/configuracoes/conta',        label: 'Minha conta',     icon: UserCheck,  adminOnly: false },
  { path: '/configuracoes/whitelabel',   label: 'White-Label',     icon: Palette,    adminOnly: true  },
  { path: '/configuracoes/integracoes',  label: 'Integrações & API', icon: Database, adminOnly: true  },
  { path: '/configuracoes/seguranca',    label: 'Segurança',       icon: Shield,     adminOnly: true  },
];

const ConfigLayout = ({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) => {
  const location = useLocation();
  const visible = CONFIG_SECTIONS.filter(s => !s.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 rounded-2xl mx-1 mt-1 mb-6 overflow-hidden">
        <div className="px-6 py-8 md:px-10 md:py-10">
          <span className="inline-flex items-center gap-1.5 bg-slate-500/15 border border-slate-500/30 text-slate-400 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <Settings className="w-3 h-3" />
            Configurações
          </span>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400 text-sm mt-1">Personalize a plataforma e gerencie sua conta.</p>
        </div>
      </div>

      <div className="px-1 pb-8">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Nav lateral */}
          <nav className="lg:w-52 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {visible.map(s => {
                const active = location.pathname === s.path ||
                  (s.path === '/configuracoes/preferencias' && location.pathname === '/configuracoes');
                return (
                  <NavLink key={s.path} to={s.path}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-slate-100 last:border-0 ${
                      active
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <s.icon className="h-4 w-4 flex-shrink-0" />
                    {s.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
};

// ─── Seção: Preferências ──────────────────────────────────────────────────────

const Preferencias = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState(localStorage.getItem('pl-theme') || 'light');
  const [fontSize, setFontSize] = useState(localStorage.getItem('pl-fontsize') || 'medium');
  const [language, setLanguage] = useState(localStorage.getItem('pl-lang') || 'pt-BR');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('pl-theme', theme);
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
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
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
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const SaveButton = ({ onClick, saved, loading = false, label = 'Salvar alterações' }: {
  onClick: () => void; saved: boolean; loading?: boolean; label?: string;
}) => (
  <div className="flex justify-end">
    <Button onClick={onClick} disabled={loading || saved}
      className="text-white text-sm px-5 flex items-center gap-2 min-w-[160px] justify-center"
      style={{ backgroundColor: saved ? '#10B981' : '#0F172A' }}>
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
        : saved
        ? <><Check className="h-4 w-4" />Salvo!</>
        : label
      }
    </Button>
  </div>
);

// ─── Componente raiz ──────────────────────────────────────────────────────────

const Configuracoes = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.tipo_usuario === 'admin' || userProfile?.tipo_usuario === 'admin_master';

  return (
    <ERALayout>
      <ConfigLayout isAdmin={isAdmin}>
        <Routes>
          <Route path="/"             element={<Preferencias />} />
          <Route path="/preferencias" element={<Preferencias />} />
          <Route path="/conta"        element={<Conta />} />
          <Route path="/whitelabel"   element={<WhiteLabel />} />
          <Route path="/integracoes"  element={<Integracoes />} />
          <Route path="/seguranca"    element={<Seguranca />} />
        </Routes>
      </ConfigLayout>
    </ERALayout>
  );
};

export default Configuracoes;
