import { LEGAL_ENTITY } from "./legal-entity"

export const PRIVACY_POLICY_SECTIONS = [
  {
    title: "Quem somos",
    content: `A Vig Barber é uma plataforma de agendamento online usada por várias barbearias independentes. Uma única conta permite agendar em qualquer barbearia cadastrada. A plataforma é operada por ${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.document}, ${LEGAL_ENTITY.address}. Contato e assuntos de privacidade: ${LEGAL_ENTITY.contactEmail}.`,
  },
  {
    title: "Quem é responsável pelos seus dados",
    content:
      "A Vig Barber é a controladora dos dados da sua conta e do funcionamento da plataforma. Cada barbearia é controladora dos dados que usa para atender seus próprios clientes e gerir sua equipe, e nesses casos a Vig Barber atua como operadora, tratando os dados conforme as instruções da barbearia.",
  },
  {
    title: "Dados que coletamos",
    content:
      "Conta: nome, email e senha (guardada apenas em forma de hash). No login com Google, recebemos nome, email e foto do perfil. Agendamento: telefone de contato, serviço, profissional, data, horário, situação e forma de pagamento informada. Avaliações: nota e comentário. Atendimento presencial: quando a recepção registra um cliente sem conta, guardamos o nome e, se informado, o telefone dele. Equipe e donos de barbearia: dados de cadastro, função, horários de trabalho e, na assinatura, o email de cobrança. Dados de cartão são informados diretamente à Stripe e não passam pelos nossos servidores. Segurança: tentativas de login e códigos de redefinição de senha.",
  },
  {
    title: "Para que usamos e com qual base legal",
    content:
      "Execução de contrato: criar sua conta, permitir e administrar agendamentos e fornecer o painel às barbearias. Legítimo interesse: proteger a plataforma contra fraude e acessos indevidos, corrigir falhas e exibir avaliações, que ajudam outros clientes a escolher. Obrigação legal: cumprir deveres legais, fiscais e regulatórios. Consentimento: carregar o mapa do Google, somente quando você escolhe abri-lo. Não vendemos seus dados nem os compartilhamos para fins de marketing.",
  },
  {
    title: "O que a barbearia e o público veem",
    content:
      "Ao agendar, a equipe autorizada daquela barbearia vê seu nome, sua foto, o serviço, o profissional, a data e o horário. A administração e a recepção também veem seu telefone e seu email, para falar com você sobre a reserva. Uma barbearia não vê seus agendamentos em outras barbearias. Suas avaliações são públicas: qualquer visitante pode ver seu nome, sua foto, a nota e o comentário na página do profissional.",
  },
  {
    title: "Serviços de terceiros",
    content:
      "Compartilhamos apenas o necessário com provedores que nos ajudam a operar: Vercel (hospedagem), Supabase (banco de dados), Resend (emails de redefinição de senha e convites), UploadThing (imagens das barbearias), Google (login e mapa) e Stripe (pagamento das assinaturas). Podemos também fornecer dados quando a lei ou uma autoridade competente exigir.",
  },
  {
    title: "Transferência internacional",
    content:
      "Nosso banco de dados fica no Brasil, mas alguns provedores, como Vercel, Resend, Google e Stripe, podem tratar dados em outros países, inclusive nos Estados Unidos. Essas transferências ocorrem para executar o serviço e seguem as salvaguardas previstas na LGPD.",
  },
  {
    title: "Cookies",
    content:
      "Usamos apenas cookies essenciais, que mantêm você conectado, e guardamos no seu navegador que você já viu o aviso de cookies. Não usamos cookies de publicidade nem ferramentas de rastreamento. O mapa do Google só é carregado se você clicar em “Carregar mapa”; a partir daí, o Google recebe seu IP e pode definir cookies próprios.",
  },
  {
    title: "Por quanto tempo guardamos",
    content:
      "Guardamos os dados enquanto sua conta estiver ativa ou enquanto forem necessários às finalidades acima. Se você pedir a exclusão, apagamos ou anonimizamos seus dados pessoais, exceto o que precisarmos manter para cumprir a lei ou exercer direitos. Agendamentos já realizados e avaliações, com a nota e o comentário que você escreveu, podem continuar no histórico da barbearia sem o seu nome. Os dados de uma barbearia com assinatura encerrada ficam guardados até que sua exclusão seja solicitada.",
  },
  {
    title: "Segurança",
    content:
      "Usamos conexões criptografadas, senhas em hash, separação dos dados entre barbearias e controle de acesso por função. Nenhum sistema é totalmente seguro; se ocorrer um incidente que possa causar risco ou dano relevante, comunicaremos os titulares afetados e a Autoridade Nacional de Proteção de Dados (ANPD).",
  },
  {
    title: "Crianças e adolescentes",
    content:
      "A conta é destinada a maiores de 18 anos. Menores de idade devem ter o agendamento feito por um responsável legal. Se identificarmos dados de uma criança tratados sem o consentimento do responsável, vamos excluí-los.",
  },
  {
    title: "Seus direitos",
    content: `Pela LGPD, você pode pedir a confirmação do tratamento, o acesso, a correção, a anonimização ou exclusão de dados, a portabilidade, informações sobre compartilhamento e a revisão de decisões, além de revogar o consentimento e se opor a tratamentos irregulares. Em Meu Perfil, você mesmo pode baixar seus dados e excluir sua conta. Para os demais pedidos, escreva para ${LEGAL_ENTITY.contactEmail}. Responderemos em até 15 dias. Você também pode reclamar à ANPD. Pedidos sobre o atendimento de uma barbearia podem ser encaminhados diretamente a ela.`,
  },
  {
    title: "Alterações",
    content:
      "Podemos atualizar esta política. A data da última atualização aparece no topo da página e, em mudanças relevantes, avisaremos pelos canais da plataforma.",
  },
]
