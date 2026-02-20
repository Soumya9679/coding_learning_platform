export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-10 w-48 bg-card rounded-lg animate-pulse" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-24 bg-card rounded-full animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
