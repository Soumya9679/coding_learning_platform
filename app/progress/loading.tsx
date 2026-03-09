import { Skeleton } from "@/components/ui";

export default function ProgressLoading() {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
