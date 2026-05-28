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
      console.log('🔍 Buscando cursos...');
      try {
        // Consulta filtrando por empresa_id, exceto admin_master
        let query = supabase
          .from('cursos')
          .select(`*, categorias (nome, cor)`) 
          .eq('status', 'ativo')
          .order('ordem', { ascending: true });
          
        if (empresa?.id && userProfile?.tipo_usuario !== 'admin_master') {
          query = query.eq('empresa_id', empresa.id);
        }
        
        const { data, error } = await query;
        if (error) {
          console.error('❌ Erro ao buscar cursos:', error);
          throw error;
        }
        return (data || []) as Course[];
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar cursos:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });
};

export const useCourseModules = (courseId: string) => {
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      console.log('🔍 Buscando módulos para o curso:', courseId);
      
      try {
        // Primeiro, verificar se o curso tem os módulos padrão
        const { data: currentModules, error: modulesError } = await supabase
          .from('modulos')
          .select('*')
          .eq('curso_id', courseId)
          .order('ordem', { ascending: true });

        if (modulesError) {
          console.error('❌ Erro ao buscar módulos:', modulesError);
          throw modulesError;
        }

        console.log('📋 Módulos atuais encontrados:', currentModules?.length || 0);

        // Verificar se tem os módulos padrão
        const hasUsabilidade = currentModules?.some(m => m.nome_modulo === 'Usabilidade');
        const hasConfiguracao = currentModules?.some(m => m.nome_modulo === 'Configuração');
        const hasOldModules = currentModules?.some(m => 
          !['Usabilidade', 'Configuração'].includes(m.nome_modulo)
        );

        // Se não tem os módulos padrão ou tem módulos antigos, padronizar
        if (!hasUsabilidade || !hasConfiguracao || hasOldModules) {
          console.log('🔧 Padronizando módulos para o curso:', courseId);
          
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

            console.log('📋 Informações do curso:', courseData);

            // Tentar remover módulos antigos de forma mais segura
            if (hasOldModules) {
              console.log('🔧 Removendo módulos antigos...');
              
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
                console.log('✅ Módulos antigos removidos');
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
                console.log('🔧 Criando módulos padrão...');
                
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

                  console.log('✅ Módulos padrão criados:', newModules);
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

            console.log('✅ Módulos padronizados finais:', finalModules);
            return (finalModules || []) as Module[];
            
          } catch (error) {
            console.error('❌ Erro durante padronização:', error);
            // Retornar módulos atuais em caso de erro
            return (currentModules || []) as Module[];
          }
        } else {
          console.log('✅ Módulos já estão padronizados');
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
  return useQuery({
    queryKey: ['user-progress'],
    queryFn: async () => {
      console.log('🔍 Buscando progresso do usuário...');
      
      try {
        const { data, error } = await supabase
          .from('progresso_usuario')
          .select(`
            *,
            cursos (
              nome,
              categoria
            )
          `);

        if (error) {
          console.error('❌ Erro ao buscar progresso:', error);
          throw error;
        }

        console.log('✅ Progresso encontrado:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('❌ Erro inesperado ao buscar progresso:', error);
        throw error;
      }
    },
    retry: 2,
  });
};

// Hook para testar conectividade com tabelas
export const useTestConnection = () => {
  return useQuery({
    queryKey: ['test-connection'],
    queryFn: async () => {
      console.log('🔧 Testando conectividade com as tabelas...');
      
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
              console.log(`✅ Tabela ${tableName}: ${data?.length || 0} registros`);
            }
          } catch (err) {
            console.error(`❌ Erro inesperado na tabela ${tableName}:`, err);
          }
        }

        console.log('📊 Resultado do teste de conectividade:', results);
        return results;
      } catch (error) {
        console.error('❌ Erro geral no teste de conectividade:', error);
        throw error;
      }
    },
    retry: 1,
  });
};
