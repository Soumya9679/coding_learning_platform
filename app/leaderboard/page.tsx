"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Badge, LeaderboardSkeleton, Pagination } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import {
  Trophy,
  Medal,
  Flame,
  Target,
  Crown,
  TrendingUp,
  Star,
  Zap,
  Code2,
  Gamepad2,
  Award,
  RefreshCw,
  Loader2,
  UserPlus,
  UserMinus,
  Users,
  Share2,
  Search,
} from "lucide-react";

interface LeaderboardEntry {
  uid: string;
  rank: number;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
}

const achievements = [
  { icon: Zap, title: "First Run", desc: "Run your first code in the IDE", threshold: (u: LeaderboardEntry | null) => (u?.xp ?? 0) > 0, color: "text-warning" },
  { icon: Target, title: "Sharpshooter", desc: "Complete 5 challenges", threshold: (u: LeaderboardEntry | null) => (u?.challengesCompleted ?? 0) >= 5, color: "text-success" },
  { icon: Flame, title: "On Fire", desc: "Maintain a 7-day streak", threshold: (u: LeaderboardEntry | null) => (u?.streak ?? 0) >= 7, color: "text-accent-hot" },
  { icon: Trophy, title: "Champion", desc: "Complete all 10 challenges", threshold: (u: LeaderboardEntry | null) => (u?.challengesCompleted ?? 0) >= 10, color: "text-warning" },
  { icon: Gamepad2, title: "Gamer", desc: "Play all 3 mini-games", threshold: (u: LeaderboardEntry | null) => (u?.gamesPlayed ?? 0) >= 3, color: "text-accent-light" },
  { icon: Crown, title: "Top 3", desc: "Reach top 3 on leaderboard", threshold: (u: LeaderboardEntry | null) => (u?.rank ?? 99) <= 3, color: "text-warning" },
  { icon: Star, title: "XP Master", desc: "Earn 1000+ XP", threshold: (u: LeaderboardEntry | null) => (u?.xp ?? 0) >= 1000, color: "text-accent" },
  { icon: Code2, title: "Coder", desc: "Complete 3+ challenges", threshold: (u: LeaderboardEntry | null) => (u?.challengesCompleted ?? 0) >= 3, color: "text-success" },
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myStats, setMyStats] = useState<LeaderboardEntry | null>(null);
  const [viewMode, setViewMode] = useState<"all" | "friends">("all");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchLeaderboard = useCallback(async (isRefresh = false, pageNum = 1, search = "") => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const headers = applyAuthHeaders();
      const params = new URLSearchParams({ page: String(pageNum), pageSize: "25" });
      if (search) params.set("search", search);

      const [leaderboardRes, meRes] = await Promise.all([
        fetch(`/api/leaderboard?${params}`, { credentials: "include", headers }),
        fetch("/api/leaderboard/me", { credentials: "include", headers }),
      ]);

      if (!leaderboardRes.ok) throw new Error("Failed to fetch");
      const data = await leaderboardRes.json();
      setEntries(data.entries || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);

      if (meRes.ok) {
        const meData = await meRes.json();
        setMyStats(meData);
      }
    } catch {
      setError("Could not load leaderboard. Try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(false, 1, searchQuery);
    // Auto-refresh every 30 seconds (only if tab is visible)
    const interval = setInterval(() => {
      if (!document.hidden) fetchLeaderboard(true, page, searchQuery);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard, searchQuery]);

  // Fetch following list
  const fetchFollowing = useCallback(async () => {
    try {
      const headers = applyAuthHeaders();
      const res = await fetch("/api/social/follow", { credentials: "include", headers });
      if (res.ok) {
        const data = await res.json();
        setFollowingIds(new Set((data.following || []).map((f: { userId: string }) => f.userId)));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const toggleFollow = async (targetUserId: string) => {
    setFollowLoading(targetUserId);
    try {
      const headers = { "Content-Type": "application/json", ...applyAuthHeaders() };
      const res = await fetch("/api/social/follow", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (data.following) next.add(targetUserId);
          else next.delete(targetUserId);
          return next;
        });
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(null);
    }
  };

  const shareAchievements = () => {
    const text = `I'm ranked #${currentUserRank} on PulsePy with ${currentUserEntry?.xp ?? 0} XP! 🚀`;
    if (navigator.share) {
      navigator.share({ title: "PulsePy Achievements", text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2000);
      }).catch(() => {});
    }
  };

  const currentUserName = user?.fullName || user?.username || "You";
  const currentUserInitial = currentUserName.charAt(0).toUpperCase();

  // Use myStats (from /me endpoint) as primary source, fallback to leaderboard entry
  const currentUserEntry = myStats || entries.find((e) => e.uid === user?.uid) || null;
  const currentUserRank = currentUserEntry?.rank ?? (entries.length + 1);
  const isInLeaderboard = entries.some((e) => e.uid === user?.uid);

  const rankMedals: Record<number, { color: string; bg: string }> = {
    1: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
    2: { color: "text-gray-300", bg: "bg-gray-300/10 border-gray-300/30" },
    3: { color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/30" },
  };

  const unlockedCount = achievements.filter((a) => a.threshold(currentUserEntry)).length;

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Your Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-hot/5 to-accent/5 pointer-events-none" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-xl font-bold text-white shadow-glow">
                    {currentUserInitial}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{currentUserName}</h2>
                    <p className="text-sm text-muted">
                      Rank #{currentUserRank} · {currentUserEntry?.xp ?? 0} XP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Target className="w-4 h-4 text-accent-light" />
                      <span className="text-xl font-bold">{currentUserEntry?.challengesCompleted ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">Challenges</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Flame className="w-4 h-4 text-accent-hot" />
                      <span className="text-xl font-bold">{currentUserEntry?.streak ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">Day Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-success" />
                      <span className="text-xl font-bold">{currentUserEntry?.gamesPlayed ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">Games Played</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-warning" />
                      <span className="text-xl font-bold">{currentUserEntry?.xp ?? 0}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">Total XP</p>
                  </div>
                  <button
                    onClick={shareAchievements}
                    className="relative p-2 rounded-lg text-muted hover:text-accent hover:bg-accent-muted transition-colors"
                    title="Share achievements"
                  >
                    <Share2 className="w-4 h-4" />
                    {shareToast && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] bg-bg-elevated text-accent whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Rankings Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="space-y-5">
                {/* Header with Search + Refresh */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Medal className="w-5 h-5 text-accent" />
                      Rankings
                    </h2>
                    <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg ml-3">
                      <button
                        onClick={() => setViewMode("all")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          viewMode === "all" ? "bg-accent text-white" : "text-muted hover:text-white"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setViewMode("friends")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                          viewMode === "friends" ? "bg-accent text-white" : "text-muted hover:text-white"
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        Friends
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                      <input
                        type="text"
                        placeholder="Search users…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setPage(1); } }}
                        className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-bg-elevated border border-border text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 w-40"
                      />
                    </div>
                    <button
                      onClick={() => fetchLeaderboard(true, page, searchQuery)}
                      disabled={refreshing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-white bg-bg-elevated hover:bg-bg-elevated/80 transition-colors disabled:opacity-50"
                    >
                      {refreshing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loading && <LeaderboardSkeleton />}

                {/* Error State */}
                {error && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <p className="text-sm text-danger">{error}</p>
                    <button
                      onClick={() => fetchLeaderboard(false, page, searchQuery)}
                      className="px-4 py-2 rounded-lg text-sm bg-accent text-white hover:bg-accent/80 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && entries.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Trophy className="w-10 h-10 text-muted" />
                    <p className="text-sm text-muted">No rankings yet. Be the first to earn XP!</p>
                  </div>
                )}

                {/* Table */}
                {!loading && !error && entries.length > 0 && (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_1fr_80px_80px_80px_48px] gap-2 px-4 py-2 text-xs font-medium text-muted uppercase tracking-wider">
                      <span>Rank</span>
                      <span>Coder</span>
                      <span className="text-center">XP</span>
                      <span className="text-center">Solved</span>
                      <span className="text-center">Streak</span>
                      <span></span>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1.5">
                      {(viewMode === "friends"
                        ? entries.filter((e) => followingIds.has(e.uid) || e.uid === user?.uid)
                        : entries
                      ).map((entry, i) => {
                        const medal = rankMedals[entry.rank];
                        const isTopThree = entry.rank <= 3;
                        const isCurrentUser = entry.uid === user?.uid;

                        return (
                          <motion.div
                            key={entry.uid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className={`grid grid-cols-[60px_1fr_80px_80px_80px_48px] gap-2 items-center px-4 py-3 rounded-xl transition-colors ${
                              isCurrentUser
                                ? "bg-accent-muted/30 border border-accent/20"
                                : isTopThree
                                ? "bg-bg-elevated/80 border border-border"
                                : "hover:bg-bg-elevated/50"
                            }`}
                          >
                            {/* Rank */}
                            <div className="flex items-center justify-center">
                              {isTopThree ? (
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${medal?.bg}`}>
                                  <span className={`text-sm font-bold ${medal?.color}`}>{entry.rank}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-mono text-muted">{entry.rank}</span>
                              )}
                            </div>

                            {/* Name */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                                  isTopThree
                                    ? "bg-gradient-to-br from-accent to-accent-hot"
                                    : "bg-bg-elevated"
                                }`}
                              >
                                {entry.avatar}
                              </div>
                              <span
                                className={`text-sm font-medium ${
                                  isCurrentUser
                                    ? "text-accent-light"
                                    : isTopThree
                                    ? "text-white"
                                    : "text-muted-light"
                                }`}
                              >
                                {entry.name}
                                {isCurrentUser && " (You)"}
                              </span>
                            </div>

                            {/* XP */}
                            <div className="text-center">
                              <span className="text-sm font-mono font-semibold">
                                {entry.xp.toLocaleString()}
                              </span>
                            </div>

                            {/* Challenges */}
                            <div className="text-center">
                              <span className="text-sm font-mono text-muted">
                                {entry.challengesCompleted}/10
                              </span>
                            </div>

                            {/* Streak */}
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="w-3 h-3 text-accent-hot" />
                              <span className="text-sm font-mono">{entry.streak}d</span>
                            </div>

                            {/* Follow */}
                            <div className="flex items-center justify-center">
                              {!isCurrentUser && (
                                <button
                                  onClick={() => toggleFollow(entry.uid)}
                                  disabled={followLoading === entry.uid}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    followingIds.has(entry.uid)
                                      ? "text-accent hover:text-danger hover:bg-danger-muted"
                                      : "text-muted hover:text-accent hover:bg-accent-muted"
                                  }`}
                                  title={followingIds.has(entry.uid) ? "Unfollow" : "Follow"}
                                >
                                  {followingIds.has(entry.uid) ? (
                                    <UserMinus className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserPlus className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={(p) => { setPage(p); fetchLeaderboard(false, p, searchQuery); }}
                        className="pt-4"
                      />
                    )}

                    {/* Current User (if not in top entries) */}
                    {!isInLeaderboard && user && (
                      <div className="pt-4 border-t border-border">
                        <div className="grid grid-cols-[60px_1fr_80px_80px_80px_48px] gap-2 items-center px-4 py-3 rounded-xl bg-accent-muted/30 border border-accent/20">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-mono text-accent-light">#{currentUserRank}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-xs font-bold text-white">
                              {currentUserInitial}
                            </div>
                            <span className="text-sm font-medium text-accent-light">
                              {currentUserName} (You)
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-mono font-semibold">{(currentUserEntry?.xp ?? 0).toLocaleString()}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-mono text-muted">{currentUserEntry?.challengesCompleted ?? 0}/10</span>
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            <Flame className="w-3 h-3 text-accent-hot" />
                            <span className="text-sm font-mono">{currentUserEntry?.streak ?? 0}d</span>
                          </div>
                          <div></div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </motion.div>

            {/* Right Sidebar - Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Achievements */}
              <Card className="space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold">Achievements</h2>
                  <Badge variant="accent" className="ml-auto">
                    {unlockedCount}/{achievements.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {achievements.map((achievement, i) => {
                    const Icon = achievement.icon;
                    const unlocked = achievement.threshold(currentUserEntry);
                    return (
                      <motion.div
                        key={achievement.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * i + 0.3 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          unlocked
                            ? "bg-bg-elevated/60 border-border hover:border-accent/20"
                            : "bg-bg-elevated/20 border-border/50 opacity-50"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          unlocked ? "bg-accent-muted" : "bg-bg-elevated"
                        }`}>
                          <Icon className={`w-4 h-4 ${unlocked ? achievement.color : "text-muted"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${unlocked ? "" : "text-muted"}`}>
                            {achievement.title}
                          </p>
                          <p className="text-xs text-muted truncate">{achievement.desc}</p>
                        </div>
                        {unlocked && (
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 ml-auto" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </Card>

              {/* XP Breakdown */}
              <Card className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  How to Earn XP
                </h3>
                <div className="space-y-3">
                  {[
                    { action: "Complete a challenge", xp: "+100 XP", icon: Target },
                    { action: "First try success", xp: "+150 XP", icon: Star },
                    { action: "Play a mini-game", xp: "+50 XP", icon: Gamepad2 },
                    { action: "Perfect game score", xp: "+100 XP", icon: Crown },
                    { action: "Daily login streak", xp: "+25 XP", icon: Flame },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.action} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted" />
                          <span className="text-muted">{item.action}</span>
                        </div>
                        <span className="font-mono text-success text-xs">{item.xp}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}
