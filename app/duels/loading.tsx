export default function DuelsLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-4xl mx-auto space-y-4">
      <div className="h-10 w-40 bg-card rounded-lg animate-pulse" />
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-8 w-32 bg-card rounded-lg animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
