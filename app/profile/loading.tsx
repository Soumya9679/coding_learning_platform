export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-card rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-8 w-48 bg-card rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-card rounded animate-pulse" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-card rounded-xl animate-pulse" />
    </div>
  );
}
