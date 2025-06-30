import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState('cliente');
  const [senhaValidacao, setSenhaValidacao] = useState('');
  const SENHA_ADMIN = 'superadmin123'; // Defina a senha especial

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
        // Redirecionamento será feito automaticamente
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

    // Validações básicas
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
        setMessage('Conta criada com sucesso! Você pode fazer login agora.');
        console.log('✅ Cadastro realizado com sucesso');
        // Limpar formulário
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      console.error('❌ Erro inesperado no cadastro:', err);
      setError('Erro inesperado no sistema');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/aafcc16a-d43c-4f66-9fa4-70da46d38ccb.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="backdrop-blur-md bg-white/95 border-white/30 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-era-dark-blue rounded-lg flex items-center justify-center">
                <img 
                  src="/lovable-uploads/92441561-a944-48ee-930e-7e3b16318673.png" 
                  alt="Platform Symbol" 
                  className="w-6 h-6 filter invert"
                />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-era-dark-blue">PANA LEARN</CardTitle>
                <p className="text-xs text-era-gray">Smart Training Platform</p>
              </div>
            </div>
            <CardDescription className="text-era-gray">
              Acesse sua plataforma de treinamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Usuários de Teste */}
            <div className="mb-6 p-4 bg-era-lime/10 rounded-lg border border-era-lime/20">
              <h3 className="text-sm font-semibold text-era-dark-blue mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Credenciais de Teste:
              </h3>
              <div className="text-xs text-era-gray space-y-1">
                <p><strong>Admin:</strong> admin@panalearn.com / test123456</p>
                <p><strong>Cliente:</strong> cliente@panalearn.com / test123456</p>
              </div>
            </div>

            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-era-light-gray">
                <TabsTrigger value="signin" className="data-[state=active]:bg-era-lime data-[state=active]:text-era-dark-blue text-era-dark-blue">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-era-lime data-[state=active]:text-era-dark-blue text-era-dark-blue">
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-era-dark-blue font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      defaultValue="admin@panalearn.com"
                      className="form-input"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-era-dark-blue font-medium">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        defaultValue="test123456"
                        className="form-input pr-12"
                        placeholder="Sua senha"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-era-gray hover:text-era-dark-blue"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full era-lime-button text-era-dark-blue font-semibold" 
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
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome" className="text-era-dark-blue font-medium">Nome completo *</Label>
                    <Input
                      id="signup-nome"
                      name="nome"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-era-dark-blue font-medium">Email *</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      className="form-input"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-era-dark-blue font-medium">Senha *</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="form-input"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-tipo" className="text-era-dark-blue font-medium">Tipo de Usuário *</Label>
                    <select
                      id="signup-tipo"
                      name="tipo_usuario"
                      value={tipoUsuario}
                      onChange={e => setTipoUsuario(e.target.value)}
                      className="form-input"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  {tipoUsuario === 'admin' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-senha-validacao" className="text-era-dark-blue font-medium">Senha de validação para admin *</Label>
                      <Input
                        id="signup-senha-validacao"
                        name="senha_validacao"
                        type="password"
                        required={tipoUsuario === 'admin'}
                        value={senhaValidacao}
                        onChange={e => setSenhaValidacao(e.target.value)}
                        className="form-input"
                        placeholder="Digite a senha de validação"
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full era-lime-button" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Criar conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
