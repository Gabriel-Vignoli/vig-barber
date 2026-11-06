import type { Metadata } from "next"
import LegalDocument from "../components/legal-document"
import { TERMS_OF_SERVICE_SECTIONS } from "../_constants/terms-of-service"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "As regras de uso da plataforma Vig Barber.",
}

const TermsPage = () => {
  return (
    <LegalDocument
      title="Termos de Uso"
      intro="Leia estes termos antes de usar a plataforma. Eles valem para clientes, equipes e donos de barbearias."
      sections={TERMS_OF_SERVICE_SECTIONS}
    />
  )
}

export default TermsPage
