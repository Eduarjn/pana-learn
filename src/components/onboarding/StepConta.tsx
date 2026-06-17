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
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { Loader2, Eye, EyeOff } from 'lucide-react';

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
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="senha">Senha</Label>
            <div className="relative mt-1">
              <Input id="senha" type={showSenha ? 'text' : 'password'} {...register('senha')} placeholder="Mínimo 8 caracteres" className="pr-10" />
              <button type="button" onClick={() => setShowSenha(v => !v)} tabIndex={-1}
                aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pana-text-secondary hover:text-pana-indigo">
                {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrengthMeter senha={senhaAtual} />
            {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <div className="relative mt-1">
              <Input id="confirmarSenha" type={showConfirm ? 'text' : 'password'} {...register('confirmarSenha')} placeholder="Repita a senha" className="pr-10" />
              <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pana-text-secondary hover:text-pana-indigo">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
