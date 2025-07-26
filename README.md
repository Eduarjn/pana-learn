
# ERA Learn - Plataforma de Treinamento Corporativo

Plataforma inteligente de treinamento corporativo especializada em PABX e soluções Omnichannel.

## Estrutura do Projeto

```
├── frontend/           # Aplicação React/TypeScript
│   ├── src/           # Código fonte do frontend
│   ├── public/        # Arquivos estáticos
│   └── package.json   # Dependências do frontend
├── backend/           # Configurações do backend
│   ├── supabase/      # Configurações e migrações do Supabase
│   └── README.md      # Documentação do backend
└── README.md          # Este arquivo
```

## Tecnologias

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- Shadcn/UI
- React Router
- TanStack Query

### Backend
- Supabase (BaaS)
- PostgreSQL
- Row Level Security (RLS)
- Supabase Auth

## Como executar o projeto

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Supabase CLI (opcional, para desenvolvimento local)

### Desenvolvimento Local

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd pana-learn
   ```

2. **Configure o Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Configure o Backend (opcional)**
   ```bash
   # Instale o Supabase CLI
   npm install -g @supabase/cli
   
   # Inicie o Supabase localmente
   cd backend
   supabase start
   ```

4. **Acesse a aplicação**
   - Frontend: http://localhost:8080
   - Supabase Studio: http://localhost:54323 (se rodando localmente)

## Credenciais de Teste

A aplicação possui usuários de teste pré-configurados:

- **Administrador**
  - Email: admin@eralearn.com
  - Senha: test123456

- **Cliente**
  - Email: cliente@eralearn.com
  - Senha: test123456

## Funcionalidades

### Para Administradores
- Dashboard com métricas gerais
- Gestão de cursos e vídeos
- Upload de conteúdo de treinamento
- Relatórios de progresso
- Gestão de usuários
- Emissão de certificados

### Para Clientes
- Acesso aos treinamentos
- Acompanhamento de progresso
- Certificados obtidos
- Dashboard personalizado

## Estrutura de Dados

### Principais Entidades
- **Usuários** - Gestão de contas e perfis
- **Cursos** - Catálogo de treinamentos
- **Módulos** - Subdivisões dos cursos
- **Vídeos** - Biblioteca de conteúdo
- **Progresso** - Acompanhamento individual
- **Certificados** - Certificações emitidas

## Deploy

### Frontend
O frontend pode ser deployado em qualquer serviço de hospedagem estática:
- Vercel
- Netlify
- GitHub Pages

### Backend
O backend está configurado para usar Supabase como serviço gerenciado.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto é proprietário da PANA.

## Suporte

Para suporte técnico, entre em contato através do email: suporte@pana.com.br
