const AdminLoading = () => {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse space-y-6 p-4 lg:p-8"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="space-y-2">
        <div className="bg-muted h-7 w-40 rounded lg:h-8" />
        <div className="bg-muted h-4 w-56 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted h-24 rounded-xl lg:h-28" />
        ))}
      </div>

      <div className="bg-muted h-64 w-full rounded-xl lg:h-80" />
    </div>
  )
}

export default AdminLoading
