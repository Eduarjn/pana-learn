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

interface Props {
  data: any;
  updateData: (d: any) => void;
  onNext: () => void;
}

export default function StepConta({ data, updateData, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: data.nome, email: data.email, organizacaoNome: data.organizacaoNome },
  });

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

      // 2. Criar organização
      const subdominio = formData.organizacaoNome
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const { data: orgData, error: orgError } = await supabase
        .from('empresas')
        .insert({
          nome: formData.organizacaoNome,
          subdominio,
          plan: 'trial',
          plan_status: 'pending',
        })
        .select()
        .single();

      if (orgError) throw orgError;

      const empresaId = (orgData as any).id;

      // 3. Criar registo na tabela usuarios e associar à empresa
      const { error: userError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          nome: formData.nome,
          email: formData.email,
          senha_hashed: '***',  // Gerido pelo Supabase Auth
          tipo_usuario: 'admin',
          status: 'ativo',
          empresa_id: empresaId,
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString(),
        });

      if (userError) {
        console.error('Erro ao criar usuario:', userError);
        // Tentar update se já existe (trigger pode ter criado)
        await supabase
          .from('usuarios')
          .update({ empresa_id: empresaId, tipo_usuario: 'admin' })
          .or(`user_id.eq.${authData.user.id},id.eq.${authData.user.id}`);
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
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Crie sua conta</h2>
      <p className="text-gray-500 mb-8">Cadastre sua organização e configure o ambiente rapidamente.</p>

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
            {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input id="confirmarSenha" type="password" {...register('confirmarSenha')} placeholder="Repita a senha" className="mt-1" />
            {errors.confirmarSenha && <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-8"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Criando...</> : 'Continuar →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
