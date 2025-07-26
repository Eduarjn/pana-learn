import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Save, 
  AlertCircle, 
  CheckCircle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: string;
  pergunta: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso';
  alternativas: string[];
  resposta_correta: number;
  explicacao?: string;
}

interface QuizConfig {
  id?: string;
  categoria_id: string;
  nota_minima: number;
  perguntas: QuizQuestion[];
  mensagem_sucesso: string;
  mensagem_reprova: string;
}

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
}

const QuizConfig: React.FC = () => {
  const { userProfile } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('');
  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    categoria_id: '',
    nota_minima: 70,
    perguntas: [],
    mensagem_sucesso: 'Parabéns! Você foi aprovado no quiz e pode prosseguir para obter seu certificado.',
    mensagem_reprova: 'Você não atingiu a nota mínima. Revise o conteúdo e tente novamente.'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Hooks devem ser chamados sempre, independentemente do tipo de usuário
  useEffect(() => {
    loadCategorias();
  }, []);

  useEffect(() => {
    if (selectedCategoria) {
      loadQuizConfig(selectedCategoria);
    }
  }, [selectedCategoria]);

  if (userProfile?.tipo_usuario !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Acesso Negado</h2>
          <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as categorias.",
          variant: "destructive"
        });
        return;
      }

      setCategorias(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
    }
  };

  const loadQuizConfig = async (categoriaId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('quiz_config')
        .select('*')
        .eq('categoria_id', categoriaId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configuração do quiz:', error);
        return;
      }

      if (data) {
        setQuizConfig({
          id: data.id,
          categoria_id: data.categoria_id,
          nota_minima: data.nota_minima,
          perguntas: data.perguntas || [],
          mensagem_sucesso: data.mensagem_sucesso,
          mensagem_reprova: data.mensagem_reprova
        });
      } else {
        // Criar nova configuração
        setQuizConfig({
          categoria_id: categoriaId,
          nota_minima: 70,
          perguntas: [],
          mensagem_sucesso: 'Parabéns! Você foi aprovado no quiz e pode prosseguir para obter seu certificado.',
          mensagem_reprova: 'Você não atingiu a nota mínima. Revise o conteúdo e tente novamente.'
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      pergunta: '',
      tipo: 'multipla_escolha',
      alternativas: ['', '', '', ''],
      resposta_correta: 0
    };

    setQuizConfig(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[] | undefined) => {
    setQuizConfig(prev => ({
      ...prev,
      perguntas: prev.perguntas.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizConfig(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter((_, i) => i !== index)
    }));
  };

  const addAlternative = (questionIndex: number) => {
    setQuizConfig(prev => ({
      ...prev,
      perguntas: prev.perguntas.map((q, i) => 
        i === questionIndex 
          ? { ...q, alternativas: [...q.alternativas, ''] }
          : q
      )
    }));
  };

  const updateAlternative = (questionIndex: number, altIndex: number, value: string) => {
    setQuizConfig(prev => ({
      ...prev,
      perguntas: prev.perguntas.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              alternativas: q.alternativas.map((alt, j) => 
                j === altIndex ? value : alt
              )
            }
          : q
      )
    }));
  };

  const removeAlternative = (questionIndex: number, altIndex: number) => {
    setQuizConfig(prev => ({
      ...prev,
      perguntas: prev.perguntas.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              alternativas: q.alternativas.filter((_, j) => j !== altIndex)
            }
          : q
      )
    }));
  };

  const validateQuiz = (): boolean => {
    if (!quizConfig.categoria_id) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma categoria.",
        variant: "destructive"
      });
      return false;
    }

    if (quizConfig.perguntas.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma pergunta.",
        variant: "destructive"
      });
      return false;
    }

    for (let i = 0; i < quizConfig.perguntas.length; i++) {
      const q = quizConfig.perguntas[i];
      
      if (!q.pergunta.trim()) {
        toast({
          title: "Erro de validação",
          description: `A pergunta ${i + 1} não pode estar vazia.`,
          variant: "destructive"
        });
        return false;
      }

      if (q.alternativas.length < 2) {
        toast({
          title: "Erro de validação",
          description: `A pergunta ${i + 1} deve ter pelo menos 2 alternativas.`,
          variant: "destructive"
        });
        return false;
      }

      for (let j = 0; j < q.alternativas.length; j++) {
        if (!q.alternativas[j].trim()) {
          toast({
            title: "Erro de validação",
            description: `A alternativa ${j + 1} da pergunta ${i + 1} não pode estar vazia.`,
            variant: "destructive"
          });
          return false;
        }
      }

      if (q.resposta_correta < 0 || q.resposta_correta >= q.alternativas.length) {
        toast({
          title: "Erro de validação",
          description: `A resposta correta da pergunta ${i + 1} é inválida.`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const saveQuizConfig = async () => {
    if (!validateQuiz()) return;

    try {
      setSaving(true);

      const configData = {
        categoria_id: quizConfig.categoria_id,
        nota_minima: quizConfig.nota_minima,
        perguntas: quizConfig.perguntas,
        mensagem_sucesso: quizConfig.mensagem_sucesso,
        mensagem_reprova: quizConfig.mensagem_reprova
      };

      let result;
      if (quizConfig.id) {
        // Atualizar
        result = await supabase
          .from('quiz_config')
          .update(configData)
          .eq('id', quizConfig.id)
          .select()
          .single();
      } else {
        // Criar novo
        result = await supabase
          .from('quiz_config')
          .insert(configData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      setQuizConfig(prev => ({ ...prev, id: result.data.id }));

      toast({
        title: "Sucesso!",
        description: "Configuração do quiz salva com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao salvar quiz:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração do quiz.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuração de Quiz de Conclusão
          </h1>
          <p className="text-gray-600">
            Configure o quiz que será exibido quando um usuário finalizar o último vídeo de uma categoria.
          </p>
        </div>

        {/* Seleção de Categoria */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Selecionar Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCategoria}
              onValueChange={(value) => {
                setSelectedCategoria(value);
                setQuizConfig((prev) => ({
                  ...prev,
                  categoria_id: value
                }));
              }}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map(categoria => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando configuração...</p>
          </div>
        ) : selectedCategoria ? (
          <div className="space-y-8">
            {/* Configurações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nota Mínima de Aprovação (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={quizConfig.nota_minima}
                    onChange={(e) => setQuizConfig(prev => ({ 
                      ...prev, 
                      nota_minima: parseInt(e.target.value) || 0 
                    }))}
                    className="max-w-xs"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Nota mínima que o usuário deve atingir para ser aprovado
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Sucesso
                  </label>
                  <Textarea
                    value={quizConfig.mensagem_sucesso}
                    onChange={(e) => setQuizConfig(prev => ({ 
                      ...prev, 
                      mensagem_sucesso: e.target.value 
                    }))}
                    placeholder="Mensagem exibida quando o usuário for aprovado..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Reprovação
                  </label>
                  <Textarea
                    value={quizConfig.mensagem_reprova}
                    onChange={(e) => setQuizConfig(prev => ({ 
                      ...prev, 
                      mensagem_reprova: e.target.value 
                    }))}
                    placeholder="Mensagem exibida quando o usuário for reprovado..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Perguntas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Perguntas do Quiz</CardTitle>
                  <Button onClick={addQuestion} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Pergunta
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quizConfig.perguntas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma pergunta configurada</p>
                    <p className="text-sm">Clique em "Adicionar Pergunta" para começar</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizConfig.perguntas.map((question, qIndex) => (
                      <Card key={question.id} className="border-2 border-gray-200">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Pergunta {qIndex + 1}
                            </CardTitle>
                            <Button
                              onClick={() => removeQuestion(qIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Pergunta */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pergunta
                            </label>
                            <Textarea
                              value={question.pergunta}
                              onChange={(e) => updateQuestion(qIndex, 'pergunta', e.target.value)}
                              placeholder="Digite a pergunta..."
                              rows={2}
                            />
                          </div>

                          {/* Tipo */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tipo de Questão
                            </label>
                            <Select
                              value={question.tipo}
                              onValueChange={(value: 'multipla_escolha' | 'verdadeiro_falso') => 
                                updateQuestion(qIndex, 'tipo', value)
                              }
                            >
                              <SelectTrigger className="max-w-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                                <SelectItem value="verdadeiro_falso">Verdadeiro ou Falso</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Alternativas */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Alternativas
                              </label>
                              <Button
                                onClick={() => addAlternative(qIndex)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {question.alternativas.map((alt, altIndex) => (
                                <div key={altIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`correct_${qIndex}`}
                                    checked={question.resposta_correta === altIndex}
                                    onChange={() => updateQuestion(qIndex, 'resposta_correta', altIndex)}
                                    className="text-blue-600"
                                  />
                                  <Input
                                    value={alt}
                                    onChange={(e) => updateAlternative(qIndex, altIndex, e.target.value)}
                                    placeholder={`Alternativa ${altIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {question.alternativas.length > 2 && (
                                    <Button
                                      onClick={() => removeAlternative(qIndex, altIndex)}
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Explicação */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Explicação (Opcional)
                            </label>
                            <Textarea
                              value={question.explicacao || ''}
                              onChange={(e) => updateQuestion(qIndex, 'explicacao', e.target.value)}
                              placeholder="Explicação da resposta correta..."
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end">
              <Button
                onClick={saveQuizConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Selecione uma categoria para configurar o quiz</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizConfig; 