const ProfileLoading = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-8">
      <div className="bg-muted h-7 w-32 animate-pulse rounded lg:h-8" />

      <div className="flex items-center gap-3 xl:gap-4">
        <div className="bg-muted size-14 animate-pulse rounded-full xl:size-18" />
        <div className="space-y-2">
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-3 w-40 animate-pulse rounded" />
        </div>
      </div>

      <div className="bg-muted h-32 w-full animate-pulse rounded-xl" />
      <div className="bg-muted h-32 w-full animate-pulse rounded-xl" />
    </div>
  )
}

export default ProfileLoading
