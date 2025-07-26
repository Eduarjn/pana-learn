import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [tipoUsuario, setTipoUsuario] = useState<'admin' | 'cliente'>('cliente');
  const [senhaValidacao, setSenhaValidacao] = useState('');
  const SENHA_ADMIN = 'superadmin123';

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('🔐 Iniciando login:', { email });

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message || 'Erro no login');
        console.error('❌ Erro de login:', error);
      } else {
        console.log('✅ Login realizado com sucesso');
      }
    } catch (err) {
      console.error('❌ Erro inesperado no login:', err);
      setError('Erro inesperado no sistema');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nome = formData.get('nome') as string;

    console.log('📝 Iniciando cadastro:', { email, nome });

    if (!nome || nome.trim() === '') {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    if (!email || email.trim() === '') {
      setError('Email é obrigatório');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (tipoUsuario === 'admin' && senhaValidacao !== SENHA_ADMIN) {
      setError('Senha de validação para administrador incorreta!');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, nome.trim(), tipoUsuario, tipoUsuario === 'admin' ? senhaValidacao : null);
      
      if (error) {
        console.error('❌ Erro no cadastro:', error);
        setError(error.message || 'Erro ao criar conta');
      } else {
        setMessage('Conta criada com sucesso! Verifique seu e-mail para finalizar o cadastro antes de fazer login.');
        console.log('✅ Cadastro realizado com sucesso');
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      console.error('❌ Erro inesperado no cadastro:', err);
      setError('Erro inesperado no sistema');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background com livros e laptop desfocados */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20">
        {/* Livro no lado esquerdo */}
        <div className="absolute left-10 top-1/4 w-32 h-40 bg-white/20 backdrop-blur-sm rounded-lg transform rotate-12 shadow-2xl"></div>
        
        {/* Estantes de livros desfocadas */}
        <div className="absolute left-20 top-1/3 w-48 h-64 bg-gradient-to-b from-amber-200/30 to-orange-300/30 backdrop-blur-md rounded-lg transform -rotate-6 shadow-xl"></div>
        
        {/* Laptop no lado direito */}
        <div className="absolute right-20 top-1/3 w-56 h-40 bg-gray-800/30 backdrop-blur-sm rounded-lg transform rotate-3 shadow-2xl">
          <div className="absolute inset-2 bg-blue-400/20 rounded"></div>
        </div>
        
        {/* Elementos decorativos adicionais */}
        <div className="absolute left-1/4 top-1/2 w-24 h-32 bg-green-200/20 backdrop-blur-sm rounded-lg transform -rotate-12"></div>
        <div className="absolute right-1/4 bottom-1/4 w-20 h-28 bg-red-200/20 backdrop-blur-sm rounded-lg transform rotate-6"></div>
      </div>

      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Container principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo e título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ERA <span className="text-green-400">Learn</span>
          </h1>
          <p className="text-white/80 text-sm">Plataforma de Ensino Online</p>
        </div>

        {/* Card de login com glassmorphism */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* Abas de navegação */}
          <div className="flex mb-6 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          {/* Título do formulário */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'login' ? 'Fazer Login' : 'Criar Conta'}
            </h2>
            <p className="text-white/70 text-sm mt-1">
              {activeTab === 'login' 
                ? 'Entre com suas credenciais para acessar a plataforma'
                : 'Preencha os dados para criar sua conta'
              }
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
              <p className="text-green-200 text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Formulário de Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 pr-12 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          )}

          {/* Formulário de Cadastro */}
          {activeTab === 'register' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Input
                  name="nome"
                  type="text"
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <Input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                                  <select
                    name="tipo_usuario"
                    value={tipoUsuario}
                    onChange={e => setTipoUsuario(e.target.value as 'admin' | 'cliente')}
                    className="w-full bg-white/10 border-white/20 text-white rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                  >
                    <option value="cliente" className="bg-gray-800 text-white">Cliente</option>
                    <option value="admin" className="bg-gray-800 text-white">Administrador</option>
                  </select>
              </div>
              {tipoUsuario === 'admin' && (
                <div>
                  <Input
                    name="senha_validacao"
                    type="password"
                    required={tipoUsuario === 'admin'}
                    value={senhaValidacao}
                    onChange={e => setSenhaValidacao(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder-white/60 rounded-lg px-4 py-3 focus:bg-white/15 focus:border-white/40 transition-all duration-200"
                    placeholder="Digite a senha de validação"
                  />
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-xs">
            {activeTab === 'login' 
              ? 'Não tem uma conta? Clique em "Cadastrar" acima'
              : 'Já tem uma conta? Clique em "Entrar" acima'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
