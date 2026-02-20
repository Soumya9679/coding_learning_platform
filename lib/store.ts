import { create } from "zustand";

interface User {
  uid: string;
  username: string;
  fullName: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuth: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  isAdmin: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuth: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("pulsepy_session_token");
    }
    set({ user: null, isAuth: false, isAdmin: false, isLoading: false });
  },

  hydrate: async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("pulsepy_session_token")
          : null;

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/auth/session", {
        credentials: "include",
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuth: true, isLoading: false });

        // Check admin status in parallel (non-blocking)
        fetch("/api/admin/check", { credentials: "include", headers })
          .then((r) => r.json())
          .then((d) => { if (d.isAdmin) set({ isAdmin: true }); })
          .catch(() => {});
      } else {
        set({ user: null, isAuth: false, isAdmin: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuth: false, isAdmin: false, isLoading: false });
    }
  },
}));
