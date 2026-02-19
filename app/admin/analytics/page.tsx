"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { applyAuthHeaders } from "@/lib/session";
import {
  BarChart3,
  Zap,
  Trophy,
  Gamepad2,
  Flame,
  Users,
  TrendingUp,
  Activity,
  Target,
  Calendar,
  Brain,
  Award,
} from "lucide-react";

interface Analytics {
  overview: {
    totalUsers: number;
    totalXp: number;
    avgXp: number;
    maxXp: number;
    maxStreak: number;
    maxChallenges: number;
    usersWithZeroXp: number;
    engagementRate: number;
  };
  xpDistribution: Record<string, number>;
  challengeDistribution: Record<string, number>;
  gameDistribution: Record<string, number>;
  streakDistribution: Record<string, number>;
  activityByDayOfWeek: { day: string; count: number }[];
  signupTrend: { date: string; count: number }[];
  challengeCompletions: { challengeId: string; completions: number }[];
}

function BarChart({ data, color, label }: { data: Record<string, number>; color: string; label: string }) {
  const entries = Object.entries(data);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-16 text-right shrink-0 font-mono">{key}</span>
            <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(val / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`h-full rounded ${color}`}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 font-mono">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / maxVal) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.03 }}
            className={`w-full rounded-t ${color} min-h-[2px]`}
          />
          <span className="text-[9px] text-gray-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/analytics", {
          headers: applyAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        setData(await res.json());
      } catch {
        /* error handled by null data */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400 text-sm">Failed to load analytics.</p>
      </div>
    );
  }

  const o = data.overview;

  const highlights = [
    { label: "Avg XP/User", value: o.avgXp.toLocaleString(), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Top XP", value: o.maxXp.toLocaleString(), icon: Award, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Engagement Rate", value: `${o.engagementRate}%`, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Longest Streak", value: `${o.maxStreak} days`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Max Challenges", value: o.maxChallenges.toString(), icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Zero XP Users", value: o.usersWithZeroXp.toString(), icon: Users, color: "text-gray-400", bg: "bg-white/5 border-white/10" },
  ];

  const handleExport = (type: string) => {
    window.open(`/api/admin/export?type=${type}`, "_blank");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform metrics & distributions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("analytics")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Export Analytics CSV
          </button>
          <button
            onClick={() => handleExport("audit")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
          >
            Export Audit CSV
          </button>
        </div>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {highlights.map((h, i) => (
          <motion.div
            key={h.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-xl p-3 border ${h.bg}`}
          >
            <h.icon className={`w-4 h-4 ${h.color} mb-1`} />
            <p className={`text-lg font-bold ${h.color}`}>{h.value}</p>
            <p className="text-[10px] text-gray-500">{h.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Distribution charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">XP Distribution</h2>
          </div>
          <BarChart data={data.xpDistribution} color="bg-purple-500" label="XP Range → User Count" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Challenge Completion</h2>
          </div>
          <BarChart data={data.challengeDistribution} color="bg-emerald-500" label="Challenges Completed → User Count" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Games Played</h2>
          </div>
          <BarChart data={data.gameDistribution} color="bg-amber-500" label="Games Played → User Count" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">Streak Distribution</h2>
          </div>
          <BarChart data={data.streakDistribution} color="bg-orange-500" label="Streak Days → User Count" />
        </motion.div>
      </div>

      {/* Activity & Signup Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Activity by Day of Week</h2>
          </div>
          <MiniBarChart
            data={data.activityByDayOfWeek.map((d) => ({ label: d.day, value: d.count }))}
            color="bg-cyan-500"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-fuchsia-400" />
            <h2 className="text-sm font-semibold text-white">Signup Trend (Last 30 Days)</h2>
          </div>
          <MiniBarChart
            data={data.signupTrend.map((d) => ({
              label: d.date.slice(5), // "MM-DD"
              value: d.count,
            }))}
            color="bg-fuchsia-500"
          />
        </motion.div>
      </div>

      {/* Per-Challenge Completions */}
      {data.challengeCompletions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#12121e] rounded-xl border border-white/5 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-white">Per-Challenge Completion Count</h2>
            <span className="text-xs text-gray-600 ml-auto">{data.challengeCompletions.length} challenges attempted</span>
          </div>
          <div className="space-y-1.5">
            {data.challengeCompletions.slice(0, 20).map((c) => {
              const maxC = data.challengeCompletions[0]?.completions || 1;
              return (
                <div key={c.challengeId} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-28 truncate text-right shrink-0 font-mono">{c.challengeId}</span>
                  <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.completions / maxC) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-red-500 rounded"
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 font-mono">{c.completions}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
