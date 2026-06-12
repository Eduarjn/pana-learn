# 📚 Como Integrar Módulos (Vídeos + Quizzes) na Sidebar

## Visual Final

```
┌─────────────────────────────────────────┐
│ teste - Modell1                         │
├─────────────────────────────────────────┤
│ Configuração da Prova Final             │
│ [Selecione um quiz ▼]  [Salvar vínculo] │
│ Quiz vinculado: Quiz de Conclusão      │
├─────────────────────────────────────────┤
│                                         │
│         [Nenhum vídeo selecionado]     │
│                                         │
├─────────────────────────────────────────┤
│ 🎬 Conteúdo do Curso  (NOVO!)          │
│ ┌─────────────────────────────────────┐│
│ │ 🎥 Módulo 1 - Introdução   [12 min]││
│ │ 🎥 Módulo 2 - Conceitos    [15 min]││
│ │ 🎯 Quiz de Conclusão       [Quiz]  ││
│ │ 🎥 Módulo 3 - Prática      [20 min]││
│ ├─────────────────────────────────────┤│
│ │ Vídeos: 3  |  Quizzes: 1           ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Passo 1: Preparar a Tabela `modulos`

Certifique-se que `modulos` tem estas colunas:

```sql
CREATE TABLE public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) DEFAULT 'video_lesson' CHECK (tipo IN ('video_lesson', 'quiz')),
  titulo VARCHAR(255),
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  watched BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);
```

Se não tem `tipo` e `quiz_id`, execute:

```sql
ALTER TABLE public.modulos 
ADD COLUMN tipo VARCHAR(50) DEFAULT 'video_lesson',
ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;
```

---

## Passo 2: Importar Componente

Abra `src/pages/CursoDetalhe.tsx`:

```tsx
// No topo do arquivo
import { ModulosList } from '@/components/ModulosList';
```

---

## Passo 3: Integrar no Layout

Encontre a seção **"Vídeos do Curso"** (no lado direito):

### **ANTES** (código atual):
```tsx
<aside className="w-full md:w-1/3">
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <h2 className="text-lg font-heading font-semibold text-pana-indigo mb-4">
      Vídeos
    </h2>
    {/* ... lista de vídeos ... */}
  </div>
</aside>
```

### **DEPOIS** (com ModulosList):
```tsx
<aside className="w-full md:w-1/3">
  <ModulosList 
    cursoId={cursoId}
    onModuloSelect={(modulo) => {
      if (modulo.tipo === 'video_lesson') {
        // Renderizar vídeo no player
        setSelectedVideo(modulo);
      }
      // Quiz navega automaticamente em ModulosList
    }}
  />
</aside>
```

---

## Passo 4: Estrutura Completa (Exemplo)

```tsx
export default function CursoDetalhe() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const cursoId = useParams().cursoId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-hero rounded-xl p-8">
        {/* ... */}
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* MAIN: Player + Configuração */}
        <main className="flex-1 space-y-4">
          
          {/* Configuração da Prova Final */}
          <QuizzesManager cursoId={cursoId} />

          {/* Player de Vídeo */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="aspect-video bg-pana-indigo rounded-lg overflow-hidden mb-4 flex items-center justify-center">
              {selectedVideo?.videoId ? (
                <iframe
                  className="w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <span className="text-pana-bone">Selecione um vídeo para começar</span>
              )}
            </div>
            {selectedVideo && (
              <>
                <h2 className="text-xl font-heading font-bold text-pana-indigo mb-1">
                  {selectedVideo.titulo}
                </h2>
                <p className="text-pana-text-secondary mb-3 text-sm">
                  {selectedVideo.descricao}
                </p>
              </>
            )}
          </div>
        </main>

        {/* SIDEBAR: Conteúdo do Curso (Vídeos + Quizzes) */}
        <aside className="w-full md:w-1/3">
          <ModulosList 
            cursoId={cursoId}
            onModuloSelect={(modulo) => {
              if (modulo.tipo === 'video_lesson') {
                setSelectedVideo(modulo);
              }
            }}
          />
        </aside>

      </div>
    </div>
  );
}
```

---

## Passo 5: Como Adicionar Módulos (Admin)

Quando criar um módulo (vídeo ou quiz):

```tsx
// Adicionar vídeo como módulo
const { data } = await supabase
  .from('modulos')
  .insert([{
    curso_id: cursoId,
    tipo: 'video_lesson',
    titulo: 'Introdução',
    video_id: videoId,
    ordem: 1
  }]);

// Adicionar quiz como módulo
const { data } = await supabase
  .from('modulos')
  .insert([{
    curso_id: cursoId,
    tipo: 'quiz',
    titulo: 'Quiz Final',
    quiz_id: quizId,
    ordem: 3
  }]);
```

---

## Passo 6: Fluxo Completo

```
┌─ ADMIN ───────────────────────────┐
│ Cria um vídeo:                     │
│ ├─ Insert em `videos`             │
│ └─ Insert em `modulos` (ref vídeo)│
└────────────────────────────────────┘
                ↓
┌─ ADMIN ───────────────────────────┐
│ Cria um quiz:                      │
│ ├─ Insert em `quizzes`            │
│ └─ Insert em `modulos` (ref quiz) │
└────────────────────────────────────┘
                ↓
┌─ ALUNO ───────────────────────────┐
│ Acessa /curso/:id                  │
│ └─ ModulosList carrega todos       │
│    ├─ Vídeos (com ícone 🎥)       │
│    └─ Quizzes (com ícone 🎯)     │
└────────────────────────────────────┘
                ↓
┌─ ALUNO ───────────────────────────┐
│ Clica em um vídeo:                 │
│ ├─ Renderiza no player             │
│ └─ Marca como watched              │
│                                    │
│ Clica em um quiz:                  │
│ └─ Navega para /quiz/:quizId       │
└────────────────────────────────────┘
```

---

## Checklist

- [ ] Adicionar colunas `tipo` e `quiz_id` em `modulos`
- [ ] Importar `ModulosList` no CursoDetalhe
- [ ] Substituir seção "Vídeos" por `<ModulosList>`
- [ ] Testar com vídeos
- [ ] Testar com quizzes
- [ ] Testar navegação (vídeo vs quiz)
- [ ] Verificar order dos módulos

---

## Se der Erro

### "Coluna tipo não existe"
```sql
ALTER TABLE public.modulos ADD COLUMN tipo VARCHAR(50) DEFAULT 'video_lesson';
```

### "Coluna quiz_id não existe"
```sql
ALTER TABLE public.modulos ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;
```

### "Não carrega módulos"
1. Verificar se existem registros em `modulos` com o `curso_id`
2. Verificar console para erros de RLS
3. Verificar se `videos` ou `quizzes` existem

---

## Resultado Final

✅ Uma sidebar unificada mostrando:
- Vídeos do curso
- Quizzes do curso
- Contador de ambos
- Navegação automática

Pronto! 🚀
