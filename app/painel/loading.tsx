const PainelLoading = () => {
  return (
    <div
      className="mx-auto max-w-3xl animate-pulse space-y-6 p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="space-y-2">
        <div className="bg-muted h-7 w-52 rounded lg:h-8" />
        <div className="bg-muted h-4 w-72 rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-muted h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default PainelLoading
