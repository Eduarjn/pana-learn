# PanaLearn — Roadmap

Roadmap por fases para evoluir o PanaLearn (white-label de treinamento
corporativo em PT). Recorte estratégico: **não competir em largura com
Udemy/Hotmart** — ganhar por foco, idioma, suporte e simplicidade num nicho
(ex.: telecom/call center).

Legenda: **código** (dá pra implementar no repo) · **ops** (infra/operacional) ·
**comercial**.

---

## 🟥 Fase 0 — Estabilizar produção (2-4 semanas)
*Não cair com cliente pagante. Antes de qualquer feature nova.*

- [ ] Upgrade do Postgres (numa madrugada) — **ops** — alta
- [ ] Monitoramento de erros (Sentry no front + functions) — **código** — alta
- [ ] Confirmar backups automáticos do Supabase + testar restore — **ops** — alta
- [ ] Testes E2E do fluxo crítico (pagamento → ativação → vídeo → quiz → certificado) — **código** — alta
- [ ] CNPJ + revisão jurídica de Termos/Privacidade (LGPD) — **comercial** — alta
- [ ] Decidir seções fake (Integrações/Segurança): esconder de vez ou implementar SMTP/API real — **código** — média

## 🟧 Fase 1 — Maturidade de produto (1-3 meses)
*O que cliente corporativo realmente cobra.*

- [ ] Relatórios decentes (progresso por aluno/curso, exportar CSV/PDF, taxa de conclusão) — **código**
- [ ] i18n real (hoje o seletor de idioma é cosmético) — **código**
- [ ] PWA / experiência mobile (instalável, offline básico) — **código**
- [ ] SSO simples (login Google/Microsoft) — **código**
- [ ] Status page + e-mails transacionais próprios (SMTP/Resend) — **código+ops**
- [ ] Onboarding sem fricção (menos passos, dados de exemplo) — **código**
- [ ] Política de senha/2FA real (leaked-password já ok; faltam toggles funcionais) — **código**

## 🟨 Fase 2 — Diferenciação e escala (3-6 meses)
*Features que justificam preço e seguram churn.*

- [ ] Gamificação (badges, ranking, trilhas) — **código**
- [ ] SCORM/xAPI (importar conteúdo padrão de mercado) — **código**
- [ ] Integrações (Zoom/Meet para aulas ao vivo, webhook/CRM) — **código**
- [ ] **Trilhas com regras — Camada 1 (UX simples)**: cohorts/grupos, liberação programada (drip por data), pré-requisitos, conteúdo bloqueado — via formulário/toggles. Resolve o caso "English I/II" sem flow builder. Ver "Em avaliação" abaixo. — **código**
- [ ] Analytics de engajamento (heatmap de vídeo, abandono) — **código**
- [ ] Otimização de custo/escala (cache, índices, revisar Bunny/bandwidth) — **código**

## 🟩 Fase 3 — Crescimento (6-12 meses)
*Virar plataforma, não só produto.*

- [ ] API pública + documentação (integrável pelos clientes) — **código**
- [ ] App mobile nativo (se a demanda pedir) — **código**
- [ ] White-label avançado (domínio próprio por tenant, e-mail por tenant) — **código+ops**
- [ ] Multi-region / alta disponibilidade — **ops**
- [ ] Marketplace/catálogo de cursos compartilháveis (se fizer sentido) — **código**
- [ ] **Trilhas com regras — Camada 2 (construtor visual / flow builder)**: canvas drag-drop sobre o motor de regras da Camada 1 — SÓ se a demanda validar. Ver "Em avaliação". — **código**
- [ ] Certificações de compliance (SOC2 light, LGPD auditada) — **ops/comercial**

---

## 🔁 Transversal (sempre, em paralelo)
- **Comercial**: 5-10 clientes pagantes felizes > paridade de features. Prova social, cases, depoimentos.
- **Suporte**: SLA claro, base de conhecimento, canal de atendimento.
- **Preço/posicionamento**: verticalizar em vez de "LMS genérico".

