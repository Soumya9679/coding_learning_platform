export default function GamifiedLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <div className="h-10 w-64 mx-auto bg-card rounded-lg animate-pulse" />
        <div className="h-5 w-80 mx-auto bg-card rounded animate-pulse" />
      </div>

      {/* Game cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-6 space-y-4">
            {/* Icon + badge */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-bg-elevated animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-bg-elevated animate-pulse" />
            </div>
            {/* Title */}
            <div className="h-6 w-36 bg-bg-elevated rounded animate-pulse" />
            {/* Tagline */}
            <div className="h-4 w-28 bg-bg-elevated rounded animate-pulse" />
            {/* Description */}
            <div className="space-y-2">
              <div className="h-3 w-full bg-bg-elevated rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-bg-elevated rounded animate-pulse" />
              <div className="h-3 w-4/6 bg-bg-elevated rounded animate-pulse" />
            </div>
            {/* Pills */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-6 w-24 bg-bg-elevated rounded-full animate-pulse" />
              ))}
            </div>
            {/* Features */}
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-bg-elevated rounded animate-pulse" />
                  <div className="h-3 w-40 bg-bg-elevated rounded animate-pulse" />
                </div>
              ))}
            </div>
            {/* Play button */}
            <div className="h-10 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
