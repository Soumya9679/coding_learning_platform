export default function AdminChallengesLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-44 bg-card rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-card rounded-xl animate-pulse" />
          <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Search */}
      <div className="h-10 w-72 bg-card rounded-xl animate-pulse" />

      {/* Challenge list */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-bg-elevated rounded-lg animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-44 bg-bg-elevated rounded animate-pulse" />
                <div className="h-5 w-16 bg-bg-elevated rounded-full animate-pulse" />
                <div className="h-5 w-12 bg-bg-elevated rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-3/4 bg-bg-elevated rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-bg-elevated rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-bg-elevated rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
