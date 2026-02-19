"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, Badge, Button } from "@/components/ui";
import { applyAuthHeaders } from "@/lib/session";
import {
  ScrollText,
  RefreshCw,
  Loader2,
  Download,
  User,
  Code2,
  Shield,
  Trash2,
  Pencil,
  Plus,
  Database,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorUid: string;
  targetType?: string;
  targetId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const actionIcons: Record<string, typeof User> = {
  "user.promote": Shield,
  "user.demote": Shield,
  "user.delete": Trash2,
  "user.reset_xp": RefreshCw,
  "user.ban": Shield,
  "user.unban": Shield,
  "challenge.create": Plus,
  "challenge.update": Pencil,
  "challenge.delete": Trash2,
  "challenge.seed": Database,
  "export.users": Download,
  "export.analytics": Download,
};

const actionColors: Record<string, string> = {
  "user.delete": "text-danger",
  "user.ban": "text-danger",
  "challenge.delete": "text-danger",
  "user.promote": "text-success",
  "user.unban": "text-success",
  "challenge.create": "text-success",
  "challenge.seed": "text-accent",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/audit", {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {
      setError("Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    window.open("/api/admin/export?type=audit", "_blank");
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Audit Log</h1>
              <p className="text-xs text-gray-400">Track all admin actions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchLogs}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16">
              <p className="text-sm text-danger mb-3">{error}</p>
              <Button variant="ghost" size="sm" onClick={fetchLogs}>Retry</Button>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No audit log entries yet.</p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[120px_1fr_140px_100px_100px] gap-3 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Time</span>
                <span>Action</span>
                <span>Actor</span>
                <span>Target</span>
                <span>Type</span>
              </div>

              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Code2;
                const color = actionColors[log.action] || "text-gray-400";

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-[120px_1fr_140px_100px_100px] gap-3 items-center px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-xs font-mono text-gray-500">
                      {formatDate(log.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                      <span className={`text-sm font-medium ${color}`}>
                        {log.action}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 truncate" title={log.actorEmail}>
                      {log.actorEmail}
                    </span>
                    <span className="text-xs font-mono text-gray-500 truncate" title={log.targetId}>
                      {log.targetId || "—"}
                    </span>
                    <span>
                      {log.targetType && (
                        <Badge variant={log.targetType === "user" ? "accent" : "neutral"} className="text-[10px]">
                          {log.targetType}
                        </Badge>
                      )}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
