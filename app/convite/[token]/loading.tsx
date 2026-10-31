const InvitationLoading = () => {
  return (
    <div
      className="mx-auto max-w-md animate-pulse p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="bg-muted flex h-72 w-full flex-col items-center justify-center gap-4 rounded-xl" />
    </div>
  )
}

export default InvitationLoading
