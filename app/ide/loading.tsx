export default function IDELoading() {
  return (
    <div className="min-h-screen bg-bg p-4 flex gap-4">
      {/* Sidebar skeleton */}
      <div className="w-80 shrink-0 space-y-3">
        <div className="h-8 bg-card rounded-lg animate-pulse" />
        <div className="h-32 bg-card rounded-xl animate-pulse" />
        <div className="h-24 bg-card rounded-xl animate-pulse" />
        <div className="h-24 bg-card rounded-xl animate-pulse" />
      </div>
      {/* Editor skeleton */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="h-10 bg-card rounded-lg animate-pulse" />
        <div className="flex-1 bg-card rounded-xl animate-pulse min-h-[400px]" />
        <div className="h-32 bg-card rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
