export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-10 w-48 bg-card rounded-lg animate-pulse" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
