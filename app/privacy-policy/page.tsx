import Header from "../components/header"
import { PRIVACY_POLICY_SECTIONS } from "../_constants/privacy-policy"

const PrivacyPolicyPage = () => {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
        <h1 className="text-xl font-bold lg:text-2xl">
          Política de Privacidade
        </h1>

        <div className="space-y-4 text-sm text-gray-400 lg:text-base">
          <p>
            Esta política descreve como a Vig Barber coleta, usa e protege suas
            informações pessoais.
          </p>

          {PRIVACY_POLICY_SECTIONS.map((section) => (
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

export default PrivacyPolicyPage
