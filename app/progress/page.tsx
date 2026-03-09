"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, Button, toast } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import type { UserLevel, DailyChallenge, Notification } from "@/lib/types";
import {
  Trophy, Flame, Target, Crown, Star, Zap, Code2, Gamepad2,
  TrendingUp, Calendar, Clock, Award, Loader2, Sun, Shield,
  Sparkles, ChevronRight, CheckCircle2, XCircle, Swords,
  BarChart3, Cpu, Terminal, Braces, Medal, CalendarCheck,
  Infinity as InfinityIcon, Sprout, Leaf, Lock, Play,
} from "lucide-react";

/* ─── Icon Map ───────────────────────────────────────────────────────── */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Code2, Target, Trophy, Crown, Flame, Gamepad2, Star, Sun, Shield,
  Sparkles, Swords, TrendingUp, Calendar, Medal, CalendarCheck, Cpu,
  Terminal, Braces, Sprout, Leaf, Infinity: InfinityIcon,
};

/* ─── Rarity Colors ──────────────────────────────────────────────────── */
const rarityColors: Record<string, string> = {
  common: "border-zinc-500/30 bg-zinc-500/5",
  uncommon: "border-green-500/30 bg-green-500/5",
  rare: "border-blue-500/30 bg-blue-500/5",
  epic: "border-purple-500/30 bg-purple-500/5",
  legendary: "border-amber-400/30 bg-amber-400/5",
};
const rarityText: Record<string, string> = {
  common: "text-zinc-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

/* ─── Types for API response ─────────────────────────────────────────── */
interface AchievementItem {
  id: string; title: string; description: string; icon: string;
  color: string; category: string; rarity: string; unlocked: boolean;
}
interface ProgressData {
  level: UserLevel;
  streakCalendar: Array<{ date: string; active: boolean; xpEarned: number }>;
  xpHistory: Array<{ date: string; xp: number }>;
  xpBreakdown: { challenges: number; games: number; duels: number; daily: number; other: number };
  completionRate: number;
  totalTimeSpent: number;
  bestStreak: number;
  currentStreak: number;
  weeklyXp: number;
  monthlyXp: number;
  recentMilestones: Notification[];
  achievementStats: { total: number; unlocked: number; byRarity: Record<string, { total: number; unlocked: number }> };
  achievements: AchievementItem[];
}

interface DailyData {
  daily: DailyChallenge;
  weekly: DailyChallenge;
}

export default function ProgressPage() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [achFilter, setAchFilter] = useState<string>("all");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, dRes] = await Promise.all([
        fetch("/api/progress", { credentials: "include", headers: applyAuthHeaders() }),
        fetch("/api/daily", { credentials: "include", headers: applyAuthHeaders() }),
      ]);
      if (pRes.ok) setProgress(await pRes.json());
      if (dRes.ok) setDaily(await dRes.json());
    } catch {
      toast.error("Failed to load progress data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredAchievements = useMemo(() => {
    if (!progress) return [];
    if (achFilter === "all") return progress.achievements;
    if (achFilter === "unlocked") return progress.achievements.filter((a) => a.unlocked);
    if (achFilter === "locked") return progress.achievements.filter((a) => !a.unlocked);
    return progress.achievements.filter((a) => a.rarity === achFilter);
  }, [progress, achFilter]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AuthGuard>
    );
  }

  if (!progress) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg pt-24 flex items-center justify-center text-muted">
          Failed to load progress data.
        </div>
      </AuthGuard>
    );
  }

  const { level } = progress;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          {/* ─── Header ───────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold gradient-text mb-2">Your Journey</h1>
            <p className="text-muted">Track your growth, streaks, and achievements</p>
          </motion.div>

          {/* ─── Level Card ───────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-6 bg-gradient-to-br from-bg-card to-bg-elevated border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-hot/20 flex items-center justify-center ${level.color}`}>
                    {(() => { const Icon = iconMap[level.icon] || Star; return <Icon className="w-8 h-8" />; })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">Level {level.level}</span>
                      <Badge variant="accent" className="text-xs">{level.title}</Badge>
                    </div>
                    <p className="text-2xl font-bold mt-1">{progress.level.xpRequired.toLocaleString()} / {progress.level.xpForNext.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted">Weekly XP</p>
                  <p className="text-xl font-bold text-accent">+{progress.weeklyXp.toLocaleString()}</p>
                </div>
              </div>
              <div className="w-full bg-bg rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-hot rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${level.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted mt-2">{level.progress}% to next level</p>
            </Card>
          </motion.div>

          {/* ─── Quick Stats ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Current Streak", value: `${progress.currentStreak}d`, icon: Flame, color: "text-orange-400" },
              { label: "Best Streak", value: `${progress.bestStreak}d`, icon: Trophy, color: "text-amber-400" },
              { label: "Completion Rate", value: `${progress.completionRate}%`, icon: Target, color: "text-green-400" },
              { label: "Monthly XP", value: `+${progress.monthlyXp.toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
            ].map((stat, i) => (
              <Card key={i} className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted">{stat.label}</p>
              </Card>
            ))}
          </motion.div>

          {/* ─── Daily & Weekly Challenge ─────────────────────── */}
          {daily && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-accent" /> Today&apos;s Challenges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChallengeCard challenge={daily.daily} />
                <ChallengeCard challenge={daily.weekly} />
              </div>
            </motion.div>
          )}

          {/* ─── Streak Calendar (GitHub-style) ───────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" /> Activity Calendar
            </h2>
            <Card className="p-4 sm:p-6 overflow-x-auto">
              <StreakCalendar data={progress.streakCalendar} />
            </Card>
          </motion.div>

          {/* ─── XP History Chart ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" /> XP Over Time (30 Days)
            </h2>
            <Card className="p-4 sm:p-6">
              <XpChart data={progress.xpHistory} />
            </Card>
          </motion.div>

          {/* ─── XP Breakdown ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" /> XP Breakdown
            </h2>
            <Card className="p-6">
              <XpBreakdown data={progress.xpBreakdown} />
            </Card>
          </motion.div>

          {/* ─── Achievements ─────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" /> Achievements
                <Badge variant="accent" className="ml-2 text-xs">
                  {progress.achievementStats.unlocked}/{progress.achievementStats.total}
                </Badge>
              </h2>
            </div>
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: "all", label: "All" },
                { key: "unlocked", label: "Unlocked" },
                { key: "locked", label: "Locked" },
                { key: "common", label: "Common" },
                { key: "uncommon", label: "Uncommon" },
                { key: "rare", label: "Rare" },
                { key: "epic", label: "Epic" },
                { key: "legendary", label: "Legendary" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAchFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    achFilter === f.key
                      ? "bg-accent text-white"
                      : "bg-bg-elevated text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredAchievements.map((ach) => (
                  <motion.div
                    key={ach.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AchievementCard achievement={ach} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── Recent Milestones ────────────────────────────── */}
          {progress.recentMilestones.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" /> Recent Milestones
              </h2>
              <div className="space-y-2">
                {progress.recentMilestones.map((m) => {
                  const Icon = iconMap[m.icon || "Star"] || Star;
                  return (
                    <Card key={m.id} className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted truncate">{m.message}</p>
                      </div>
                      <span className="text-[10px] text-muted whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

/* ─── Challenge Card Component ─────────────────────────────────────── */

function ChallengeCard({ challenge }: { challenge: DailyChallenge }) {
  const isDaily = challenge.type === "daily";
  const timeLeft = useMemo(() => {
    const now = new Date();
    const expires = new Date(challenge.expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
  }, [challenge.expiresAt]);

  return (
    <Card className={`p-5 border-l-4 ${isDaily ? "border-l-accent" : "border-l-purple-500"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={isDaily ? "accent" : "info"} className="text-[10px] uppercase">
              {challenge.type}
            </Badge>
            <Badge variant={challenge.difficulty <= 1 ? "success" : challenge.difficulty === 2 ? "warning" : "danger"} className="text-[10px]">
              {challenge.difficulty <= 1 ? "Easy" : challenge.difficulty === 2 ? "Medium" : "Hard"}
            </Badge>
          </div>
          <h3 className="text-base font-bold">{challenge.title}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-accent font-bold">{challenge.xpMultiplier}x XP</p>
          <p className="text-[10px] text-muted">{timeLeft}</p>
        </div>
      </div>
      <p className="text-xs text-muted-light mb-3 line-clamp-2">{challenge.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted">{challenge.completedBy} solved</span>
        {challenge.completed ? (
          <Badge variant="success" className="text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </Badge>
        ) : (
          <Button size="sm" variant="primary" onClick={() => window.location.href = "/ide"} className="text-xs gap-1">
            <Play className="w-3 h-3" /> Solve Now
          </Button>
        )}
      </div>
    </Card>
  );
}

/* ─── Streak Calendar (GitHub-style heatmap) ──────────────────────── */

function StreakCalendar({ data }: { data: Array<{ date: string; active: boolean; xpEarned: number }> }) {
  // Group by weeks (columns) with days (rows)
  const weeks: typeof data[] = [];
  let currentWeek: typeof data = [];

  // Pad the beginning to align to Sunday
  if (data.length > 0) {
    const firstDay = new Date(data[0].date).getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: "", active: false, xpEarned: 0 });
    }
  }

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) weeks.push(currentWeek);

  const monthLabels: string[] = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const validDay = week.find((d) => d.date);
    if (validDay) {
      const m = new Date(validDay.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push(months[m]);
        lastMonth = m;
      } else {
        monthLabels.push("");
      }
    } else {
      monthLabels.push("");
    }
  });

  const getColor = (day: { date: string; active: boolean; xpEarned: number }) => {
    if (!day.active && !day.date) return "bg-transparent";
    if (!day.active) return "bg-white/5";
    if (day.xpEarned >= 200) return "bg-emerald-400";
    if (day.xpEarned >= 100) return "bg-emerald-500";
    if (day.xpEarned >= 50) return "bg-emerald-600";
    return "bg-emerald-700";
  };

  return (
    <div>
      {/* Month labels */}
      <div className="flex gap-[3px] mb-1 ml-8">
        {monthLabels.map((m, i) => (
          <div key={i} className="w-[11px] text-[9px] text-muted text-center">{m}</div>
        ))}
      </div>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
            <div key={i} className="h-[11px] text-[9px] text-muted leading-[11px]">{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[11px] h-[11px] rounded-[2px] ${getColor(day)} transition-colors`}
                  title={day.date ? `${day.date}: ${day.active ? `${day.xpEarned} XP` : "no activity"}` : ""}
                />
              ))}
              {/* Pad remaining days */}
              {Array.from({ length: 7 - week.length }).map((_, i) => (
                <div key={`pad-${i}`} className="w-[11px] h-[11px]" />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted">
        <span>Less</span>
        {["bg-white/5", "bg-emerald-700", "bg-emerald-600", "bg-emerald-500", "bg-emerald-400"].map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ─── XP Bar Chart (last 30 days) ─────────────────────────────────── */

function XpChart({ data }: { data: Array<{ date: string; xp: number }> }) {
  const maxXp = Math.max(...data.map((d) => d.xp), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const height = Math.max(2, (d.xp / maxXp) * 100);
        const day = new Date(d.date).getDate();
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card border border-border rounded-md px-2 py-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {d.date}: {d.xp} XP
            </div>
            <motion.div
              className="w-full bg-gradient-to-t from-accent to-accent-hot rounded-t-sm min-h-[2px]"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
            />
            {(day === 1 || day === 8 || day === 15 || day === 22 || day === 29) && (
              <span className="text-[8px] text-muted mt-1">{day}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── XP Breakdown Donut ──────────────────────────────────────────── */

function XpBreakdown({ data }: { data: { challenges: number; games: number; duels: number; daily: number; other: number } }) {
  const entries = [
    { label: "Challenges", value: data.challenges, color: "bg-emerald-500", icon: Code2 },
    { label: "Games", value: data.games, color: "bg-blue-500", icon: Gamepad2 },
    { label: "Duels", value: data.duels, color: "bg-purple-500", icon: Swords },
    { label: "Daily/Weekly", value: data.daily, color: "bg-amber-500", icon: CalendarCheck },
    { label: "Other", value: data.other, color: "bg-zinc-500", icon: Zap },
  ].filter((e) => e.value > 0);

  const total = entries.reduce((sum, e) => sum + e.value, 0) || 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Bar breakdown */}
      <div className="space-y-3">
        {entries.map((e) => {
          const pct = Math.round((e.value / total) * 100);
          return (
            <div key={e.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-sm">
                  <e.icon className="w-3.5 h-3.5 text-muted" />
                  {e.label}
                </div>
                <span className="text-xs text-muted">{e.value.toLocaleString()} XP ({pct}%)</span>
              </div>
              <div className="w-full bg-bg rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${e.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Total */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold gradient-text">{total.toLocaleString()}</p>
          <p className="text-sm text-muted">Total XP Earned</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Achievement Card ────────────────────────────────────────────── */

function AchievementCard({ achievement }: { achievement: AchievementItem }) {
  const Icon = iconMap[achievement.icon] || Star;
  const isUnlocked = achievement.unlocked;

  return (
    <Card className={`p-4 border transition-all ${
      isUnlocked
        ? `${rarityColors[achievement.rarity] || ""}`
        : "opacity-50 grayscale border-border"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isUnlocked ? "bg-accent/10" : "bg-white/5"
        }`}>
          {isUnlocked ? (
            <Icon className={`w-5 h-5 ${rarityText[achievement.rarity] || "text-accent"}`} />
          ) : (
            <Lock className="w-5 h-5 text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold truncate">{achievement.title}</span>
            <span className={`text-[9px] uppercase font-bold ${rarityText[achievement.rarity] || "text-muted"}`}>
              {achievement.rarity}
            </span>
          </div>
          <p className="text-xs text-muted">{achievement.description}</p>
        </div>
        {isUnlocked && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />}
      </div>
    </Card>
  );
}
