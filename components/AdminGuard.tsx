"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import { ShieldAlert } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { isAuth, isLoading, hydrate } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuth) {
      router.replace("/login");
      return;
    }

    // Check admin role
    (async () => {
      try {
        const res = await fetch("/api/admin/check", {
          headers: applyAuthHeaders(),
          credentials: "include",
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [isAuth, isLoading, router]);

  if (isLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges to access this page.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-accent/20 text-accent-light rounded-xl hover:bg-accent/30 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
