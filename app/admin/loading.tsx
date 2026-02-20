export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-6xl mx-auto space-y-4">
      <div className="h-10 w-52 bg-card rounded-lg animate-pulse" />
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-card rounded-xl animate-pulse" />
    </div>
  );
}
