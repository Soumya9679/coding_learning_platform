"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { applyAuthHeaders } from "@/lib/session";
import {
  Users,
  Zap,
  Trophy,
  Gamepad2,
  Activity,
  Flame,
  ShieldCheck,
  TrendingUp,
  Crown,
  Clock,
  UserPlus,
  Star,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalXp: number;
  totalChallengesCompleted: number;
  totalGamesPlayed: number;
  activeToday: number;
  activeLast7Days: number;
  adminsCount: number;
  recentSignups: {
    uid: string;
    username: string;
    fullName: string;
    email: string;
    xp: number;
    createdAt: string;
  }[];
  topUsers: {
    uid: string;
    username: string;
    fullName: string;
    xp: number;
    challengesCompleted: number;
    gamesPlayed: number;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: applyAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setStats(data);
      } catch {
        setError("Failed to load dashboard stats.");
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

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400">{error || "Failed to load."}</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Total XP Earned", value: stats.totalXp.toLocaleString(), icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Challenges Done", value: stats.totalChallengesCompleted, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Games Played", value: stats.totalGamesPlayed, icon: Gamepad2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Active Today", value: stats.activeToday, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Active (7 days)", value: stats.activeLast7Days, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Admins", value: stats.adminsCount, icon: ShieldCheck, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    { label: "Avg XP/User", value: stats.totalUsers > 0 ? Math.round(stats.totalXp / stats.totalUsers) : 0, icon: TrendingUp, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-4 border ${kpi.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#12121e] rounded-xl border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Top Performers</h2>
          </div>
          <div className="divide-y divide-white/5">
            {stats.topUsers.map((u, i) => (
              <div key={u.uid} className="px-4 py-3 flex items-center gap-3">
                <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-500"}`}>
                  #{i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-xs font-bold text-white uppercase">
                  {u.fullName?.charAt(0) || u.username?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.fullName || u.username}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-purple-400">{u.xp.toLocaleString()} XP</p>
                  <p className="text-xs text-gray-600">{u.challengesCompleted} challenges · {u.gamesPlayed} games</p>
                </div>
              </div>
            ))}
            {stats.topUsers.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">No users yet</div>
            )}
          </div>
        </motion.div>

        {/* Recent Signups */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#12121e] rounded-xl border border-white/5 overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Recent Signups</h2>
          </div>
          <div className="divide-y divide-white/5">
            {stats.recentSignups.map((u) => {
              let timeAgo = "";
              if (u.createdAt) {
                const diff = Date.now() - new Date(u.createdAt).getTime();
                const days = Math.floor(diff / 86400000);
                if (days === 0) timeAgo = "today";
                else if (days === 1) timeAgo = "yesterday";
                else if (days < 30) timeAgo = `${days}d ago`;
                else timeAgo = `${Math.floor(days / 30)}mo ago`;
              }
              return (
                <div key={u.uid} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 uppercase">
                    {u.fullName?.charAt(0) || u.username?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{u.fullName || u.username}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                    <p className="text-xs text-purple-400">{u.xp} XP</p>
                  </div>
                </div>
              );
            })}
            {stats.recentSignups.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-600 text-sm">No signups yet</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
