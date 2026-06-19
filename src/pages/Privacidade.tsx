import LegalLayout from '@/components/LegalLayout';

export default function Privacidade() {
  return (
    <LegalLayout titulo="Política de privacidade" atualizadoEm="15 de junho de 2026">
      <p>
        Esta Política de Privacidade descreve como a <strong>PanaLearn</strong> ("PanaLearn", "nós")
        coleta, usa, compartilha e protege os dados pessoais de quem utiliza a plataforma de ensino
        disponível em <strong>panalearn.com</strong> ("Plataforma"). Tratamos dados pessoais em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — "LGPD").
      </p>

      <h2>1. Quem é o controlador dos dados</h2>
      <p>
        O controlador dos dados é a PanaLearn [razão social e CNPJ a preencher], com contato pelo
        e-mail <a href="mailto:mipanalearn@gmail.com">mipanalearn@gmail.com</a>.
      </p>
      <p>
        Quando uma organização (empresa cliente) cadastra seus próprios alunos na Plataforma, essa
        organização atua como controladora dos dados dos seus alunos, e a PanaLearn atua como
        operadora, tratando os dados conforme as instruções da organização e desta Política.
      </p>

      <h2>2. Dados que coletamos</h2>
      <h3>2.1. Dados que você nos fornece</h3>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, senha (armazenada de forma criptografada) e nome da organização.</li>
        <li><strong>Pagamento:</strong> CPF ou CNPJ e dados de cobrança, processados pelo nosso parceiro de pagamentos (Asaas). A PanaLearn não armazena dados completos de cartão de crédito.</li>
        <li><strong>Personalização:</strong> logotipo, cores e nome da plataforma da sua organização.</li>
        <li><strong>Suporte:</strong> informações que você envia ao solicitar atendimento.</li>
      </ul>
      <h3>2.2. Dados coletados automaticamente</h3>
      <ul>
        <li><strong>Uso da plataforma:</strong> cursos acessados, progresso em vídeos, tentativas e notas de quizzes, certificados emitidos.</li>
        <li><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo e navegador, datas e horários de acesso, registros de autenticação.</li>
        <li><strong>Cookies:</strong> usados para manter sua sessão ativa e lembrar preferências (ver seção 9).</li>
      </ul>

      <h2>3. Para que usamos os dados</h2>
      <ul>
        <li>Criar e manter sua conta e a da sua organização.</li>
        <li>Fornecer os cursos, registrar progresso e emitir certificados.</li>
        <li>Processar pagamentos e gerenciar assinaturas.</li>
        <li>Prestar suporte e responder solicitações.</li>
        <li>Garantir a segurança, prevenir fraudes e cumprir obrigações legais.</li>
        <li>Melhorar a Plataforma e desenvolver novas funcionalidades.</li>
        <li>Responder dúvidas no chat de suporte por IA — as perguntas digitadas são enviadas ao serviço da Anthropic e a resposta retorna sem armazenar dados pessoais identificáveis fora da Plataforma.</li>
      </ul>

      <h2>4. Bases legais</h2>
      <p>
        Tratamos dados pessoais com base em: execução de contrato (para fornecer o serviço),
        cumprimento de obrigação legal/regulatória, legítimo interesse (para segurança e melhoria
        do serviço) e, quando aplicável, no seu consentimento.
      </p>

      <h2>5. Compartilhamento com terceiros</h2>
      <p>Compartilhamos dados apenas com fornecedores necessários para operar a Plataforma:</p>
      <ul>
        <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento de arquivos.</li>
        <li><strong>Asaas</strong> — processamento de pagamentos.</li>
        <li><strong>Bunny.net</strong> — hospedagem e streaming dos vídeos.</li>
        <li><strong>Netlify</strong> — hospedagem da aplicação web e funções serverless.</li>
        <li><strong>Anthropic</strong> — modelo de IA do assistente de suporte; recebe apenas as perguntas que o usuário envia ao chat, sem dados pessoais identificáveis no corpo da requisição.</li>
      </ul>
      <p>
        Esses fornecedores tratam os dados conforme nossas instruções e suas próprias políticas de
        segurança. Não vendemos dados pessoais.
      </p>

      <h2>6. Transferência internacional</h2>
      <p>
        Alguns fornecedores podem armazenar ou processar dados fora do Brasil. Nesses casos, adotamos
        salvaguardas adequadas para garantir um nível de proteção compatível com a LGPD.
      </p>

      <h2>7. Por quanto tempo guardamos os dados</h2>
      <p>Mantemos os dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais. Como regra:</p>
      <ul>
        <li><strong>Dados da conta</strong> (nome, e-mail, perfil): enquanto a conta estiver ativa.</li>
        <li><strong>Após exclusão da conta</strong>: dados pessoais são anonimizados ou excluídos em até <strong>30 dias</strong>.</li>
        <li><strong>Registros financeiros</strong> (faturas, recibos): até <strong>5 anos</strong>, por exigência da legislação fiscal.</li>
        <li><strong>Logs de acesso e segurança</strong> (IP, login, falhas de autenticação): <strong>12 meses</strong>.</li>
        <li><strong>Conteúdo de cursos</strong> publicado pela organização: até o cancelamento da assinatura + 30 dias para exportação.</li>
        <li><strong>Histórico do chat de suporte por IA</strong>: 90 dias após a última interação.</li>
      </ul>

      <h2>8. Seus direitos</h2>
      <p>Como titular de dados, você pode, a qualquer momento:</p>
      <ul>
        <li>Confirmar a existência de tratamento e acessar seus dados.</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
        <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.</li>
        <li>Solicitar a portabilidade dos dados.</li>
        <li>Revogar o consentimento e se opor a tratamentos.</li>
      </ul>
      <p>
        Para exercer estes direitos, você pode usar a página{' '}
        <a href="/meus-dados"><strong>Meus dados</strong></a> dentro da Plataforma (autosserviço para
        exportar seus dados em JSON ou excluir sua conta), ou nos escrever em{' '}
        <a href="mailto:mipanalearn@gmail.com">mipanalearn@gmail.com</a>. Se você for aluno de
        uma organização, encaminharemos sua solicitação à organização responsável quando aplicável.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Usamos cookies essenciais para autenticação e funcionamento da Plataforma, e cookies de
        preferência para lembrar suas configurações. Você pode gerenciar cookies nas configurações do
        seu navegador; desabilitar cookies essenciais pode impedir o login.
      </p>

      <h2>10. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger os dados, incluindo criptografia em
        trânsito, isolamento de dados por organização e controle de acesso. Nenhum sistema é
        100% seguro, mas trabalhamos continuamente para reduzir riscos.
      </p>

      <h2>11. Dados de crianças e adolescentes</h2>
      <p>
        A Plataforma é destinada a organizações e seus colaboradores/alunos. Não coletamos
        intencionalmente dados de menores de 18 anos sem o consentimento e a supervisão dos
        responsáveis legais ou da instituição de ensino.
      </p>

      <h2>12. Alterações desta política</h2>
      <p>
        Podemos atualizar esta Política periodicamente. A data de "última atualização" no topo indica a
        versão vigente. Mudanças relevantes serão comunicadas pelos canais da Plataforma.
      </p>

      <h2>13. Contato</h2>
      <p>
        Para qualquer questão sobre privacidade e proteção de dados, fale com nosso encarregado pelo
        e-mail <a href="mailto:mipanalearn@gmail.com">mipanalearn@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
