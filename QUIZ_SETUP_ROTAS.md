# 🎯 Como Integrar Quizzes na Navegação

## 1. Adicionar Rotas no React Router

Abra o arquivo principal de rotas (normalmente `src/App.tsx` ou `src/main.tsx`) e adicione:

```tsx
import QuizzesPage from '@/pages/Quizzes';
import QuizPage from '@/pages/QuizPage';
import QuizEditor from '@/pages/admin/QuizEditor';

// Dentro do <Routes>
<Route path="/quizzes" element={<QuizzesPage />} />
<Route path="/quiz/:quizId" element={<QuizPage />} />

// Admin routes
<Route path="/admin/quiz-editor" element={<QuizEditor />} />
<Route path="/admin/quiz-editor/:quizId" element={<QuizEditor />} />
```

---

## 2. Adicionar no Sidebar (Menu Lateral)

Abra `src/components/ERASidebar.tsx` e adicione em `menuItems`:

```tsx
const menuItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard", roles: ["admin", "cliente", "admin_master"] },
  { title: "Treinamentos", icon: BookOpen, path: "/treinamentos", roles: ["admin", "cliente", "admin_master"] },
  { title: "Vídeos", icon: Video, path: "/youtube", roles: ["admin", "cliente", "admin_master"] },
  // ⬇️ ADICIONAR ESTA LINHA:
  { title: "Quizzes", icon: CheckCircle2, path: "/quizzes", roles: ["admin", "cliente", "admin_master"] },
  // ⬆️ Não esqueça de importar: import { CheckCircle2 } from 'lucide-react';
  { title: "Certificados", icon: Award, path: "/certificados", roles: ["admin", "cliente", "admin_master"] },
  // ... resto do menu
];
```

---

## 3. Adicionar Item Admin: Criar Quiz

No sidebar ou em uma página de admin, adicione um botão para ir ao editor:

```tsx
// Em qualquer lugar do seu código
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Botão para criar novo quiz
<Button 
  onClick={() => navigate('/admin/quiz-editor')}
  className="gap-2"
>
  <Plus className="h-4 w-4" />
  Criar Quiz
</Button>

// Botão para editar um quiz existente
<Button 
  onClick={() => navigate(`/admin/quiz-editor/${quizId}`)}
>
  Editar
</Button>
```

---

## 4. Estrutura de Pastas (Resumo)

```
frontend/src/
├── pages/
│   ├── Quizzes.tsx          ← 📝 Lista todos os quizzes
│   ├── QuizPage.tsx         ← 🎮 Fazer o quiz (com resultado)
│   └── admin/
│       └── QuizEditor.tsx   ← ✏️ Criar/editar quiz (admin)
├── components/
│   └── quiz/
│       ├── QuizPlayer.tsx        ← Player do quiz
│       ├── QuizResultado.tsx     ← Mostra resultado
│       ├── MultiplaEscolha.tsx   ← Componente de questão
│       ├── VerdadeiroFalso.tsx
│       ├── RespostaAberta.tsx
│       ├── ArrastarSoltar.tsx
│       └── FillInTheBlank.tsx
├── services/
│   └── quizService.ts       ← Chamadas Supabase
└── types/
    └── quiz.types.ts        ← Interfaces TypeScript
```

---

## 5. Fluxo Completo (Usuário)

```
Login
  ↓
Dashboard
  ↓
Sidebar → "Quizzes" (nova opção)
  ↓
Página /quizzes (Lista todos os quizzes)
  ↓
Clica em "Começar" ou "Revisar"
  ↓
/quiz/:quizId (Faz o quiz com QuizPlayer)
  ↓
Finaliza
  ↓
QuizResultado (vê o resultado)
  ↓
Volta à lista ou faz novamente
```

---

## 6. Fluxo Admin

```
Login (Admin)
  ↓
Dashboard
  ↓
Qualquer página com botão "Criar Quiz"
  ↓
/admin/quiz-editor (novo quiz vazio)
  ↓
Preenche título, descrição, etc
  ↓
Clica "Adicionar Questão"
  ↓
Seleciona tipo: multipla escolha, verdadeiro/falso, etc
  ↓
Preenche questão e opções
  ↓
Clica "Salvar Questão"
  ↓
Adiciona quantas questões quiser
  ↓
Clica "Salvar Quiz"
  ↓
Quiz criado! Alunos já veem em /quizzes
```

---

## 7. Checklist de Implementação

- [ ] Executar migration SQL: `supabase migration up`
- [ ] Criar arquivo `src/pages/Quizzes.tsx`
- [ ] Criar arquivo `src/pages/QuizPage.tsx`
- [ ] Criar arquivo `src/pages/admin/QuizEditor.tsx`
- [ ] Criar arquivo `src/services/quizService.ts`
- [ ] Criar arquivo `src/types/quiz.types.ts`
- [ ] Criar componentes em `src/components/quiz/`
- [ ] Adicionar rotas no React Router
- [ ] Adicionar "Quizzes" no sidebar
- [ ] Testar criar um quiz
- [ ] Testar fazer um quiz
- [ ] Testar resultado
- [ ] Testar com usuários diferentes (multi-tenant)

---

## 8. Troubleshooting

### Quiz não aparece na lista
- Verificar se a migration foi executada: `supabase migration list`
- Verificar se o usuario está autenticado
- Verificar RLS no Supabase (tabela `quizzes` habilitada)

### Erro ao carregar Supabase
```tsx
// Certificar que supabase está corretamente importado
import { supabase } from '@/integrations/supabase/client';
```

### Quiz não salva
- Verificar se há erros no console
- Verificar se `empresa_id` é passado corretamente (via RLS automático)
- Verificar RLS policies em `quizzes`, `quiz_questoes`, etc.

---

## 9. Próximo: Integrar em Trilhas (Módulos)

Depois de confirmar que os quizzes funcionam sozinhos, integre em trilhas:

```tsx
// Exemplo em um componente de trilha
import { QuizPlayer } from '@/components/quiz/QuizPlayer';

if (modulo.tipo === 'quiz') {
  return <QuizPlayer quizId={modulo.quiz_id} />;
} else if (modulo.tipo === 'video_lesson') {
  return <VideoPlayer videoId={modulo.video_id} />;
}
```

Ver `QUIZ_INTEGRATION.md` para mais detalhes.
