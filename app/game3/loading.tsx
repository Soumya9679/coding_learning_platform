export default function Game3Loading() {
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
      {/* Question card */}
      <div className="bg-card rounded-2xl p-8 space-y-6">
        <div className="h-6 w-56 bg-bg-elevated rounded animate-pulse" />
        {/* Code block */}
        <div className="bg-bg-elevated rounded-xl p-5 space-y-2 min-h-[120px]">
          <div className="h-4 w-full bg-bg rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-bg rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-bg rounded animate-pulse" />
        </div>
        {/* Answer options */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
