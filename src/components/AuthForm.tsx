import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../context/BrandingContext';
import { resolveLogoPath, resolveBackgroundPath, imageFallbacks } from '@/utils/imageUtils';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ModernInput = ({ label, id, endIcon, placeholder, ...props }: any) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-white/90">
      {label}
    </label>
    <div className="relative group">
      <input
        id={id}
        placeholder={placeholder}
        {...props}
        style={{ caretColor: '#fff', color: '#fff' }}
        className="auth-input w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3.5 focus:bg-white/10 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 outline-none shadow-sm"
      />
      {endIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-indigo-300 transition-colors">
          {endIcon}
        </div>
      )}
    </div>
    {/* Override do autofill do navegador: texto preenchido fica branco e legível
        no fundo escuro (Chrome troca a cor por padrão, deixando invisível). */}
    <style>{`
      .auth-input:-webkit-autofill,
      .auth-input:-webkit-autofill:hover,
      .auth-input:-webkit-autofill:focus,
      .auth-input:-webkit-autofill:active {
        -webkit-text-fill-color: #ffffff !important;
        caret-color: #ffffff !important;
        -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.06) inset !important;
        transition: background-color 9999s ease-in-out 0s;
      }
    `}</style>
  </div>
);

export function AuthForm() {
  const { signIn } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<'login' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Erro ao fazer login');
      } else {
        setMessage('Login realizado com sucesso!');
      }
    } catch (err) {
      setError('Erro inesperado no sistema');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResetError('');
    setResetMessage('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('reset-email') as string;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setResetError(error.message || 'Erro ao enviar email de recuperação');
      } else {
        setResetMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setResetEmail('');
      }
    } catch (err) {
      setResetError('Erro inesperado no sistema');
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Animated Premium SaaS Background */}
      <div className="absolute inset-0 bg-[#060814] overflow-hidden">
        {/* Soft Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/15 blur-[140px] animate-pulse" style={{ animationDuration: '14s' }}></div>
        <div className="absolute top-[40%] right-[30%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        
        {/* Subtle Grid Texture for Depth */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="text-center mb-10 flex flex-col items-center w-full">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-500/40 blur-2xl rounded-full"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] flex items-center justify-center shadow-2xl overflow-hidden p-3">
              <img
                src="/brand/panalearn-mark-white.png"
                alt={`${branding.company_name || 'PanaLearn'} Logo`}
                className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  /* fallback: versão indigo com filter */
                  e.currentTarget.src = '/brand/panalearn-mark-indigo.png';
                  e.currentTarget.style.filter = 'brightness(0) invert(1)';
                }}
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight"
            style={{ fontFamily: "Quicksand, var(--font-display, 'Inter'), sans-serif" }}
          >
            {activeTab === 'login' ? `Bem-vindo ao ${branding.company_name || 'PanaLearn'}` : 'Recuperar senha'}
          </h1>
          <p className="text-white/60 text-base mt-2 font-medium">
            {activeTab === 'login' ? 'Faça login para acessar seu ambiente' : 'Enviaremos um link para redefinir sua senha'}
          </p>
        </div>

        {/* Premium Glassmorphism Card */}
        <div className="w-full relative backdrop-blur-2xl bg-slate-900/40 border border-white/10 rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] p-8 sm:p-10 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Alerts */}
            {(error || resetError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 shadow-inner">
                <div className="mt-0.5"><Lock className="w-4 h-4 text-red-400" /></div>
                <p className="text-red-200 text-sm">{error || resetError}</p>
              </div>
            )}
            {(message || resetMessage) && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 shadow-inner">
                <div className="mt-0.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                <p className="text-emerald-200 text-sm">{message || resetMessage}</p>
              </div>
            )}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                <ModernInput 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  label="E-mail corporativo" 
                  placeholder="exemplo@empresa.com"
                />
                
                <div className="space-y-2">
                  <ModernInput 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    label="Senha"
                    placeholder="Sua senha segura"
                    endIcon={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none p-1 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                  <div className="flex justify-between items-center px-1 pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="w-4 h-4 rounded border border-white/20 bg-white/5 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all shadow-inner"></div>
                        <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors">Lembrar-me</span>
                    </label>
                    <button type="button" onClick={() => setActiveTab('forgot')} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:hover:scale-100 group mt-4 border border-white/10"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Entrar na plataforma <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>}
                </Button>
              </form>
            )}

            {/* Forgot Password Form */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <ModernInput id="reset-email" name="reset-email" type="email" required label="E-mail de recuperação" placeholder="Seu e-mail cadastrado" value={resetEmail} onChange={(e: any) => setResetEmail(e.target.value)} />
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-70 disabled:hover:scale-100 mt-4 border border-white/10"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar instruções de acesso'}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Tab Switching Footer — apenas recuperar senha */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-white/60 text-sm font-medium">
            {activeTab === 'login' ? (
              <>Esqueceu sua senha? <button onClick={() => setActiveTab('forgot')} className="text-white hover:text-indigo-400 font-bold transition-colors ml-1">Recuperar acesso</button></>
            ) : (
              <>Lembrou sua senha? <button onClick={() => setActiveTab('login')} className="text-white hover:text-indigo-400 font-bold transition-colors ml-1">Voltar ao login</button></>
            )}
          </p>
        </div>

        {/* Trust Layer */}
        <div className="mt-12 flex items-center justify-center gap-2 text-white/30 text-[10px] sm:text-[11px] uppercase tracking-widest font-bold relative z-10">
          <Lock className="w-3 h-3" />
          <span>Secure login powered by Supabase</span>
        </div>

      </div>
    </div>
  );
}

