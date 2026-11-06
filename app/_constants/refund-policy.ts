import { DEFAULT_PLAN, GRACE_DAYS, PLANS, TRIAL_DAYS } from "../_lib/plans"
import { LEGAL_ENTITY } from "./legal-entity"

const { priceLabel } = PLANS[DEFAULT_PLAN]

export const REFUND_POLICY_SECTIONS = [
  {
    title: "A quem se aplica",
    content: `Esta política vale para a assinatura da Vig Barber paga pelas barbearias (${priceLabel}). Serviços feitos em uma barbearia são pagos diretamente a ela, e qualquer devolução desses valores deve ser tratada com a própria barbearia.`,
  },
  {
    title: "Teste grátis",
    content: `Os primeiros ${TRIAL_DAYS} dias são grátis e não exigem cartão. Quem assina durante o teste só é cobrado quando ele termina, e pode cancelar antes disso sem nenhuma cobrança.`,
  },
  {
    title: "Reembolso em até 7 dias",
    content: `Você pode desistir e receber o reembolso integral em até 7 dias corridos após a primeira cobrança paga da assinatura. Para pedir, escreva para ${LEGAL_ENTITY.contactEmail} com o nome da barbearia e o email da conta. O acesso é encerrado quando o reembolso é feito.`,
  },
  {
    title: "Depois de 7 dias",
    content:
      "Passado esse prazo, as mensalidades já pagas e os períodos parciais não são reembolsados, exceto em caso de cobrança indevida, cobrança em duplicidade ou quando a lei determinar.",
  },
  {
    title: "Como cancelar",
    content:
      "Você pode cancelar a qualquer momento, sem multa, na página Assinatura do painel da barbearia. O cancelamento impede novas cobranças e o acesso continua até o fim do período já pago.",
  },
  {
    title: "Como o reembolso é feito",
    content:
      "O valor é devolvido no mesmo cartão usado no pagamento, por meio da Stripe. Depois de aprovado, o prazo para aparecer na fatura depende do banco ou da operadora do cartão.",
  },
  {
    title: "Pagamento que falhou",
    content: `Se uma renovação falhar, a barbearia tem ${GRACE_DAYS} dias para atualizar o cartão antes do bloqueio. Nada é cobrado por esse período além da própria mensalidade em aberto.`,
  },
  {
    title: "Dados depois do cancelamento",
    content:
      "Os dados da barbearia continuam guardados após o cancelamento, para que ela possa voltar a assinar. A exclusão pode ser pedida a qualquer momento, nos termos da Política de Privacidade.",
  },
  {
    title: "Dúvidas",
    content: `Fale conosco em ${LEGAL_ENTITY.contactEmail}.`,
  },
]
