"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, Button, HistorySkeleton, Pagination, EmptyState } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import {
  History,
  Code2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Filter,
} from "lucide-react";

interface Submission {
  id: string;
  challengeId: string;
  code: string;
  stdout: string;
  passed: boolean;
  xpAwarded: number;
  isRepeat: boolean;
  createdAt: string;
}

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterChallenge, setFilterChallenge] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSubmissions = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(pageNum) });
      if (filterChallenge) params.set("challengeId", filterChallenge);

      const res = await fetch(`/api/submissions?${params}`, {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch {
      setError("Could not load submission history.");
    } finally {
      setLoading(false);
    }
  }, [filterChallenge]);

  useEffect(() => {
    fetchSubmissions(1);
  }, [fetchSubmissions]);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get unique challenge IDs for filter
  const challengeIds = [...new Set(submissions.map((s) => s.challengeId))].sort();

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Code History</h1>
                  <p className="text-xs text-muted">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Challenge Filter */}
              {challengeIds.length > 1 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted" />
                  <select
                    value={filterChallenge}
                    onChange={(e) => setFilterChallenge(e.target.value)}
                    className="bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent outline-none"
                  >
                    <option value="">All Challenges</option>
                    {challengeIds.map((id) => (
                      <option key={id} value={id}>Challenge {id}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Content */}
            <Card>
              {loading && <HistorySkeleton />}

              {error && !loading && (
                <div className="text-center py-16">
                  <p className="text-sm text-danger mb-3">{error}</p>
                  <Button variant="ghost" size="sm" onClick={() => fetchSubmissions()}>Retry</Button>
                </div>
              )}

              {!loading && !error && submissions.length === 0 && (
                <EmptyState
                  icon={<Code2 className="w-8 h-8" />}
                  title="No submissions yet"
                  description="Head to the IDE and solve some challenges to see your history here!"
                  action={
                    <a href="/ide" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded-xl hover:opacity-90 transition-opacity">
                      Go to IDE
                    </a>
                  }
                />
              )}

              {!loading && !error && submissions.length > 0 && (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="rounded-xl border border-border overflow-hidden">
                      {/* Submission Header */}
                      <button
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-bg-elevated/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {sub.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                          )}
                          <div className="text-left">
                            <span className="text-sm font-medium">Challenge {sub.challengeId}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-success">+{sub.xpAwarded} XP</span>
                              {sub.isRepeat && <Badge variant="neutral" className="text-[10px]">Repeat</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">{formatDate(sub.createdAt)}</span>
                          {expandedId === sub.id ? (
                            <ChevronUp className="w-4 h-4 text-muted" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Code View */}
                      <AnimatePresence>
                        {expandedId === sub.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              {/* Code Block */}
                              <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-muted font-medium">Your Code</span>
                                  <button
                                    onClick={() => handleCopy(sub.code, sub.id)}
                                    className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
                                  >
                                    {copiedId === sub.id ? (
                                      <><Check className="w-3 h-3" /> Copied!</>
                                    ) : (
                                      <><Copy className="w-3 h-3" /> Copy</>
                                    )}
                                  </button>
                                </div>
                                <pre className="bg-[#0d0d1a] border border-border rounded-lg p-4 text-xs font-mono text-white overflow-x-auto max-h-64 scrollbar-thin">
                                  <code>{sub.code}</code>
                                </pre>
                              </div>

                              {/* Output */}
                              {sub.stdout && (
                                <div>
                                  <span className="text-xs text-muted font-medium block mb-2">Output</span>
                                  <pre className="bg-[#0d0d1a] border border-border rounded-lg p-3 text-xs font-mono text-success/80 overflow-x-auto max-h-32 scrollbar-thin">
                                    {sub.stdout}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => { setPage(p); fetchSubmissions(p); }}
                  className="p-4"
                />
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}
