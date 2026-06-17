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
- [ ] Editor de trilhas/módulos com pré-requisitos e ordem — **código**
- [ ] Analytics de engajamento (heatmap de vídeo, abandono) — **código**
- [ ] Otimização de custo/escala (cache, índices, revisar Bunny/bandwidth) — **código**

## 🟩 Fase 3 — Crescimento (6-12 meses)
*Virar plataforma, não só produto.*

- [ ] API pública + documentação (integrável pelos clientes) — **código**
- [ ] App mobile nativo (se a demanda pedir) — **código**
- [ ] White-label avançado (domínio próprio por tenant, e-mail por tenant) — **código+ops**
- [ ] Multi-region / alta disponibilidade — **ops**
- [ ] Marketplace/catálogo de cursos compartilháveis (se fizer sentido) — **código**
- [ ] Certificações de compliance (SOC2 light, LGPD auditada) — **ops/comercial**

---

## 🔁 Transversal (sempre, em paralelo)
- **Comercial**: 5-10 clientes pagantes felizes > paridade de features. Prova social, cases, depoimentos.
- **Suporte**: SLA claro, base de conhecimento, canal de atendimento.
- **Preço/posicionamento**: verticalizar em vez de "LMS genérico".

**Princípio-guia:** 3 features bem feitas que o cliente pediu valem mais que 20 medianas.

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
