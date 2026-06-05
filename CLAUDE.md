# PanaLearn — Guia para Claude Code

## Design System

Este projeto usa o **PanaLearn Design System** localizado em:
`C:\Users\eduar\Downloads\brandbookpanalearn`

### Referência rápida — use o design system deste projeto

Antes de criar ou modificar qualquer componente visual, consulte:
- `brandbookpanalearn/README.md` — fundamentos visuais, voz/tom, iconografia
- `brandbookpanalearn/panalearn-design-system.md` — tokens CSS, sidebar, botões, badges
- `brandbookpanalearn/colors_and_type.css` — variáveis CSS completas

### Paleta de cores

| Token Tailwind | Hex | Uso |
|---|---|---|
| `pana-indigo` | `#1F2041` | Sidebar bg, headers |
| `pana-grape` | `#4B3F72` | Item ativo, botão secundário, focus ring |
| `pana-teal` | `#417B5A` | CTA principal, badge ativo |
| `pana-bone` | `#D0CEBA` | Texto sobre fundo escuro |
| `pana-petal` | `#E9D2C0` | Texto logo, badge Trial |

### Fontes
- **Quicksand** — headings, display, wordmark (peso 600/700)
- **Inter** — UI e corpo (peso 400/500)

### Regras de UI
- Sentence case sempre — nunca Title Case
- Emoji somente em toasts/notificações
- Sidebar ativa: `bg-pana-grape text-pana-petal`
- Item inativo hover: `hover:bg-white/[0.07]`

## Stack
- React 18 + TypeScript + Vite 5
- shadcn/ui + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- React Router 6

## Estrutura chave
```
src/
├── components/ERASidebar.tsx   # sidebar principal
├── context/BrandingContext.tsx  # branding por tenant
├── hooks/useAuth.tsx            # autenticação + perfil
└── integrations/supabase/       # cliente + tipos
```

## Multi-tenancy
Cada empresa é um tenant isolado por `empresa_id`. O `admin_master` pode visualizar qualquer tenant. Ver `src/context/EmpresaContext.tsx`.
