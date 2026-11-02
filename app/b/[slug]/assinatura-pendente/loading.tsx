const BillingBlockedLoading = () => {
  return (
    <div
      className="mx-auto max-w-xl animate-pulse p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="bg-muted h-56 w-full rounded-xl" />
    </div>
  )
}

export default BillingBlockedLoading
