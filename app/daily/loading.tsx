import { Skeleton } from "@/components/ui";

export default function DailyLoading() {
  return (
    <div className="min-h-screen bg-bg pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
