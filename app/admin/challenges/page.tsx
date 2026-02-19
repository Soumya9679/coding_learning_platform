"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { applyAuthHeaders } from "@/lib/session";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Database,
  Code2,
  GripVertical,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  Check,
} from "lucide-react";

interface Challenge {
  id: string;
  tag: string;
  difficulty: number;
  title: string;
  description: string;
  criteria: string;
  mentorInstructions: string;
  rubric: string;
  steps: string[];
  starterCode: string;
  expectedOutput: string;
  retryHelp: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const EMPTY_CHALLENGE: Omit<Challenge, "id"> = {
  tag: "",
  difficulty: 1,
  title: "",
  description: "",
  criteria: "",
  mentorInstructions: "",
  rubric: "",
  steps: [""],
  starterCode: "",
  expectedOutput: "",
  retryHelp: "",
  order: 999,
  active: true,
};

const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Easy", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/20" },
  2: { label: "Medium", color: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
  3: { label: "Hard", color: "text-red-400 bg-red-500/15 border-red-500/20" },
};

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingChallenge, setEditingChallenge] = useState<(Challenge & { isNew?: boolean }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/challenges", {
        headers: applyAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch {
      showToast("Failed to load challenges", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/challenges/seed", {
        method: "POST",
        headers: applyAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      showToast(data.message || `Seeded ${data.count} challenges`, "success");
      await fetchChallenges();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Seed failed", "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async () => {
    if (!editingChallenge) return;
    if (!editingChallenge.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    setSaving(true);
    try {
      const isNew = editingChallenge.isNew;
      const url = isNew
        ? "/api/admin/challenges"
        : `/api/admin/challenges/${editingChallenge.id}`;
      const method = isNew ? "POST" : "PATCH";

      const { isNew: _removed, ...payload } = editingChallenge;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      showToast(isNew ? "Challenge created!" : "Challenge updated!", "success");
      setEditingChallenge(null);
      await fetchChallenges();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
        headers: applyAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      showToast("Challenge deleted", "success");
      setDeleteConfirm(null);
      await fetchChallenges();
    } catch {
      showToast("Failed to delete challenge", "error");
    }
  };

  const handleToggleActive = async (ch: Challenge) => {
    try {
      const res = await fetch(`/api/admin/challenges/${ch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ active: !ch.active }),
      });
      if (!res.ok) throw new Error();
      showToast(`Challenge ${ch.active ? "disabled" : "enabled"}`, "success");
      await fetchChallenges();
    } catch {
      showToast("Failed to toggle challenge", "error");
    }
  };

  const filtered = challenges.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tag.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${
              toast.type === "success"
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/15 text-red-400 border-red-500/20"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Challenges</h1>
          <p className="text-sm text-gray-500 mt-1">{challenges.length} challenges in the platform</p>
        </div>
        <div className="flex items-center gap-2">
          {challenges.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {seeding ? "Seeding..." : "Seed Default Challenges"}
            </button>
          )}
          <button
            onClick={() =>
              setEditingChallenge({
                ...EMPTY_CHALLENGE,
                id: `ch_${Date.now()}`,
                order: challenges.length + 1,
                isNew: true,
              } as Challenge & { isNew: boolean })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition"
          >
            <Plus className="w-4 h-4" />
            Add Challenge
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search by title, tag, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#12121e] border border-white/5 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/30"
        />
      </div>

      {/* Challenge list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            {challenges.length === 0
              ? 'No challenges yet. Click "Seed Default Challenges" to load the built-in 20, or "Add Challenge" to create one.'
              : "No challenges match your search."}
          </div>
        ) : (
          filtered.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`bg-[#12121e] rounded-xl border p-4 flex items-center gap-4 group transition ${
                ch.active ? "border-white/5" : "border-white/5 opacity-50"
              }`}
            >
              {/* Order */}
              <div className="w-8 text-center">
                <span className="text-xs font-mono text-gray-600">#{ch.order}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white truncate">{ch.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${difficultyLabels[ch.difficulty]?.color || ""}`}>
                    {difficultyLabels[ch.difficulty]?.label || "?"}
                  </span>
                  {ch.tag && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                      {ch.tag}
                    </span>
                  )}
                  {!ch.active && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-500 border border-gray-500/20">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{ch.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button
                  onClick={() => handleToggleActive(ch)}
                  className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition"
                  title={ch.active ? "Hide from IDE" : "Show in IDE"}
                >
                  {ch.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setEditingChallenge(ch)}
                  className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(ch.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#12121e] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Delete Challenge</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Are you sure you want to permanently delete challenge{" "}
                <span className="text-white font-medium">
                  {challenges.find((c) => c.id === deleteConfirm)?.title || deleteConfirm}
                </span>
                ?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor modal */}
      <AnimatePresence>
        {editingChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-auto"
            onClick={() => setEditingChallenge(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-3xl my-8 overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {editingChallenge.isNew ? "New Challenge" : `Edit: ${editingChallenge.title}`}
                  </h2>
                </div>
                <button
                  onClick={() => setEditingChallenge(null)}
                  className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-auto">
                {/* Row 1: ID, Tag, Difficulty, Order, Active */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Field
                    label="ID"
                    value={editingChallenge.id}
                    onChange={(v) => setEditingChallenge({ ...editingChallenge, id: v })}
                    disabled={!editingChallenge.isNew}
                    placeholder="ch_1"
                  />
                  <Field
                    label="Tag"
                    value={editingChallenge.tag}
                    onChange={(v) => setEditingChallenge({ ...editingChallenge, tag: v })}
                    placeholder="Cipher"
                  />
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide block mb-1.5">Difficulty</label>
                    <select
                      value={editingChallenge.difficulty}
                      onChange={(e) => setEditingChallenge({ ...editingChallenge, difficulty: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#12121e] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/30"
                    >
                      <option value={1}>Easy</option>
                      <option value={2}>Medium</option>
                      <option value={3}>Hard</option>
                    </select>
                  </div>
                  <Field
                    label="Order"
                    value={String(editingChallenge.order)}
                    onChange={(v) => setEditingChallenge({ ...editingChallenge, order: Number(v) || 0 })}
                    placeholder="1"
                    type="number"
                  />
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide block mb-1.5">Active</label>
                    <button
                      onClick={() => setEditingChallenge({ ...editingChallenge, active: !editingChallenge.active })}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        editingChallenge.active
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/15 text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {editingChallenge.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {editingChallenge.active ? "Visible" : "Hidden"}
                    </button>
                  </div>
                </div>

                {/* Title */}
                <Field
                  label="Title *"
                  value={editingChallenge.title}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, title: v })}
                  placeholder="Caesar Cipher"
                />

                {/* Description */}
                <FieldArea
                  label="Description"
                  value={editingChallenge.description}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, description: v })}
                  placeholder="Brief description of the challenge..."
                  rows={2}
                />

                {/* Criteria */}
                <FieldArea
                  label="Success Criteria"
                  value={editingChallenge.criteria}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, criteria: v })}
                  placeholder="What the function should return..."
                  rows={2}
                />

                {/* Steps */}
                <div>
                  <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide block mb-1.5">Steps</label>
                  {editingChallenge.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                      <input
                        value={step}
                        onChange={(e) => {
                          const newSteps = [...editingChallenge.steps];
                          newSteps[i] = e.target.value;
                          setEditingChallenge({ ...editingChallenge, steps: newSteps });
                        }}
                        className="flex-1 px-3 py-1.5 bg-[#12121e] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/30"
                        placeholder={`Step ${i + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newSteps = editingChallenge.steps.filter((_, j) => j !== i);
                          setEditingChallenge({ ...editingChallenge, steps: newSteps.length ? newSteps : [""] });
                        }}
                        className="p-1 text-gray-600 hover:text-red-400 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingChallenge({ ...editingChallenge, steps: [...editingChallenge.steps, ""] })}
                    className="text-xs text-red-400 hover:text-red-300 mt-1 transition"
                  >
                    + Add step
                  </button>
                </div>

                {/* Starter Code */}
                <FieldArea
                  label="Starter Code"
                  value={editingChallenge.starterCode}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, starterCode: v })}
                  placeholder="def my_function():\n    pass"
                  rows={6}
                  mono
                />

                {/* Expected Output */}
                <Field
                  label="Expected Output"
                  value={editingChallenge.expectedOutput}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, expectedOutput: v })}
                  placeholder="khoor"
                />

                {/* Retry Help */}
                <FieldArea
                  label="Retry Help (shown on failure)"
                  value={editingChallenge.retryHelp}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, retryHelp: v })}
                  placeholder="Hint for students who are stuck..."
                  rows={2}
                />

                {/* Mentor Instructions */}
                <FieldArea
                  label="Mentor Instructions (for AI)"
                  value={editingChallenge.mentorInstructions}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, mentorInstructions: v })}
                  placeholder="Instructions for the AI mentor..."
                  rows={2}
                />

                {/* Rubric */}
                <FieldArea
                  label="Rubric (for grading)"
                  value={editingChallenge.rubric}
                  onChange={(v) => setEditingChallenge({ ...editingChallenge, rubric: v })}
                  placeholder="Grading criteria..."
                  rows={2}
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/5">
                <button
                  onClick={() => setEditingChallenge(null)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : editingChallenge.isNew ? "Create" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Reusable field components ---

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-[#12121e] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function FieldArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wide block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 bg-[#12121e] border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500/30 resize-y ${
          mono ? "font-mono text-xs" : ""
        }`}
      />
    </div>
  );
}
