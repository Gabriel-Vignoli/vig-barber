const LoginLoading = () => {
  return (
    <div
      className="flex min-h-screen animate-pulse flex-col items-center justify-center gap-6 p-4"
      aria-busy="true"
      aria-label="Carregando"
    >
      <div className="bg-muted h-8 w-36 rounded" />

      <div className="flex flex-col items-center gap-2">
        <div className="bg-muted h-6 w-24 rounded" />
        <div className="bg-muted h-4 w-64 rounded" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div className="bg-muted h-10 w-full rounded-md" />
        <div className="bg-muted h-10 w-full rounded-md" />
        <div className="bg-muted h-10 w-full rounded-md" />
        <div className="bg-muted h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

export default LoginLoading
