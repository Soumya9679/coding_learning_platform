export default function Game1Loading() {
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
      {/* Game area */}
      <div className="bg-card rounded-2xl p-8 space-y-6">
        <div className="h-6 w-48 bg-bg-elevated rounded animate-pulse" />
        <div className="bg-bg-elevated rounded-xl p-6 space-y-3 min-h-[200px]">
          <div className="h-5 w-full bg-bg rounded animate-pulse" />
          <div className="h-5 w-4/5 bg-bg rounded animate-pulse" />
          <div className="h-5 w-3/5 bg-bg rounded animate-pulse" />
        </div>
        <div className="h-4 w-64 bg-bg-elevated rounded animate-pulse" />
      </div>
      {/* Controls */}
      <div className="flex justify-center gap-3">
        <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
        <div className="h-10 w-28 bg-card rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
