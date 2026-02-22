export default function LoginLoading() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-card rounded-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-bg-elevated animate-pulse" />
          </div>
          {/* Title + subtitle */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="h-7 w-40 bg-bg-elevated rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-bg-elevated rounded animate-pulse" />
          </div>
          {/* Username field */}
          <div className="space-y-2">
            <div className="h-4 w-28 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Password field */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Button */}
          <div className="h-12 bg-bg-elevated rounded-xl animate-pulse" />
          {/* Links */}
          <div className="space-y-2 flex flex-col items-center">
            <div className="h-4 w-36 bg-bg-elevated rounded animate-pulse" />
            <div className="h-4 w-48 bg-bg-elevated rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
