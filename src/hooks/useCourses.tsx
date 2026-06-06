import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/context/EmpresaContext';
import { useAuth } from '@/hooks/useAuth';

export interface Course {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  status: 'ativo' | 'inativo' | 'em_breve';
  imagem_url: string | null;
  categoria_id: string | null;
  ordem: number | null;
  categorias?: {
    nome: string;
    cor: string;
  };
}

export interface Module {
  id: string;
  nome_modulo: string;
  descricao: string | null;
  duracao: number | null;
  ordem: number | null;
  curso_id: string;
  link_video: string | null;
}

export const useCourses = () => {
  const { empresa } = useEmpresa();
  const { userProfile } = useAuth();
  
  return useQuery({
    queryKey: ['courses', empresa?.id, userProfile?.tipo_usuario],
    queryFn: async () => {
      // Se não é admin_master e não tem empresa associada, retornar vazio
      // (evita mostrar cursos de outras empresas)
      if (userProfile?.tipo_usuario !== 'admin_master' && !empresa?.id) {
        return [] as Course[];
      }

      let query = supabase
        .from('cursos')
        .select(`*, categorias (nome, cor)`)
        .eq('status', 'ativo')
        .order('ordem', { ascending: true });

      if (empresa?.id && userProfile?.tipo_usuario !== 'admin_master') {
        query = query.eq('empresa_id', empresa.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Course[];
    },
    staleTime: 5 * 60 * 1000, // cursos mudam raramente — cache válido por 5 min
    retry: 3,
    retryDelay: 1000,
  });
};

export const useCourseModules = (courseId: string) => {
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      try {
        const { data: currentModules, error: modulesError } = await supabase
          .from('modulos')
          .select('*')
          .eq('curso_id', courseId)
          .order('ordem', { ascending: true });

        if (modulesError) throw modulesError;

        // Verificar se tem os módulos padrão
        const hasUsabilidade = currentModules?.some(m => m.nome_modulo === 'Usabilidade');
        const hasConfiguracao = currentModules?.some(m => m.nome_modulo === 'Configuração');
        const hasOldModules = currentModules?.some(m => 
          !['Usabilidade', 'Configuração'].includes(m.nome_modulo)
        );

        // Se não tem os módulos padrão ou tem módulos antigos, padronizar
        if (!hasUsabilidade || !hasConfiguracao || hasOldModules) {
          
          try {
            // Buscar informações do curso
            const { data: courseData, error: courseError } = await supabase
              .from('cursos')
              .select('id, nome, categoria')
              .eq('id', courseId)
              .single();

            if (courseError || !courseData) {
              console.error('❌ Erro ao buscar curso:', courseError);
              throw courseError;
            }


            // Tentar remover módulos antigos de forma mais segura
            if (hasOldModules) {
              
              // Remover apenas módulos que não são padrão
              const { error: deleteError } = await supabase
                .from('modulos')
                .delete()
                .eq('curso_id', courseId)
                .not('nome_modulo', 'in', `(${'Usabilidade'},${'Configuração'})`);

              if (deleteError) {
                console.error('❌ Erro ao remover módulos antigos:', deleteError);
                // Continuar mesmo com erro, não falhar completamente
              } else {
              }
            }

            // Verificar se já tem os módulos padrão após limpeza
            const { data: cleanedModules, error: checkError } = await supabase
              .from('modulos')
              .select('nome_modulo')
              .eq('curso_id', courseId);

            if (checkError) {
              console.error('❌ Erro ao verificar módulos após limpeza:', checkError);
            } else {
              const hasUsabilidadeAfter = cleanedModules?.some(m => m.nome_modulo === 'Usabilidade');
              const hasConfiguracaoAfter = cleanedModules?.some(m => m.nome_modulo === 'Configuração');

              // Se ainda não tem os módulos padrão, criar
              if (!hasUsabilidadeAfter || !hasConfiguracaoAfter) {
                
                const modulesToInsert = [];
                
                if (!hasUsabilidadeAfter) {
                  modulesToInsert.push({
                    curso_id: courseId,
                    nome_modulo: 'Usabilidade',
                    descricao: `Módulo focado na usabilidade e experiência do usuário do ${courseData.nome}`,
                    ordem: 1,
                    duracao: 0
                  });
                }
                
                if (!hasConfiguracaoAfter) {
                  modulesToInsert.push({
                    curso_id: courseId,
                    nome_modulo: 'Configuração',
                    descricao: `Módulo focado na configuração e setup do ${courseData.nome}`,
                    ordem: 2,
                    duracao: 0
                  });
                }

                if (modulesToInsert.length > 0) {
                  const { data: newModules, error: insertError } = await supabase
                    .from('modulos')
                    .insert(modulesToInsert)
                    .select();

                  if (insertError) {
                    console.error('❌ Erro ao inserir módulos padrão:', insertError);
                    throw insertError;
                  }

                }
              }
            }

            // Buscar módulos finais
            const { data: finalModules, error: finalError } = await supabase
              .from('modulos')
              .select('*')
              .eq('curso_id', courseId)
              .order('ordem', { ascending: true });

            if (finalError) {
              console.error('❌ Erro ao buscar módulos finais:', finalError);
              throw finalError;
            }

            return (finalModules || []) as Module[];
            
          } catch (error) {
            console.error('❌ Erro durante padronização:', error);
            // Retornar módulos atuais em caso de erro
            return (currentModules || []) as Module[];
          }
        } else {
          return (currentModules || []) as Module[];
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar módulos:', error);
        throw error;
      }
    },
    enabled: !!courseId,
    retry: 2,
  });
};

export const useUserProgress = () => {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['user-progress', userProfile?.id],
    enabled: !!userProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progresso_usuario')
        .select(`*, cursos (nome, categoria)`)
        .eq('usuario_id', userProfile!.id); // escopo obrigatório ao usuário logado

      if (error) throw error;
      return data || [];
    },
    retry: 2,
  });
};

// Hook para testar conectividade com tabelas
export const useTestConnection = () => {
  return useQuery({
    queryKey: ['test-connection'],
    queryFn: async () => {
      
      const results = {
        cursos: 0,
        categorias: 0,
        modulos: 0,
        usuarios: 0,
        progresso_usuario: 0,
        certificados: 0,
        avaliacoes: 0,
        videos: 0
      };

      try {
        // Testar cada tabela
        const tableNames = ['cursos', 'categorias', 'modulos', 'usuarios', 'progresso_usuario', 'certificados', 'avaliacoes', 'videos'] as const;
        
        for (const tableName of tableNames) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('id', { count: 'exact' })
              .limit(1);
            
            if (error) {
              console.error(`❌ Erro na tabela ${tableName}:`, error);
            } else {
              results[tableName] = data?.length || 0;
            }
          } catch (err) {
            console.error(`❌ Erro inesperado na tabela ${tableName}:`, err);
          }
        }

        return results;
      } catch (error) {
        console.error('❌ Erro geral no teste de conectividade:', error);
        throw error;
      }
    },
    retry: 1,
  });
};
