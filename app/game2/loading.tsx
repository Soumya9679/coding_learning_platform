export default function Game2Loading() {
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
      {/* Puzzle area */}
      <div className="bg-card rounded-2xl p-6 space-y-4">
        <div className="h-6 w-52 bg-bg-elevated rounded animate-pulse" />
        <div className="h-4 w-36 bg-bg-elevated rounded animate-pulse" />
        {/* Code lines to sort */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-bg-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      {/* Expected output */}
      <div className="bg-card rounded-2xl p-6 space-y-3">
        <div className="h-5 w-36 bg-bg-elevated rounded animate-pulse" />
        <div className="h-16 bg-bg-elevated rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
