"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, Button, CommunitySkeleton, Pagination } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import type { CommunityChallenge } from "@/lib/types";
import {
  Plus,
  Heart,
  Play,
  ChevronDown,
  ChevronUp,
  Users,
  User,
  Sparkles,
  Code2,
  X,
  Loader2,
  Search,
} from "lucide-react";

const TAGS = ["General", "Strings", "Loops", "Math", "Lists", "Recursion", "Sorting", "OOP", "Files", "Data"];
const DIFF_LABELS: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };
const DIFF_COLORS: Record<number, string> = { 1: "text-success", 2: "text-warning", 3: "text-danger" };

export default function CommunityPage() {
  const { user } = useAuthStore();
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"approved" | "mine">("approved");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Builder form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("General");
  const [difficulty, setDifficulty] = useState(1);
  const [starterCode, setStarterCode] = useState('def solution():\n    # Your starter code here\n    pass\n\nprint(solution())');
  const [expectedOutput, setExpectedOutput] = useState("");
  const [criteria, setCriteria] = useState("");
  const [steps, setSteps] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchChallenges = useCallback(async (pageNum = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page: String(pageNum), pageSize: "12" });
      if (tagFilter) params.set("tag", tagFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/community/challenges?${params}`, {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
        setTotalPages(data.totalPages || 1);
        setPage(data.page || 1);
      }
    } catch (e) { console.error("Failed to load community challenges:", e); } finally {
      setLoading(false);
    }
  }, [filter, tagFilter]);

  useEffect(() => {
    fetchChallenges(1, searchQuery);
  }, [fetchChallenges, searchQuery]);

  const handleCreate = async () => {
    setSubmitError("");
    if (!title.trim() || !description.trim() || !starterCode.trim() || !expectedOutput.trim()) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/community/challenges", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({
          title, description, tag, difficulty, starterCode, expectedOutput, criteria,
          steps: steps.filter((s) => s.trim()),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBuilder(false);
        setTitle(""); setDescription(""); setTag("General"); setDifficulty(1);
        setStarterCode('def solution():\n    # Your starter code here\n    pass\n\nprint(solution())');
        setExpectedOutput(""); setCriteria(""); setSteps(["", "", ""]);
        fetchChallenges();
      } else {
        setSubmitError(data.error || "Failed to create");
      }
    } catch {
      setSubmitError("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (challengeId: string) => {
    try {
      await fetch("/api/community/challenges", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ challengeId }),
      });
      fetchChallenges();
    } catch (e) { console.error("Like toggle failed:", e); }
  };

  const playChallenge = (c: CommunityChallenge) => {
    // Store in sessionStorage and redirect to IDE
    sessionStorage.setItem("community_challenge", JSON.stringify(c));
    window.location.href = "/ide?community=" + c.id;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold gradient-text">Community Challenges</h1>
                <p className="text-sm text-muted mt-1">Create and share your own Python challenges</p>
              </div>
              <Button onClick={() => setShowBuilder(!showBuilder)}>
                {showBuilder ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showBuilder ? "Cancel" : "Create Challenge"}
              </Button>
            </div>
          </motion.div>

          {/* Challenge Builder */}
          <AnimatePresence>
            {showBuilder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold">Build Your Challenge</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted mb-1 block">Title *</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        placeholder="e.g., Palindrome Checker"
                        className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm border border-border focus:border-accent/50 outline-none"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-muted mb-1 block">Topic</label>
                        <select
                          value={tag}
                          onChange={(e) => setTag(e.target.value)}
                          className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm border border-border focus:border-accent/50 outline-none"
                        >
                          {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted mb-1 block">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm border border-border focus:border-accent/50 outline-none"
                        >
                          <option value={1}>Easy</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Description *</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                      rows={3}
                      placeholder="Describe the challenge and what the solver needs to build…"
                      className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm border border-border focus:border-accent/50 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Success Criteria</label>
                    <input
                      value={criteria}
                      onChange={(e) => setCriteria(e.target.value)}
                      placeholder="e.g., Function must handle edge cases like empty strings"
                      className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm border border-border focus:border-accent/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Starter Code *</label>
                    <textarea
                      value={starterCode}
                      onChange={(e) => setStarterCode(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-xs font-mono border border-border focus:border-accent/50 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Expected Output *</label>
                    <input
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      placeholder="The expected stdout when the solution runs correctly"
                      className="w-full px-3 py-2 bg-bg-elevated rounded-lg text-sm font-mono border border-border focus:border-accent/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-1 block">Steps (optional)</label>
                    <div className="space-y-2">
                      {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted font-mono w-5">{i + 1}.</span>
                          <input
                            value={step}
                            onChange={(e) => {
                              const next = [...steps];
                              next[i] = e.target.value;
                              setSteps(next);
                            }}
                            placeholder={`Step ${i + 1}`}
                            className="flex-1 px-3 py-1.5 bg-bg-elevated rounded-lg text-xs border border-border focus:border-accent/50 outline-none"
                          />
                        </div>
                      ))}
                      {steps.length < 8 && (
                        <button
                          onClick={() => setSteps([...steps, ""])}
                          className="text-xs text-accent hover:text-accent-light"
                        >
                          + Add step
                        </button>
                      )}
                    </div>
                  </div>

                  {submitError && <p className="text-xs text-danger">{submitError}</p>}

                  <Button onClick={handleCreate} loading={submitting} className="w-full">
                    <Sparkles className="w-4 h-4" />
                    Publish Challenge
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg">
              <button
                onClick={() => setFilter("approved")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  filter === "approved" ? "bg-accent text-white" : "text-muted hover:text-white"
                }`}
              >
                <Users className="w-3 h-3" /> Browse
              </button>
              <button
                onClick={() => setFilter("mine")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  filter === "mine" ? "bg-accent text-white" : "text-muted hover:text-white"
                }`}
              >
                <User className="w-3 h-3" /> My Challenges
              </button>
            </div>

            <div className="relative ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search challenges…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setSearchQuery(searchInput); setPage(1); } }}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-bg-elevated border border-border text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 w-44"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-wrap mb-6">
            <button
              onClick={() => setTagFilter(null)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                tagFilter === null ? "bg-accent text-white" : "text-muted hover:text-white"
              }`}
            >
              All
            </button>
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  tagFilter === t ? "bg-accent/20 text-accent" : "text-muted hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Challenge List */}
          {loading ? (
            <CommunitySkeleton />
          ) : challenges.length === 0 ? (
            <Card className="text-center py-12">
              <Code2 className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">
                {filter === "mine" ? "You haven't created any challenges yet." : "No community challenges yet. Create the first one!"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {challenges.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold">{c.title}</h3>
                          <Badge variant="accent">{c.tag}</Badge>
                          <span className={`text-xs font-medium ${DIFF_COLORS[c.difficulty]}`}>
                            {DIFF_LABELS[c.difficulty]}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1">by {c.authorUsername} · {new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleLike(c.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted hover:text-accent-hot hover:bg-accent-hot/10 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          {c.likes}
                        </button>
                        <Button size="sm" onClick={() => playChallenge(c)}>
                          <Play className="w-3 h-3" />
                          Play
                        </Button>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors"
                    >
                      {expandedId === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expandedId === c.id ? "Less" : "More"}
                    </button>

                    <AnimatePresence>
                      {expandedId === c.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 pt-2 border-t border-border"
                        >
                          <p className="text-xs text-muted-light">{c.description}</p>
                          {c.criteria && (
                            <div className="p-2 bg-bg-elevated rounded-lg text-xs text-muted">
                              <strong>Criteria:</strong> {c.criteria}
                            </div>
                          )}
                          {c.steps.length > 0 && (
                            <ol className="space-y-1">
                              {c.steps.map((s, si) => (
                                <li key={si} className="flex gap-2 text-xs text-muted">
                                  <span className="text-accent font-mono text-[10px]">{si + 1}.</span>
                                  {s}
                                </li>
                              ))}
                            </ol>
                          )}
                          <pre className="p-2 bg-bg-elevated rounded-lg text-xs font-mono text-muted overflow-x-auto">
                            {c.starterCode}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => { setPage(p); fetchChallenges(p, searchQuery); }}
              className="pt-4"
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
