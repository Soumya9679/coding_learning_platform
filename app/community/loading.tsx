export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-10 w-56 bg-card rounded-lg animate-pulse" />
        <div className="h-10 w-36 bg-card rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 bg-card rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
