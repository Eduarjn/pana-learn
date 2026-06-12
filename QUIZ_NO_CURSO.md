# 📚 Como Adicionar Quizzes no Detalhe do Curso

## Visual Esperado (como você mostrou)

```
┌─────────────────────────────────────────────────────────────┐
│ teste - Modell1                                             │
│                          [Adicionar Vídeo]                  │
├─────────────────────────────────────────────────────────────┤
│ Configuração da Prova Final                                 │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ [Selecione um quiz ▼]                 [Salvar vínculo]│  │
│ └───────────────────────────────────────────────────────┘  │
│ Quiz atualmente vinculado: Quiz de Conclusão - teste       │
├─────────────────────────────────────────────────────────────┤
│ Nenhum vídeo selecionado                                   │
│ Selecione um vídeo da lista ao lado...                     │
│                                                             │
│                     [Vídeos do Curso]                      │
│                 Nenhum vídeo disponível                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação

Abra `src/pages/CursoDetalhe.tsx` e adicione o `QuizzesManager`:

### **PASSO 1:** Importar o componente

```tsx
// No topo do arquivo, com os outros imports:
import { QuizzesManager } from '@/components/quiz/QuizzesManager';
```

### **PASSO 2:** Adicionar a seção no JSX

Encontre a seção de "Vídeos do Curso" e adicione a seção de Quizzes ANTES dela:

```tsx
export default function CursoDetalhe() {
  const [selected, setSelected] = useState<{ module: number; video: number } | null>(null);

  // ... resto do código ...

  return (
    <div className="space-y-6">
      {/* Header - já existe */}
      
      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar de módulos - já existe */}
        <aside className="w-full md:w-1/3">
          {/* ... código existente ... */}
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-4">
          
          {/* Player - já existe */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            {/* ... código existente ... */}
          </div>

          {/* 🎯 ADICIONAR ESTA SEÇÃO: Quizzes */}
          <QuizzesManager 
            cursoId={cursoId}
            onQuizAdded={() => {
              // Recarregar módulos se necessário
            }}
          />

          {/* Comentários - já existe */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            {/* ... código existente ... */}
          </div>

        </main>
      </div>
    </div>
  );
}
```

---

## Estrutura da Tabela `modulos`

Certifique-se que a tabela `modulos` tem estas colunas:

```sql
CREATE TABLE public.modulos (
  id UUID PRIMARY KEY,
  curso_id UUID NOT NULL,
  trilha_id UUID, -- se aplicável
  tipo VARCHAR(50) DEFAULT 'video_lesson',  -- 'video_lesson' ou 'quiz'
  quiz_id UUID REFERENCES public.quizzes(id),
  video_id UUID, -- para vídeos
  titulo VARCHAR(255),
  ordem INTEGER,
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP
);
```

Se ainda não tem a coluna `quiz_id`, execute:
```sql
ALTER TABLE public.modulos 
ADD COLUMN tipo VARCHAR(50) DEFAULT 'video_lesson',
ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;
```

---

## Funcionamento

### **Admin vê:**
```
Quizzes do Curso
┌─────────────────────────────────┐
│ Adicionar Quiz                  │
│ [Selecionar quiz ▼]             │
│ [Adicionar Quiz]                │
└─────────────────────────────────┘

Quizzes Adicionados:
┌─────────────────────────────────┐
│ Quiz de Conclusão - teste  [X]  │
│ Nota mín: 70% | Tentativas: 1   │
└─────────────────────────────────┘
```

### **Aluno vê:**
- Na lista de módulos do curso, aparecem tanto vídeos quanto quizzes
- Pode clicar para fazer o quiz

---

## Fluxo Completo (Admin)

```
1. Vai para /curso/:id
2. Vê a seção "Quizzes do Curso"
3. Clica em [Selecionar quiz ▼]
4. Escolhe um quiz da lista
5. Clica [Adicionar Quiz]
6. Quiz aparece na lista "Quizzes Adicionados"
7. Pode remover clicando [X]
```

---

## Fluxo Completo (Aluno)

```
1. Vai para /curso/:id
2. Vê na sidebar os módulos:
   - Módulo 1 (vídeo)
   - Módulo 2 (quiz) ← Novo!
   - Módulo 3 (vídeo)
3. Clica no Quiz
4. Vê o QuizPlayer
5. Faz o quiz
6. Vê o resultado
```

---

## Renderizar Quiz na Sidebar

Para que o quiz apareça como módulo na sidebar, você precisa:

### **Modificar o `CursoDetalhe.tsx`** para renderizar quizzes:

```tsx
// Onde você renderiza os módulos/vídeos
{mockModules.map((mod, modIdx) => (
  <li key={mod.id}>
    {/* ... código existente para vídeos ... */}

    {/* 🎯 Adicionar renderização de quizzes */}
    {mod.tipo === 'quiz' && (
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="h-4 w-4 mr-1 text-pana-teal" />
          <span className="font-medium text-pana-text text-sm">{mod.titulo}</span>
        </div>
        <li
          className="flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-all text-sm border hover:bg-pana-background border-transparent text-pana-text"
          onClick={() => navigate(`/quiz/${mod.quiz_id}`)}
        >
          <CheckCircle className="h-4 w-4 text-pana-teal flex-shrink-0" />
          <span className="truncate flex-1">Fazer Quiz</span>
        </li>
      </div>
    )}
  </li>
))}
```

---

## Checklist

- [ ] Adicionar coluna `tipo` e `quiz_id` na tabela `modulos`
- [ ] Importar `QuizzesManager` no `CursoDetalhe.tsx`
- [ ] Adicionar `<QuizzesManager>` no JSX
- [ ] Renderizar quizzes na sidebar de módulos
- [ ] Testar adicionar quiz a um curso
- [ ] Testar remover quiz
- [ ] Testar aluno acessando o quiz do curso

---

## Se der Erro

### "Tabela modulos não tem coluna quiz_id"
Execute a migration:
```sql
ALTER TABLE public.modulos ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;
```

### "QuizzesManager não renderiza nada"
Verificar:
1. Supabase conectado?
2. Existem quizzes no banco?
3. Verificar console para erros de RLS

### "Quiz não aparece na lista"
Verificar:
1. Quiz foi criado com `empresa_id` correto?
2. Usuário está na mesma empresa?
3. Checar RLS policies

---

## Próximo: Integração Completa em Trilhas

Depois que funcionar em Cursos, é fácil expandir para Trilhas (tracks).
Ver `QUIZ_INTEGRATION.md` para mais detalhes.
