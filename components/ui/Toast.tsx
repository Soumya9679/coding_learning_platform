"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Toast types ─── */
export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: ToastType, duration?: number) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type, duration }] }));
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Shorthand helper — call from anywhere: toast.success("Done!") */
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().add(msg, "success", duration),
  error: (msg: string, duration?: number) => useToastStore.getState().add(msg, "error", duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().add(msg, "warning", duration),
  info: (msg: string, duration?: number) => useToastStore.getState().add(msg, "info", duration),
};

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "border-success/40 bg-success/10 text-success",
  error: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-accent/40 bg-accent/10 text-accent-light",
};

function ToastItem({ t }: { t: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const Icon = icons[t.type];

  useEffect(() => {
    if (!t.duration) return;
    const timer = setTimeout(() => remove(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, remove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg shadow-lg max-w-sm w-full pointer-events-auto",
        styles[t.type]
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium flex-1 text-white">{t.message}</p>
      <button
        onClick={() => remove(t.id)}
        className="text-muted hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

/** Mount once in root layout to render toasts globally. */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
