import { toast } from "sonner"

// After an invitation is created: offers the link so the inviter can send it
// another way (e.g. WhatsApp). When the email failed the toast stays open,
// since copying the link is the only way to deliver the invite.
export const showInviteLinkToast = ({
  title,
  emailSent,
  inviteUrl,
}: {
  title: string
  emailSent: boolean
  inviteUrl: string
}) => {
  const show = emailSent ? toast.success : toast.warning

  show(title, {
    description: emailSent
      ? "Enviamos o link por email. Você também pode copiá-lo e enviar por WhatsApp."
      : "Não conseguimos enviar o email. Copie o link e envie para a pessoa (por exemplo, no WhatsApp).",
    duration: emailSent ? 10000 : Infinity,
    closeButton: true,
    action: {
      label: "Copiar link",
      onClick: () => copyInviteLink(inviteUrl),
    },
  })
}

const copyInviteLink = async (inviteUrl: string) => {
  try {
    await navigator.clipboard.writeText(inviteUrl)
    toast.success("Link do convite copiado!")
  } catch {
    // Clipboard blocked (e.g. no permission): show the link to copy by hand
    toast.info("Copie o link do convite:", {
      description: inviteUrl,
      duration: Infinity,
      closeButton: true,
    })
  }
}
