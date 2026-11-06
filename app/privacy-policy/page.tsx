import type { Metadata } from "next"
import LegalDocument from "../components/legal-document"
import { PRIVACY_POLICY_SECTIONS } from "../_constants/privacy-policy"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a plataforma Vig Barber coleta, usa e protege seus dados pessoais.",
}

const PrivacyPolicyPage = () => {
  return (
    <LegalDocument
      title="Política de Privacidade"
      intro="Esta política descreve como a plataforma Vig Barber coleta, usa e protege suas informações pessoais, em todas as barbearias que a utilizam, conforme a Lei Geral de Proteção de Dados (LGPD)."
      sections={PRIVACY_POLICY_SECTIONS}
    />
  )
}

export default PrivacyPolicyPage
