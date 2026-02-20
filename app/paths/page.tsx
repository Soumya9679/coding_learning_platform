"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, Badge, Button } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import {
  Route,
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Loader2,
  Trophy,
  Flame,
  Lock,
} from "lucide-react";

interface PathChallenge {
  id: string;
  title: string;
  difficulty: number;
  order: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  color: string;
  challenges: PathChallenge[];
  total: number;
  completed: number;
  progress: number;
}

const difficultyLabels: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };
const difficultyColors: Record<number, string> = {
  1: "text-success",
  2: "text-warning",
  3: "text-danger",
};

export default function PathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/paths", {
          credentials: "include",
          headers: applyAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPaths(data.paths || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalChallenges = paths.reduce((s, p) => s + p.total, 0);
  const totalCompleted = paths.reduce((s, p) => s + p.completed, 0);

  return (
    <AuthGuard>
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                <Route className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Learning Paths</h1>
                <p className="text-xs text-muted">Structured challenge sequences by topic</p>
              </div>
            </div>
            {!loading && paths.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  {totalCompleted}/{totalChallenges} completed
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {paths.length} paths
                </span>
              </div>
            )}
          </div>

          {/* Overall Progress */}
          {!loading && totalChallenges > 0 && (
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-hot/5 to-accent/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Overall Progress</span>
                  <span className="text-sm font-bold text-accent">
                    {Math.round((totalCompleted / totalChallenges) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalCompleted / totalChallenges) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-accent to-accent-hot rounded-full"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          )}

          {/* Empty */}
          {!loading && paths.length === 0 && (
            <Card className="text-center py-16">
              <Route className="w-10 h-10 mx-auto mb-3 text-muted opacity-50" />
              <p className="text-sm text-muted">No learning paths available yet.</p>
              <p className="text-xs text-muted mt-1">Challenges need tags to form paths.</p>
            </Card>
          )}

          {/* Paths Grid */}
          {!loading && paths.length > 0 && (
            <div className="space-y-4">
              {paths.map((path, i) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="hover:border-accent/20 transition-colors">
                    {/* Path Header */}
                    <button
                      onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                            {path.name.charAt(0)}
                          </div>
                          <div>
                            <h2 className="text-base font-semibold">{path.name}</h2>
                            <p className="text-xs text-muted mt-0.5">{path.description}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Badge variant="accent" className="text-[10px]">{path.total} challenges</Badge>
                              {path.progress === 100 && (
                                <Badge variant="success" className="text-[10px]">
                                  <Trophy className="w-3 h-3 mr-1" /> Complete!
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold">{path.progress}%</p>
                            <p className="text-[10px] text-muted">{path.completed}/{path.total}</p>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-muted transition-transform ${expandedPath === path.id ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden mt-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${path.progress}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 + 0.2 }}
                          className={`h-full bg-gradient-to-r ${path.color} rounded-full`}
                        />
                      </div>
                    </button>

                    {/* Expanded: Challenge List */}
                    {expandedPath === path.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-border space-y-1"
                      >
                        {path.challenges.map((ch, ci) => {
                          const isCompleted = ci < path.completed;
                          const isCurrent = ci === path.completed;
                          const isLocked = ci > path.completed;

                          return (
                            <div
                              key={ch.id}
                              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                isCurrent ? "bg-accent/5 border border-accent/20" : isLocked ? "opacity-50" : "hover:bg-bg-elevated/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                  ) : isCurrent ? (
                                    <Circle className="w-5 h-5 text-accent" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted" />
                                  )}
                                </div>
                                <div>
                                  <p className={`text-sm font-medium ${isLocked ? "text-muted" : ""}`}>{ch.title}</p>
                                  <span className={`text-xs ${difficultyColors[ch.difficulty] || "text-muted"}`}>
                                    {difficultyLabels[ch.difficulty] || "Unknown"}
                                  </span>
                                </div>
                              </div>
                              {(isCompleted || isCurrent) && (
                                <Link href={`/ide?challenge=${ch.id}`}>
                                  <Button variant="ghost" size="sm" className="text-xs">
                                    {isCompleted ? "Redo" : "Start"}
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </AuthGuard>
  );
}
