"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
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
  BarChart3,
  User,
  Swords,
  Users,
  History,
  Map,
  Settings,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/ui";

const navLinks = [
  { href: "/ide", label: "IDE", icon: Terminal },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/gamified", label: "Game Lab", icon: Gamepad2 },
  { href: "/duels", label: "Duels", icon: Swords },
  { href: "/community", label: "Community", icon: Users },
];

const userMenuLinks = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/history", label: "History", icon: History },
  { href: "/paths", label: "Paths", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAuth, user, isLoading, hydrate, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <LazyMotion features={domAnimation}>
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
                    aria-current={isActive ? "page" : undefined}
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
            </div>
          )}

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isLoading ? (
              <div className="w-20 h-8 bg-bg-elevated rounded-lg animate-pulse" />
            ) : isAuth ? (
              <div ref={userMenuRef} className="relative flex items-center gap-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <UserAvatar email={user?.email} name={user?.fullName || user?.username} size="sm" className="rounded-full" />
                  <span className="text-sm text-muted-light font-medium hidden lg:inline">{user?.username}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {/* User dropdown menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <m.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-card overflow-hidden z-50"
                      role="menu"
                      aria-label="User menu"
                    >
                      <div className="px-3 py-2 border-b border-border">
                        <p className="text-sm font-semibold truncate">{user?.fullName || user?.username}</p>
                        <p className="text-xs text-muted truncate">{user?.email}</p>
                      </div>
                      {userMenuLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            role="menuitem"
                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
                          >
                            <Icon className="w-4 h-4" />
                            {link.label}
                          </Link>
                        );
                      })}
                      <div className="border-t border-border">
                        <button
                          onClick={handleLogout}
                          role="menuitem"
                          className="flex items-center gap-2.5 px-3 py-2.5 w-full text-sm text-danger hover:bg-danger-muted transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-card/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {isAuth && (
                <>
                  {navLinks.map((link) => {
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
                  <div className="border-t border-border my-2" />
                  {userMenuLinks.map((link) => {
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
                </>
              )}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-muted">Theme</span>
                <ThemeToggle />
              </div>
              <div className={cn(isAuth && "pt-3 border-t border-border")}>
                {isAuth ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <UserAvatar email={user?.email} name={user?.fullName || user?.username} size="sm" className="rounded-full" />
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
          </m.div>
        )}
      </AnimatePresence>
    </nav>
    </LazyMotion>
  );
}
