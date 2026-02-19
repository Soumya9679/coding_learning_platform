"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { applyAuthHeaders } from "@/lib/session";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck,
  ShieldOff,
  RotateCcw,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Zap,
  Trophy,
  Gamepad2,
  Flame,
  Mail,
  Calendar,
  Crown,
  Ban,
} from "lucide-react";

interface UserEntry {
  uid: string;
  fullName: string;
  email: string;
  username: string;
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
  role: string;
  lastActiveDate: string;
  createdAt: string;
}

type SortField = "xp" | "challengesCompleted" | "gamesPlayed" | "streak" | "createdAt" | "username";

interface ModalState {
  type: "promote" | "demote" | "reset" | "delete" | null;
  user: UserEntry | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("xp");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: null, user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, sortBy, order, page: page.toString(), limit: "15",
      });
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: applyAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setToast({ msg: "Failed to load users.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, sortBy, order, page]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setOrder("desc");
    }
    setPage(1);
  };

  const handleAction = async () => {
    if (!modal.user || !modal.type) return;
    setActionLoading(true);
    try {
      const uid = modal.user.uid;
      if (modal.type === "delete") {
        const res = await fetch(`/api/admin/users/${uid}`, {
          method: "DELETE",
          headers: applyAuthHeaders(),
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        showToast(`User @${modal.user.username} deleted.`);
      } else {
        const body: Record<string, unknown> = {};
        if (modal.type === "promote") body.role = "admin";
        if (modal.type === "demote") body.role = "user";
        if (modal.type === "reset") body.resetXp = true;
        const res = await fetch(`/api/admin/users/${uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const labels = { promote: "promoted to admin", demote: "demoted to user", reset: "XP reset" };
        showToast(`@${modal.user.username} ${labels[modal.type]}.`);
      }
      setModal({ type: null, user: null });
      fetchUsers();
    } catch {
      showToast("Action failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-medium ${
        sortBy === field ? "text-red-400" : "text-gray-500 hover:text-gray-300"
      } transition`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">{total} total user{total !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => window.open("/api/admin/export?type=users", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all self-start"
          >
            Export CSV
          </button>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, username..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/20 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#12121e] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-xs font-medium text-gray-500">User</th>
                <th className="px-4 py-3"><SortHeader field="xp" label="XP" /></th>
                <th className="px-4 py-3 hidden md:table-cell"><SortHeader field="challengesCompleted" label="Challenges" /></th>
                <th className="px-4 py-3 hidden md:table-cell"><SortHeader field="gamesPlayed" label="Games" /></th>
                <th className="px-4 py-3 hidden lg:table-cell"><SortHeader field="streak" label="Streak" /></th>
                <th className="px-4 py-3 hidden lg:table-cell text-xs font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 hidden xl:table-cell"><SortHeader field="createdAt" label="Joined" /></th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={8}>
                      <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-4 py-12 text-center text-gray-600 text-sm" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                          {u.fullName?.charAt(0) || u.username?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{u.fullName}</p>
                          <p className="text-xs text-gray-500 truncate">@{u.username} · {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-purple-400">{u.xp.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-emerald-400">{u.challengesCompleted}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-amber-400">{u.gamesPlayed}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-orange-400">{u.streak}🔥</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => setModal({ type: "promote", user: u })}
                            title="Promote to admin"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setModal({ type: "demote", user: u })}
                            title="Demote to user"
                            className="p-1.5 rounded-lg text-red-400 hover:text-gray-400 hover:bg-white/5 transition"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setModal({ type: "reset", user: u })}
                          title="Reset XP & progress"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", user: u })}
                          title="Delete user"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {modal.type && modal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !actionLoading && setModal({ type: null, user: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#16162a] rounded-2xl border border-white/10 p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  modal.type === "delete" ? "bg-red-500/15" :
                  modal.type === "reset" ? "bg-amber-500/15" :
                  modal.type === "promote" ? "bg-red-500/15" :
                  "bg-blue-500/15"
                }`}>
                  {modal.type === "delete" && <Trash2 className="w-5 h-5 text-red-400" />}
                  {modal.type === "reset" && <RotateCcw className="w-5 h-5 text-amber-400" />}
                  {modal.type === "promote" && <ShieldCheck className="w-5 h-5 text-red-400" />}
                  {modal.type === "demote" && <ShieldOff className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {modal.type === "delete" && "Delete User"}
                    {modal.type === "reset" && "Reset Progress"}
                    {modal.type === "promote" && "Promote to Admin"}
                    {modal.type === "demote" && "Remove Admin"}
                  </h3>
                  <p className="text-xs text-gray-500">@{modal.user.username}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {modal.type === "delete" && "This will permanently delete this user and all their data. This cannot be undone."}
                {modal.type === "reset" && "This will reset XP, challenges completed, games played, and streak to zero."}
                {modal.type === "promote" && "This user will gain full admin access to the admin panel."}
                {modal.type === "demote" && "This user will lose admin privileges."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ type: null, user: null })}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                    modal.type === "delete"
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      : modal.type === "reset"
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  }`}
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-[110] px-4 py-3 rounded-xl border flex items-center gap-2 text-sm ${
              toast.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/15 border-red-500/20 text-red-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
