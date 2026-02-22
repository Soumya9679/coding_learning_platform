export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="h-9 w-44 bg-card rounded-lg animate-pulse" />

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 space-y-2">
            <div className="h-4 w-24 bg-bg-elevated rounded animate-pulse" />
            <div className="h-8 w-16 bg-bg-elevated rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-5 space-y-3">
            <div className="h-5 w-36 bg-bg-elevated rounded animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="h-3 w-12 bg-bg-elevated rounded animate-pulse" />
                  <div className="h-5 bg-bg-elevated rounded animate-pulse" style={{ width: `${20 + j * 15}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="bg-card rounded-xl p-5 space-y-3">
        <div className="h-5 w-32 bg-bg-elevated rounded animate-pulse" />
        <div className="h-48 bg-bg-elevated rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
