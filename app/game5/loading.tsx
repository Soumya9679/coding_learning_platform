export default function Game5Loading() {
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
          <div className="h-8 w-24 bg-card rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Bug-fix area */}
      <div className="bg-card rounded-2xl p-6 space-y-4">
        <div className="h-6 w-48 bg-bg-elevated rounded animate-pulse" />
        <div className="h-4 w-64 bg-bg-elevated rounded animate-pulse" />
        {/* Code editor skeleton */}
        <div className="bg-bg-elevated rounded-xl p-4 space-y-2 min-h-[200px]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-6 bg-bg rounded animate-pulse" />
              <div className="h-4 bg-bg rounded animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      </div>
      {/* Controls */}
      <div className="flex justify-center gap-3">
        <div className="h-10 w-32 bg-card rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
