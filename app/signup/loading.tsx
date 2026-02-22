export default function SignupLoading() {
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
            <div className="h-7 w-48 bg-bg-elevated rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-bg-elevated rounded animate-pulse" />
          </div>
          {/* Full name */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Email */}
          <div className="space-y-2">
            <div className="h-4 w-16 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Username */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Password */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Confirm password */}
          <div className="space-y-2">
            <div className="h-4 w-36 bg-bg-elevated rounded animate-pulse" />
            <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          </div>
          {/* Password rules */}
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-28 bg-bg-elevated rounded-full animate-pulse" />
            ))}
          </div>
          {/* Button */}
          <div className="h-12 bg-bg-elevated rounded-xl animate-pulse" />
          {/* Link */}
          <div className="flex justify-center">
            <div className="h-4 w-52 bg-bg-elevated rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
