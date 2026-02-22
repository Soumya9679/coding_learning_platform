export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-bg p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-card rounded-lg animate-pulse" />
        <div className="h-8 w-40 bg-card rounded-lg animate-pulse" />
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-bg-elevated rounded animate-pulse" />
          <div className="h-6 w-40 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
          <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-bg-elevated rounded-xl animate-pulse" />
      </div>

      {/* Delete Account Card */}
      <div className="bg-card rounded-xl p-6 space-y-4 border border-red-500/20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-bg-elevated rounded animate-pulse" />
          <div className="h-6 w-36 bg-bg-elevated rounded animate-pulse" />
        </div>
        <div className="h-4 w-full bg-bg-elevated rounded animate-pulse" />
        <div className="h-11 bg-bg-elevated rounded-xl animate-pulse" />
        <div className="h-10 w-36 bg-bg-elevated rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
