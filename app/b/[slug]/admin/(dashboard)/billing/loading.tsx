const BillingLoading = () => {
  return (
    <div
      className="mx-auto max-w-2xl animate-pulse space-y-6 p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="space-y-2">
        <div className="bg-muted h-7 w-40 rounded lg:h-8" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      <div className="bg-muted h-48 w-full rounded-xl" />
    </div>
  )
}

export default BillingLoading
