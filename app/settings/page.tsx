"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, Button, Input } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import {
  Settings,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ action: "change_password", currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to change password.");
      } else {
        setPwSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account.");
      } else {
        logout();
        router.replace("/login");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/profile")}
                className="w-9 h-9 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-muted hover:text-white hover:border-accent/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Settings</h1>
                  <p className="text-xs text-muted">Manage your account</p>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <KeyRound className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold">Change Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password"
                    type={showCurrentPw ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-9 text-muted hover:text-white transition-colors"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-9 text-muted hover:text-white transition-colors"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {newPassword && (
                  <div className="space-y-1">
                    <p className={`text-xs flex items-center gap-1 ${newPassword.length >= 8 ? "text-success" : "text-muted"}`}>
                      {newPassword.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      At least 8 characters
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${/[0-9]/.test(newPassword) ? "text-success" : "text-muted"}`}>
                      {/[0-9]/.test(newPassword) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Contains a number
                    </p>
                    <p className={`text-xs flex items-center gap-1 ${newPassword === confirmPassword && confirmPassword ? "text-success" : "text-muted"}`}>
                      {newPassword === confirmPassword && confirmPassword ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      Passwords match
                    </p>
                  </div>
                )}

                {pwError && (
                  <p className="text-sm text-danger flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> {pwError}
                  </p>
                )}
                {pwSuccess && (
                  <p className="text-sm text-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {pwSuccess}
                  </p>
                )}

                <Button type="submit" loading={pwLoading} className="w-full">
                  Update Password
                </Button>
              </form>
            </Card>

            {/* Danger Zone */}
            <Card className="border-danger/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <h2 className="text-lg font-semibold text-danger">Danger Zone</h2>
              </div>
              <p className="text-sm text-muted mb-6">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!deleteConfirm ? (
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                  <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl">
                    <p className="text-sm text-danger font-medium mb-3">
                      Are you absolutely sure? Enter your password to confirm.
                    </p>
                    <Input
                      label="Password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>

                  {deleteError && (
                    <p className="text-sm text-danger flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> {deleteError}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => { setDeleteConfirm(false); setDeletePassword(""); setDeleteError(""); }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      loading={deleteLoading}
                      onClick={handleDeleteAccount}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Permanently Delete
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}
