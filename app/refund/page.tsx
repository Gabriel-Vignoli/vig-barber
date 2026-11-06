import type { Metadata } from "next"
import LegalDocument from "../components/legal-document"
import { REFUND_POLICY_SECTIONS } from "../_constants/refund-policy"

export const metadata: Metadata = {
  title: "Política de Reembolso",
  description:
    "Cancelamento e reembolso da assinatura da plataforma Vig Barber.",
}

const RefundPage = () => {
  return (
    <LegalDocument
      title="Política de Reembolso"
      intro="Como funcionam o cancelamento e o reembolso da assinatura da Vig Barber."
      sections={REFUND_POLICY_SECTIONS}
    />
  )
}

export default RefundPage