**Princípio-guia:** 3 features bem feitas que o cliente pediu valem mais que 20 medianas.

---

## 🧭 Em avaliação — Construtor visual de trilhas (flow builder)

Ideia: um construtor visual (estilo flow builder) onde o admin desenha a
jornada do aluno — vídeos, quizzes, certificados, avaliações, conteúdo
bloqueado, liberação por data, regras de progressão e permissão por grupo
(ex.: cohort "English I" só vê a trilha English I).

**Distinção-chave (decisão de produto):** separar **a capacidade** (cohorts,
drip, pré-requisitos, gating) — que é funcionalidade valiosa e conhecida — do
**construtor visual** — que é escolha de UX de autoria, onde mora ~70% do
custo e do risco. → Por isso entra em **2 camadas**: Camada 1 (capacidade,
UX simples) na Fase 2; Camada 2 (flow builder visual) na Fase 3, só se houver
demanda comprovada.

**Análise (jun/2026):**
- **Valor**: alto na capacidade; médio/incerto no builder visual (maioria das
  trilhas corporativas é linear → formulário resolve 80%).
- **Mercado**: a *capacidade* já existe em todos (Moodle "Restrict access",
  Thinkific/Teachable drip, TalentLMS learning paths) — com UX pior. O *flow
  builder visual de jornada* é raro em LMS → diferencial de UX/demo, não de
  capacidade. Aproxima da categoria **LXP** (Disco/Sana) — comprador diferente.
- **Diferencial?** Potencial, porém frágil/copiável. Amplifica o
  posicionamento "moderno/simples"; não substitui o diferencial real
  (vertical + PT + suporte). Pensar como diferencial de demo/expansão.
- **Problemas reais que resolve**: isolamento por cohort, drip, pré-requisitos
  (compliance), conteúdo bloqueado. **Mas o caso "English I/II" é grupo +
  atribuição de trilha — não exige flow builder (≈1/3 do custo).**
- **Complexidade**: builder sozinho ~6-7 (usar React Flow); visão completa
  (builder + motor de regras + agendamento/timezone + permissão por grupo +
  runtime que força tudo + migrar cursos lineares) = **8,5/9**. Atenção: ACL
  por grupo colide com o modelo multi-tenant recém-blindado = nova superfície
  de segurança.
- **Prioridade**: **NÃO agora.** Fase 2 (Camada 1) e Fase 3 (Camada 2). Validar
  demanda antes; estabilidade/operacional/relatórios vêm primeiro.
- **Riscos**: over-engineering/time-sink; imposto de complexidade no admin SMB;
  edge cases do motor de regras; nova superfície de segurança (ACL grupo);
  diferenciação prematura; gap vender×usar; custo de oportunidade vs. mobile/
  relatórios/SSO.

**Veredito**: direcionalmente certo, mas construir em camadas. Capturar o valor
cedo (simples) e o "uau" visual depois, só se justificado. Maior risco não é
técnico — é construir o Ferrari antes de saber se o cliente quer dirigir.

---

## Já concluído (base de produção — jun/2026)
- Pagamento recorrente (Asaas) + webhook no apex + ativação validada
- Isolamento multi-tenant: áudios, cursos, quizzes, vídeos, quiz_perguntas, categorias
- admin_master vê cursos do cliente no painel da empresa
- Onboarding: medidor de força de senha, mostrar/ocultar senha, mensagens PT, senha forte
- Reset de senha pelo admin (reveal único; senha real é hash irreversível)
- Hardening: RLS por empresa, search_path nas funções, leaked-password protection, OTP 1h
- Bunny travado por referrer; Configurações com gate (admin_master / Enterprise)
- Migração de hospedagem Vercel → Netlify (Vercel aposentada); contato unificado em mipanalearn@gmail.com
