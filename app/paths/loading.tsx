export default function PathsLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-5xl mx-auto space-y-6">
      <div className="h-10 w-52 bg-card rounded-lg animate-pulse" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
