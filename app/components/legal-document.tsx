import Header from "./header"
import { LEGAL_UPDATED_AT } from "../_constants/legal-entity"

interface LegalDocumentProps {
  title: string
  intro: string
  sections: { title: string; content: string }[]
}

// Shared layout of the public legal pages
const LegalDocument = ({ title, intro, sections }: LegalDocumentProps) => {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <div className="space-y-1">
          <h1 className="text-xl font-bold lg:text-2xl">{title}</h1>
          <p className="text-muted-foreground text-sm">
            Última atualização: {LEGAL_UPDATED_AT}
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-400 lg:text-base">
          <p>{intro}</p>

          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-foreground font-semibold">{section.title}</h2>
              <p>{section.content}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

export default LegalDocument
