"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Code2,
  Gamepad2,
  Trophy,
  LogOut,
  Menu,
  X,
  Terminal,
  Zap,
  ShieldCheck,
  User,
} from "lucide-react";
import { applyAuthHeaders } from "@/lib/session";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { href: "/ide", label: "IDE", icon: Terminal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/gamified", label: "Game Lab", icon: Gamepad2 },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAuth, user, isLoading, hydrate, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuth) { setIsAdmin(false); return; }
    fetch("/api/admin/check", { headers: applyAuthHeaders(), credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setIsAdmin(d?.isAdmin === true))
      .catch(() => setIsAdmin(false));
  }, [isAuth]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg/80 backdrop-blur-xl border-b border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Pulse<span className="gradient-text">Py</span>
            </span>
          </Link>

          {/* Desktop Nav — only visible when authenticated */}
          {isAuth && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-accent-muted text-accent-light"
                        : "text-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                    pathname.startsWith("/admin")
                      ? "bg-red-500/15 text-red-400"
                      : "text-muted hover:text-red-400 hover:bg-red-500/10"
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          )}

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-bg-elevated rounded-lg animate-pulse" />
            ) : isAuth ? (
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/profile"
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-sm font-bold text-white uppercase shadow-glow hover:shadow-glow-lg transition-shadow"
                  title="Profile"
                >
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-danger rounded-lg hover:bg-danger-muted transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-muted-light hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-hot rounded-xl hover:shadow-glow transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-muted hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-card/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {isAuth && navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-accent-muted text-accent-light"
                        : "text-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
              {isAuth && isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    pathname.startsWith("/admin")
                      ? "bg-red-500/15 text-red-400"
                      : "text-muted hover:text-red-400 hover:bg-red-500/10"
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              <div className={cn(isAuth && "pt-3 border-t border-border")}>
                {isAuth ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-sm font-bold text-white uppercase shadow-glow">
                        {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "U"}
                      </div>
                      <span className="text-sm text-muted">{user?.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 w-full text-sm text-danger hover:bg-danger-muted rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="block px-4 py-3 text-sm text-muted-light hover:text-white rounded-xl hover:bg-white/5 transition-all"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-accent to-accent-hot rounded-xl text-center"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
