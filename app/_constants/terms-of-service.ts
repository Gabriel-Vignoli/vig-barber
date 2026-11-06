import { GRACE_DAYS, PLANS, DEFAULT_PLAN, TRIAL_DAYS } from "../_lib/plans"
import { LEGAL_ENTITY } from "./legal-entity"

const { priceLabel } = PLANS[DEFAULT_PLAN]

export const TERMS_OF_SERVICE_SECTIONS = [
  {
    title: "Aceitação",
    content: `Estes termos regem o uso da plataforma Vig Barber, operada por ${LEGAL_ENTITY.name}, ${LEGAL_ENTITY.document}, ${LEGAL_ENTITY.address}. Ao criar uma conta ou usar a plataforma, você concorda com estes termos e com a Política de Privacidade.`,
  },
  {
    title: "O que é a plataforma",
    content:
      "A Vig Barber conecta clientes a barbearias independentes e oferece a elas ferramentas de agendamento e gestão. A Vig Barber não presta serviços de barbearia: cada barbearia é a única responsável pelos serviços, preços, horários, profissionais e atendimento que oferece.",
  },
  {
    title: "Sua conta",
    content:
      "A conta é destinada a maiores de 18 anos. Você deve informar dados verdadeiros, manter sua senha em segurança e responder pelo que for feito com sua conta. Avise-nos se suspeitar de uso indevido.",
  },
  {
    title: "Agendamentos",
    content:
      "O agendamento é feito diretamente com a barbearia. O pagamento do serviço, quando houver, é combinado com ela e não é processado pela Vig Barber. Dúvidas ou reclamações sobre o atendimento devem ser tratadas com a barbearia. Compareça no horário marcado ou cancele sua reserva pela plataforma.",
  },
  {
    title: "Avaliações e conteúdo",
    content:
      "As avaliações são públicas e devem refletir uma experiência real. Não publique conteúdo ofensivo, falso, ilegal ou que viole direitos de terceiros. Podemos remover o que descumprir estes termos. Você e as barbearias continuam donos do conteúdo que enviam e nos autorizam a exibi-lo para operar a plataforma.",
  },
  {
    title: "Uso proibido",
    content:
      "É proibido usar a plataforma para fraude, acessar dados ou áreas sem autorização, testar ou contornar medidas de segurança, coletar dados de outros usuários de forma automatizada ou prejudicar o funcionamento do serviço.",
  },
  {
    title: "Barbearias: assinatura",
    content: `O plano custa ${priceLabel}, pago por cartão de crédito por meio da Stripe, com renovação mensal automática até o cancelamento. Cada barbearia tem ${TRIAL_DAYS} dias de teste grátis, sem necessidade de cartão. Quem assina durante o teste só é cobrado quando ele termina. Se um pagamento falhar, a barbearia tem ${GRACE_DAYS} dias para regularizar; depois disso, o painel e os novos agendamentos ficam bloqueados até a regularização, e os dados continuam guardados. Mudanças de preço serão avisadas com pelo menos 30 dias de antecedência.`,
  },
  {
    title: "Barbearias: cancelamento e reembolso",
    content:
      "A assinatura pode ser cancelada a qualquer momento na página Assinatura do painel, sem multa. As condições de reembolso estão na Política de Reembolso.",
  },
  {
    title: "Barbearias: dados dos clientes",
    content:
      "A barbearia é controladora dos dados que usa para atender seus clientes e gerir sua equipe, e a Vig Barber atua como operadora, tratando esses dados apenas para prestar o serviço, seguindo as instruções da barbearia, com medidas de segurança adequadas e subcontratando somente os provedores listados na Política de Privacidade. A barbearia deve usar esses dados apenas para o atendimento, ter base legal para registrar clientes sem conta, informá-los sobre esse registro e atender aos pedidos deles. Avisaremos a barbearia sobre incidentes de segurança que afetem seus dados.",
  },
  {
    title: "Disponibilidade",
    content:
      "Trabalhamos para manter a plataforma disponível, mas ela pode ficar fora do ar por manutenção, falhas ou motivos alheios ao nosso controle, e pode mudar com o tempo. Mudanças relevantes para assinantes serão avisadas com antecedência.",
  },
  {
    title: "Suspensão e encerramento",
    content:
      "Podemos suspender ou encerrar contas e barbearias que descumpram estes termos ou a lei, avisando sempre que possível. Você pode parar de usar a plataforma a qualquer momento e pedir a exclusão da sua conta, nos termos da Política de Privacidade.",
  },
  {
    title: "Responsabilidade",
    content:
      "A Vig Barber não responde pelos serviços prestados pelas barbearias nem por condutas de terceiros, salvo nos casos previstos em lei. Nada nestes termos limita direitos que a legislação, inclusive o Código de Defesa do Consumidor, garante e que não possam ser afastados.",
  },
  {
    title: "Alterações",
    content:
      "Podemos atualizar estes termos. A data da última atualização aparece no topo da página e, em mudanças relevantes, avisaremos antes que elas passem a valer.",
  },
  {
    title: "Lei aplicável, foro e contato",
    content: `Estes termos seguem as leis do Brasil. Para consumidores, vale o foro do seu domicílio; nos demais casos, o foro de ${LEGAL_ENTITY.courtCity}. Contato: ${LEGAL_ENTITY.contactEmail}.`,
  },
]
