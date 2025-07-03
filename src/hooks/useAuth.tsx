import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  nome: string;
  tipo_usuario: 'admin' | 'cliente';
  status: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | { message: string } | null }>;
  signUp: (email: string, password: string, nome: string, tipo_usuario: 'admin' | 'cliente', senha_validacao: string) => Promise<{ error: Error | { message: string } | null }>;
  signOut: () => Promise<void>;
  createTestUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState("cliente");
  const [senhaValidacao, setSenhaValidacao] = useState("");

  // Usuários de teste
  const testUsers = [
    {
      id: 'test-admin-id',
      email: 'admin@eralearn.com',
      nome: 'Administrador ERA',
      tipo_usuario: 'admin' as const,
      senha: 'test123456',
      status: 'ativo'
    },
    {
      id: 'test-client-id',
      email: 'cliente@eralearn.com',
      nome: 'Cliente Teste',
      tipo_usuario: 'cliente' as const,
      senha: 'test123456',
      status: 'ativo'
    }
  ];

  const createTestUsers = async () => {
    console.log('👥 Usuários de teste disponíveis:');
    testUsers.forEach(user => {
      console.log(`✅ ${user.email} - Senha: ${user.senha}`);
    });
  };

  useEffect(() => {
    let mounted = true;
    console.log('🔄 Inicializando AuthProvider...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const { data: profile, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (error) {
                const testUser = testUsers.find(u => u.email === session.user.email);
                if (testUser) {
                  setUserProfile({
                    id: testUser.id,
                    email: testUser.email,
                    nome: testUser.nome,
                    tipo_usuario: testUser.tipo_usuario,
                    status: testUser.status
                  });
                }
              } else {
                setUserProfile(profile);
              }
            } catch (err) {
              console.log('⚠️ Erro ao buscar perfil:', err);
            }
          }, 500);
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
        }
        if (mounted) setLoading(false);
      }
    );

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (mounted && !error) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        if (mounted) setLoading(false);
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    initAuth();
    createTestUsers();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Login no Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        let errorMessage = 'Credenciais inválidas';
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Email não confirmado. Verifique sua caixa de entrada';
        }
        return { error: { message: errorMessage } };
      }
      // Buscar perfil na tabela usuarios pelo id do usuário autenticado
      if (data?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (!profileError && profile) {
          setUserProfile(profile);
        }
      }
      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro interno no sistema' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nome: string, tipo_usuario: 'admin' | 'cliente', senha_validacao: string) => {
    try {
      setLoading(true);
      if (!nome || nome.trim() === '') {
        return { error: { message: 'Nome é obrigatório' } };
      }
      if (password.length < 6) {
        return { error: { message: 'Senha deve ter pelo menos 6 caracteres' } };
      }
      const redirectUrl = `${window.location.origin}/`;
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: nome.trim(),
            tipo_usuario: tipo_usuario
          }
        }
      });
      if (error) {
        let errorMessage = 'Erro ao criar conta';
        if (error.message?.includes('already registered')) {
          errorMessage = 'Este email já está cadastrado';
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = 'Email inválido';
        } else if (error.message?.includes('Password should be at least')) {
          errorMessage = 'Senha deve ter pelo menos 6 caracteres';
        }
        return { error: { message: errorMessage } };
      }
      // Inserir dados extras na tabela usuarios usando o id do Auth
      if (data.user && !error) {
        try {
          const { error: insertError } = await supabase
            .from('usuarios')
            .insert({
              id: data.user.id,
              email: email,
              nome: nome.trim(),
              tipo_usuario,
              status: 'ativo',
              senha_validacao: tipo_usuario === 'admin' ? senha_validacao : ''
            });
          if (insertError) {
            // Não tente deletar o usuário do Auth aqui
            return { error: { message: 'Erro ao criar perfil do usuário' } };
          }
        } catch (e) {
          // Falha inesperada ao inserir usuário
          return { error: { message: 'Erro interno ao criar usuário' } };
        }
      }
      return { error: null };
    } catch (error) {
      return { error: { message: 'Erro interno no sistema' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUserProfile(null);
      setUser(null);
      setSession(null);
      await supabase.auth.signOut();
    } catch {}
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    signIn,
    signUp,
    signOut,
    createTestUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}