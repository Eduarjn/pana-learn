// src/components/onboarding/StepConta.tsx
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  confirmarSenha: z.string(),
  organizacaoNome: z.string().min(2, 'Nome da organização obrigatório'),
}).refine(d => d.senha === d.confirmarSenha, {
  message: 'As senhas não conferem',
  path: ['confirmarSenha'],
});

type FormData = z.infer<typeof schema>;

// Traduz mensagens de erro do Supabase Auth (que vêm em inglês) para PT-BR.
function traduzErroAuth(msg: string): string {
  const m = (msg || '').toLowerCase();
  if (m.includes('weak') || m.includes('easy to guess') || m.includes('pwned') || m.includes('leaked')) {
    return 'Essa senha é muito comum ou apareceu em vazamentos. Escolha uma senha mais forte e única — 8+ caracteres, misturando letras, números e símbolos.';
  }
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already')) {
    return 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.';
  }
  if (m.includes('invalid email')) return 'E-mail inválido.';
  if (m.includes('password should be at least')) return 'A senha é muito curta. Use ao menos 8 caracteres.';
  return msg || 'Tente novamente.';
}

// Avalia a força da senha ao vivo para o medidor visual (não substitui a
// verificação de senha vazada do Supabase, que roda no servidor).
function avaliarForcaSenha(s: string): { nivel: 0 | 1 | 2 | 3; label: string; cor: string } {
  if (!s) return { nivel: 0, label: '', cor: '#E5E7EB' };
  let score = 0;
  if (s.length >= 8) score++;
  if (s.length >= 12) score++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) score++;
  if (/\d/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  if (score <= 2) return { nivel: 1, label: 'Fraca', cor: '#DC2626' };
  if (score <= 3) return { nivel: 2, label: 'Média', cor: '#F59E0B' };
  return { nivel: 3, label: 'Forte', cor: '#417B5A' };
}

interface Props {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
}

export default function StepConta({ data, updateData, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: data.nome, email: data.email, organizacaoNome: data.organizacaoNome },
  });

  const senhaAtual = watch('senha') || '';
  const forca = avaliarForcaSenha(senhaAtual);

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: { full_name: formData.nome },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // Garante sessao propagada antes do INSERT (senao request vai como anon)
      if (!authData.session) {
        // Email confirmation pode estar ON — tenta logar imediatamente
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.senha,
        });
        if (signInErr) {
          throw new Error(
            'Conta criada, mas confirme seu email antes de continuar (verifique a caixa de entrada).'
          );
        }
      }

      // 2. Criar organização
      const subdominio = formData.organizacaoNome
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Usa RPC SECURITY DEFINER para evitar bloqueio do RLS SELECT pos-INSERT
      // (usuario ainda nao tem empresa_id, entao get_empresa_id() retorna NULL).
      const { data: rpcId, error: orgError } = await supabase.rpc(
        'create_empresa_for_user',
        {
          p_nome: formData.organizacaoNome,
          p_subdominio: subdominio,
          p_plan: 'starter',
          p_plan_status: 'pending',
        }
      );

      if (orgError) throw orgError;

      const empresaId = rpcId as string;

      // 3. Linha em `usuarios` já foi criada pelo trigger handle_new_user
      //    no momento do signUp (com tipo_usuario='cliente', sem empresa_id).
      //    Aqui só promovemos para admin e associamos a empresa.
      const { data: updated, error: userError } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome,
          tipo_usuario: 'admin',
          status: 'ativo',
          empresa_id: empresaId,
          data_atualizacao: new Date().toISOString(),
        })
        .eq('user_id', authData.user.id)
        .select();

      if (userError) {
        console.error('Erro ao atualizar usuario:', {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint,
        });
        throw new Error(`Erro ao vincular usuário à empresa: ${userError.message}`);
      }

      // Fallback: se o trigger não rodou (ex.: foi removido), insere manualmente
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            user_id: authData.user.id,
            nome: formData.nome,
            email: formData.email,
            senha_hashed: 'supabase_auth',
            tipo_usuario: 'admin',
            status: 'ativo',
            empresa_id: empresaId,
          });
        if (insertError) {
          console.error('Erro ao inserir usuario (fallback):', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
          });
          throw new Error(`Erro ao criar usuário: ${insertError.message}`);
        }
      }

      updateData({
        nome: formData.nome,
        email: formData.email,
        organizacaoNome: formData.organizacaoNome,
        userId: authData.user.id,
        organizationId: empresaId,
      });

      toast({ title: 'Conta criada!', description: 'Vamos personalizar sua plataforma.' });
      onNext();

    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: traduzErroAuth(error.message),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-quicksand text-2xl font-bold text-pana-indigo mb-1">Crie sua conta</h2>
      <p className="font-inter text-sm text-pana-text-secondary mb-8">Cadastre sua organização e configure o ambiente rapidamente.</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" {...register('nome')} placeholder="João Silva" className="mt-1" />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label htmlFor="organizacaoNome">Nome da organização</Label>
            <Input id="organizacaoNome" {...register('organizacaoNome')} placeholder="Empresa XPTO" className="mt-1" />
            {errors.organizacaoNome && <p className="text-red-500 text-xs mt-1">{errors.organizacaoNome.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register('email')} placeholder="joao@empresa.com" className="mt-1" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" {...register('senha')} placeholder="Mínimo 8 caracteres" className="mt-1" />
            {/* Medidor de força da senha ao vivo */}
            {senhaAtual && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-colors"
                      style={{ background: i <= forca.nivel ? forca.cor : '#E5E7EB' }}
                    />
                  ))}
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: forca.cor }}>
                  Senha {forca.label}
                </p>
              </div>
            )}
            {errors.senha
              ? <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>
              : <p className="text-pana-text-secondary text-xs mt-1">8+ caracteres com letras, números e símbolos. Senhas comuns ou vazadas são bloqueadas.</p>}
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input id="confirmarSenha" type="password" {...register('confirmarSenha')} placeholder="Repita a senha" className="mt-1" />
            {errors.confirmarSenha && <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha.message}</p>}
          </div>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="w-full bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl h-11 font-medium"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Criando...</> : 'Continuar →'}
          </Button>
          <p className="text-xs text-pana-text-secondary text-center mt-3">
            Ao continuar, você concorda com os{' '}
            <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-pana-teal hover:underline">termos de uso</a>{' '}
            e a{' '}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-pana-teal hover:underline">política de privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
