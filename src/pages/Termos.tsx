import LegalLayout from '@/components/LegalLayout';

export default function Termos() {
  return (
    <LegalLayout titulo="Termos de uso" atualizadoEm="15 de junho de 2026">
      <p>
        Estes Termos de Uso ("Termos") regem o acesso e a utilização da plataforma de ensino
        <strong> PanaLearn</strong> ("Plataforma"), disponível em <strong>panalearn.com</strong>. Ao
        criar uma conta ou utilizar a Plataforma, você concorda com estes Termos. Se não concordar,
        não utilize a Plataforma.
      </p>

      <h2>1. Definições</h2>
      <ul>
        <li><strong>Organização:</strong> empresa ou instituição que contrata a Plataforma e cadastra seus alunos.</li>
        <li><strong>Administrador:</strong> usuário com permissão para gerenciar cursos, usuários e configurações da Organização.</li>
        <li><strong>Aluno:</strong> usuário que acessa os cursos disponibilizados pela Organização.</li>
        <li><strong>Conteúdo:</strong> cursos, vídeos, quizzes, materiais e certificados disponibilizados na Plataforma.</li>
      </ul>

      <h2>2. Cadastro e conta</h2>
      <p>
        Para usar a Plataforma é necessário criar uma conta com informações verdadeiras e atualizadas.
        Você é responsável por manter a confidencialidade da sua senha e por todas as atividades
        realizadas com a sua conta. Notifique-nos imediatamente em caso de uso não autorizado.
      </p>

      <h2>3. Planos, período de teste e pagamento</h2>
      <ul>
        <li>A Plataforma é oferecida por assinatura, conforme os planos descritos na página de planos.</li>
        <li>Podemos oferecer um <strong>período de teste gratuito</strong>. Ao final do período, a cobrança do plano contratado pode ser iniciada, salvo cancelamento prévio.</li>
        <li>Os pagamentos são processados pelo parceiro <strong>Asaas</strong>. Valores, formas de pagamento e datas de vencimento são exibidos no momento da contratação.</li>
        <li>Em caso de inadimplência, o acesso pode ser suspenso até a regularização.</li>
      </ul>

      <h2>4. Cancelamento e reembolso</h2>
      <p>
        Você pode cancelar a assinatura a qualquer momento; o cancelamento encerra renovações
        futuras. Salvo disposição legal aplicável (como o direito de arrependimento previsto no Código
        de Defesa do Consumidor), os valores referentes a períodos já utilizados não são reembolsáveis.
      </p>

      <h2>5. Uso aceitável</h2>
      <p>Ao usar a Plataforma, você concorda em não:</p>
      <ul>
        <li>Violar leis aplicáveis ou direitos de terceiros.</li>
        <li>Compartilhar credenciais de acesso ou burlar limites do plano contratado.</li>
        <li>Copiar, distribuir ou revender o Conteúdo sem autorização.</li>
        <li>Enviar conteúdo ilícito, ofensivo, ou que infrinja direitos autorais.</li>
        <li>Tentar acessar áreas ou dados de outras organizações, comprometer a segurança ou interferir no funcionamento da Plataforma.</li>
      </ul>

      <h2>6. Conteúdo da Organização</h2>
      <p>
        A Organização é responsável pelo Conteúdo que cadastra (vídeos, cursos, materiais) e declara
        possuir os direitos necessários para disponibilizá-lo. A PanaLearn não se responsabiliza pelo
        Conteúdo criado pelas Organizações, mas pode removê-lo em caso de violação destes Termos ou da
        lei.
      </p>

      <h2>7. Propriedade intelectual</h2>
      <p>
        A Plataforma, sua marca, design e software são de propriedade da PanaLearn e protegidos por
        lei. Estes Termos não transferem nenhum direito de propriedade intelectual sobre a Plataforma.
        O Conteúdo cadastrado por cada Organização permanece de titularidade da respectiva Organização.
      </p>

      <h2>8. Certificados</h2>
      <p>
        Os certificados emitidos pela Plataforma atestam a conclusão de cursos conforme as regras
        definidas pela Organização. A validade e o reconhecimento dos certificados perante terceiros
        são de responsabilidade da Organização emissora.
      </p>

      <h2>9. Disponibilidade do serviço</h2>
      <p>
        Empenhamo-nos para manter a Plataforma disponível, mas não garantimos funcionamento
        ininterrupto. Podem ocorrer paradas para manutenção, atualizações ou por fatores fora do nosso
        controle. Sempre que possível, manutenções programadas serão comunicadas com antecedência.
      </p>

      <h2>10. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida em lei, a PanaLearn não se responsabiliza por danos indiretos,
        lucros cessantes ou perda de dados decorrentes do uso ou da impossibilidade de uso da
        Plataforma. Nada nestes Termos limita responsabilidades que não possam ser excluídas por lei.
      </p>

      <h2>11. Suspensão e encerramento</h2>
      <p>
        Podemos suspender ou encerrar o acesso em caso de violação destes Termos, inadimplência ou uso
        indevido. Você pode encerrar sua conta a qualquer momento. Após o encerramento, seus dados são
        tratados conforme a <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>12. Alterações dos Termos</h2>
      <p>
        Podemos atualizar estes Termos periodicamente. A data de "última atualização" indica a versão
        vigente. O uso continuado após mudanças relevantes representa concordância com os novos Termos.
      </p>

      <h2>13. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do
        domicílio do consumidor para dirimir eventuais controvérsias, quando aplicável.
      </p>

      <h2>14. Contato</h2>
      <p>
        Dúvidas sobre estes Termos? Fale conosco em{' '}
        <a href="mailto:mipanalearn@gmail.com">mipanalearn@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
