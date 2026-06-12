# Integração de Quiz na Trilha

## 1. Estrutura esperada da tabela `modulos`

A tabela `modulos` deve ter as seguintes colunas (caso ainda não tenha):

```sql
ALTER TABLE public.modulos ADD COLUMN tipo VARCHAR(50) DEFAULT 'video_lesson' CHECK (tipo IN ('video_lesson', 'quiz'));
ALTER TABLE public.modulos ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;
```

## 2. Exemplo de integração em um componente de trilha

Quando renderizar módulos de uma trilha, use a seguinte lógica:

```tsx
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { QuizResultado } from '@/components/quiz/QuizResultado';

export function TrilhaPlayer() {
  const [moduloAtual, setModuloAtual] = useState(0);
  const [resultado, setResultado] = useState(null);

  const modulos = [...]; // buscar do banco

  const modulo = modulos[moduloAtual];

  // ════════════════════════════════════════════════
  // AQUI: Renderizar baseado no tipo do módulo
  // ════════════════════════════════════════════════
  return (
    <div>
      {resultado ? (
        <QuizResultado 
          resultado={resultado}
          onReset={() => setResultado(null)}
        />
      ) : modulo.tipo === 'quiz' ? (
        <QuizPlayer 
          quizId={modulo.quiz_id}
          onComplete={(resultado) => {
            setResultado(resultado);
            // Opcionalmente, marcar módulo como concluído
            marcarModuloComoConcluido(modulo.id);
          }}
        />
      ) : modulo.tipo === 'video_lesson' ? (
        <VideoPlayer videoId={modulo.video_id} />
      ) : null}
    </div>
  );
}
```

## 3. Passos para implementar

### Passo 1: Atualizar schema do Supabase
Executar a migration:
```bash
supabase migration up
```

### Passo 2: Usar as entidades criadas

**Types:**
```tsx
import { Quiz, Questao, QuestaoComOpcoes, TipoQuestao } from '@/types/quiz.types';
```

**Serviço:**
```tsx
import * as quizService from '@/services/quizService';

// Exemplo: carregar um quiz
const { quiz, questoes } = await quizService.obterQuizComQuestoes(quizId);
```

**Componentes:**
```tsx
import { QuizPlayer } from '@/components/quiz/QuizPlayer';
import { QuizResultado } from '@/components/quiz/QuizResultado';
```

### Passo 3: Admin criar quizzes

1. Acessar `/admin/quiz-editor` (criar rota no React Router)
2. Ou usar a rota `/admin/quiz-editor/:quizId` para editar um quiz existente

Rota sugerida em `src/App.tsx` ou arquivo de rotas:
```tsx
import QuizEditor from '@/pages/admin/QuizEditor';

<Route path="/admin/quiz-editor" element={<QuizEditor />} />
<Route path="/admin/quiz-editor/:quizId" element={<QuizEditor />} />
```

### Passo 4: Ligação módulo → quiz

Quando criar um módulo de tipo "quiz" no banco:
```sql
INSERT INTO public.modulos (trilha_id, tipo, quiz_id, titulo, ordem)
VALUES ('trilha-uuid', 'quiz', 'quiz-uuid', 'Quiz de conclusão', 3);
```

## 4. RLS - Segurança

Todos os dados de quiz respeitam:
- `empresa_id` para isolamento de tenants
- Usuários só veem quizzes da sua empresa
- Admins podem gerenciar quizzes
- Usuários só veem suas próprias tentativas

**Não altere as políticas RLS** — estão já configuradas na migration.

## 5. Exemplos de uso

### Criar um quiz (admin)
```tsx
const quiz = await quizService.criarQuiz({
  titulo: 'Quiz final do módulo PABX',
  descricao: 'Teste seus conhecimentos',
  tempo_limite: 30,
  tentativas_permitidas: 3,
  nota_minima_aprovacao: 70
});
```

### Adicionar uma questão ao quiz
```tsx
await quizService.criarQuestao(quiz.id, {
  tipo: 'multipla_escolha',
  enunciado: 'O que é PABX?',
  pontuacao: 2,
  opcoes: [
    { texto: 'Private Automatic Branch Exchange', correta: true },
    { texto: 'Public Automatic Branch Exchange', correta: false },
    { texto: 'Personal Automatic Branch Exchange', correta: false },
  ]
});
```

### Usar no componente
```tsx
<QuizPlayer 
  quizId={quiz.id}
  onComplete={(resultado) => {
    console.log('Quiz concluído!');
    console.log('Pontuação:', resultado.percentual);
  }}
/>
```

## 6. Tipos de questão suportados

| Tipo | Descrição | Admin | Aluno |
|------|-----------|-------|-------|
| `multipla_escolha` | Múltiplas opções, uma ou mais podem ser corretas | ✓ Cria no editor | ✓ Seleciona checkboxes |
| `verdadeiro_falso` | Duas opções (V/F) | ✓ Cria no editor | ✓ Seleciona radio |
| `resposta_aberta` | Campo de texto livre | ✓ Cria no editor | ✓ Digita resposta |
| `arrastar_soltar` | Arrasta opções para lacunas no enunciado `[___]` | ✓ Cria com `[___]` | ✓ Drag & drop |
| `fill_blank` | Dropdown para preencher lacunas `[___]` | ✓ Cria com `[___]` | ✓ Seleciona dropdown |

## 7. Notas importantes

- **Validação automática**: múltipla escolha, verdadeiro/falso, arrastar e preencher são validadas automaticamente
- **Resposta aberta**: não é validada automaticamente — precisa de revisão manual do admin
- **RLS**: Sempre testar as políticas antes de colocar em produção
- **Performance**: Os quizzes com muitas questões podem ser lentos — considere paginar se necessário

## 8. Próximos passos

- [ ] Integrar em um componente de trilha existente
- [ ] Criar rotas `/admin/quiz-editor` e `/admin/quiz-editor/:quizId`
- [ ] Testar multi-tenancy com usuários de empresas diferentes
- [ ] Implementar revisão manual de respostas abertas (painel admin)
- [ ] Implementar relatórios de desempenho dos alunos
