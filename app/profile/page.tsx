"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, Badge, Button, UserAvatar, toast } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import {
  Trophy,
  Flame,
  Target,
  Crown,
  Star,
  Zap,
  Code2,
  Gamepad2,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Pencil,
  Save,
  X,
  Loader2,
  User,
  Settings,
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

interface Submission {
  id: string;
  challengeId: string;
  passed: boolean;
  xpAwarded: number;
  isRepeat: boolean;
  createdAt: string;
}

interface ProfileData {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  xp: number;
  rank: number;
  challengesCompleted: number;
  completedChallenges: string[];
  gamesPlayed: number;
  streak: number;
  lastActiveDate: string;
  createdAt: string;
  recentSubmissions: Submission[];
  achievements: Achievement[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Code2,
  Target,
  Trophy,
  Crown,
  Flame,
  Gamepad2,
  Star,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/profile", {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data);
      setEditName(data.fullName);
    } catch {
      setError("Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim().length < 2) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ fullName: editName.trim() }),
      });
      if (res.ok) {
        setProfile((p) => (p ? { ...p, fullName: editName.trim() } : p));
        setEditing(false);
        toast.success("Name updated!");
      } else {
        toast.error("Failed to save name");
      }
    } catch {
      toast.error("Failed to save name");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const initial = (profile?.fullName || user?.fullName || "U").charAt(0).toUpperCase();

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {loading && (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-32">
              <p className="text-danger mb-4">{error}</p>
              <Button onClick={fetchProfile}>Retry</Button>
            </div>
          )}

          {profile && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Profile Header */}
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-hot/5 to-accent/5 pointer-events-none" />
                <div className="relative flex flex-wrap items-start justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <UserAvatar
                      email={profile.email}
                      name={profile.fullName}
                      size="xl"
                      className="shadow-glow"
                    />
                    <div>
                      {editing ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-lg font-semibold focus:border-accent outline-none w-48"
                            autoFocus
                          />
                          <button onClick={handleSaveName} disabled={saving} className="text-success hover:text-success/80" aria-label="Save name">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditing(false); setEditName(profile.fullName); }} className="text-muted hover:text-white" aria-label="Cancel editing">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                          <button onClick={() => setEditing(true)} className="text-muted hover:text-accent transition-colors" aria-label="Edit name">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-muted">@{profile.username} · {profile.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="accent">Rank #{profile.rank}</Badge>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {formatDate(profile.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/settings")}>
                      <Settings className="w-4 h-4 mr-1.5" />
                      Settings
                    </Button>
                  </div>

                  {/* Stats Grid */}
                  <div className="flex items-center gap-6 flex-wrap justify-center basis-full mt-2">
                    {[
                      { icon: TrendingUp, value: profile.xp.toLocaleString(), label: "Total XP", color: "text-warning" },
                      { icon: Target, value: profile.challengesCompleted, label: "Challenges", color: "text-accent-light" },
                      { icon: Gamepad2, value: profile.gamesPlayed, label: "Games", color: "text-success" },
                      { icon: Flame, value: `${profile.streak}d`, label: "Streak", color: "text-accent-hot" },
                    ].map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-xl font-bold">{stat.value}</span>
                          </div>
                          <p className="text-xs text-muted mt-0.5">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className="grid lg:grid-cols-[1fr_340px] gap-8">
                {/* Recent Submissions */}
                <Card className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    Recent Submissions
                  </h2>

                  {profile.recentSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                      <Code2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No submissions yet. Head to the IDE!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {profile.recentSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            {sub.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-danger" />
                            )}
                            <div>
                              <span className="text-sm font-medium">Challenge {sub.challengeId}</span>
                              {sub.isRepeat && (
                                <Badge variant="neutral" className="ml-2 text-[10px]">
                                  Repeat
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted">
                            <span className="font-mono text-success">+{sub.xpAwarded} XP</span>
                            <span>{formatDate(sub.createdAt)} {formatTime(sub.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Achievements */}
                <div className="space-y-6">
                  <Card className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-accent" />
                      <h2 className="text-lg font-semibold">Achievements</h2>
                      <Badge variant="accent" className="ml-auto">
                        {profile.achievements.filter((a) => a.unlocked).length}/{profile.achievements.length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {profile.achievements.map((achievement) => {
                        const Icon = iconMap[achievement.icon] || Star;
                        return (
                          <div
                            key={achievement.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              achievement.unlocked
                                ? "bg-bg-elevated/60 border-border"
                                : "bg-bg-elevated/20 border-border/50 opacity-40"
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              achievement.unlocked ? "bg-accent-muted" : "bg-bg-elevated"
                            }`}>
                              <Icon className={`w-4 h-4 ${achievement.unlocked ? `text-${achievement.color}` : "text-muted"}`} />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${achievement.unlocked ? "" : "text-muted"}`}>
                                {achievement.title}
                              </p>
                              <p className="text-xs text-muted truncate">{achievement.description}</p>
                            </div>
                            {achievement.unlocked && (
                              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Completed Challenges List */}
                  <Card className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      Completed Challenges
                    </h3>
                    {profile.completedChallenges.length === 0 ? (
                      <p className="text-xs text-muted">None yet — start solving!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile.completedChallenges.map((id) => (
                          <Badge key={id} variant="accent" className="text-xs">
                            #{id}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
