export default function AuditLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-5xl mx-auto space-y-4">
      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-32 bg-card rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-card rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-card rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Audit log entries */}
      <div className="space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-bg-elevated animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 bg-bg-elevated rounded animate-pulse" />
                <div className="h-4 w-20 bg-bg-elevated rounded-full animate-pulse" />
              </div>
              <div className="h-3 w-48 bg-bg-elevated rounded animate-pulse" />
              <div className="h-3 w-32 bg-bg-elevated rounded animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-bg-elevated rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
