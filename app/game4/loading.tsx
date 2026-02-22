export default function Game4Loading() {
  return (
    <div className="min-h-screen bg-bg p-4 max-w-4xl mx-auto space-y-4">
      {/* HUD bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-8 w-32 bg-card rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-card rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-card rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-card rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Game area */}
      <div className="bg-card rounded-2xl p-6 space-y-4">
        <div className="h-6 w-44 bg-bg-elevated rounded animate-pulse" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-24 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      {/* Controls */}
      <div className="flex justify-center gap-3">
        <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
