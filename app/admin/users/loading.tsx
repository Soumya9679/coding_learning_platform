export default function AdminUsersLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-4">
      {/* Header + search */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-card rounded-lg animate-pulse" />
        <div className="h-10 w-64 bg-card rounded-xl animate-pulse" />
      </div>

      {/* Sort controls */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-card rounded-full animate-pulse" />
        ))}
      </div>

      {/* User table rows */}
      <div className="bg-card rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="h-12 bg-bg-elevated animate-pulse" />
        {/* Data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-bg-elevated animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-bg-elevated rounded animate-pulse" />
              <div className="h-3 w-44 bg-bg-elevated rounded animate-pulse" />
            </div>
            <div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" />
            <div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" />
            <div className="h-4 w-12 bg-bg-elevated rounded animate-pulse" />
            <div className="h-8 w-20 bg-bg-elevated rounded-lg animate-pulse" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <div className="h-9 w-9 bg-card rounded-lg animate-pulse" />
        <div className="h-9 w-24 bg-card rounded-lg animate-pulse" />
        <div className="h-9 w-9 bg-card rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
