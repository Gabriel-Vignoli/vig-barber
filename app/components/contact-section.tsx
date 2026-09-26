import PhoneItem from "./phone-item"

interface ContactSectionProps {
  barbershopPhones: string[]
  employeePhone?: string | null
}

const ContactSection = ({
  barbershopPhones,
  employeePhone,
}: ContactSectionProps) => {
  const hasBarbershopPhones = barbershopPhones.length > 0
  const hasEmployeePhone = Boolean(employeePhone)
  const hasAnyContact = hasBarbershopPhones || hasEmployeePhone

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase">Contato</h3>

      {!hasAnyContact ? (
        <p className="text-muted-foreground text-sm">
          Nenhum contato disponível no momento.
        </p>
      ) : (
        <>
          {hasBarbershopPhones && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Barbearia
              </p>
              <div className="space-y-2">
                {barbershopPhones.map((phone, index) => (
                  <PhoneItem
                    key={`barbershop-${phone}-${index}`}
                    phone={phone}
                  />
                ))}
              </div>
            </div>
          )}

          {hasEmployeePhone && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Barbeiro
              </p>
              <PhoneItem phone={employeePhone as string} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ContactSection
