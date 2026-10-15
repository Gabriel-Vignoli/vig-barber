const AtendenteLoading = () => {
  return (
    <div
      className="mx-auto max-w-2xl animate-pulse space-y-6 p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="space-y-2">
        <div className="bg-muted h-7 w-48 rounded lg:h-8" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="bg-muted h-10 w-full rounded-md" />
          </div>
        ))}

        <div className="bg-muted h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

export default AtendenteLoading
