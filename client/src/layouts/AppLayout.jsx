import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  Sun,
  Moon,
  BookOpen,
  Activity,
  Target,
  Clock,
  BarChart3,
  Trophy,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/workspaces", label: "Workspaces", icon: BookOpen },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/sessions", label: "Study Sessions", icon: Clock },
  { href: "/tests", label: "Mock Tests", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const handler = (event) => setIsDesktop(event.matches);
    media.addEventListener("change", handler);
    setIsDesktop(media.matches);
    return () => media.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isDesktop = useIsDesktop();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sb-sidebar-collapsed") === "true";
  });

  // Persist desktop collapsed preference.
  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem("sb-sidebar-collapsed", String(collapsed));
    }
  }, [collapsed, isDesktop]);

  // Close the mobile drawer when returning to desktop.
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  // Close mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileOpen && !isDesktop) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, isDesktop]);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const themeIcon = theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";
  const showLabels = !collapsed || !isDesktop;

  const navLinkClass = (active, showLabel) =>
    `flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
      showLabel ? "gap-3 px-3" : "justify-center px-0"
    } ${
      active
        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
    }`;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
      {/* Mobile backdrop */}
      {mobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-200
          ${collapsed ? "lg:w-20" : "lg:w-64"}
        `}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[hsl(var(--border))] px-4">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <BookOpen className="h-5 w-5 shrink-0 text-[hsl(var(--primary))]" />
            {showLabels && (
              <span className="truncate text-sm font-semibold tracking-tight">StudyBuddy</span>
            )}
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="hidden rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-0.5 px-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={!showLabels ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={navLinkClass(active, showLabels)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showLabels && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 space-y-1 border-t border-[hsl(var(--border))] p-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex w-full items-center rounded-lg py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors ${
              showLabels ? "gap-2.5 px-3" : "justify-center px-0"
            }`}
            aria-label={`Switch to ${themeLabel.toLowerCase()}`}
            title={themeLabel}
          >
            {themeIcon}
            {showLabels && <span>{themeLabel}</span>}
          </button>
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center rounded-lg py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors ${
              showLabels ? "gap-2.5 px-3" : "justify-center px-0"
            }`}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabels && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight sm:text-base">
              {currentPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors lg:hidden"
              aria-label={`Switch to ${themeLabel.toLowerCase()}`}
            >
              {themeIcon}
            </button>
            <span className="hidden max-w-[12rem] truncate text-sm text-[hsl(var(--muted-foreground))] sm:block">
              {user?.fullName}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function currentPageTitle(path) {
  if (/^\/workspaces\/[^/]+\/syllabus$/.test(path)) return "Syllabus";
  const map = {
    "/dashboard": "Dashboard",
    "/groups": "Groups",
    "/workspaces": "Workspaces",
    "/activity": "Activity",
    "/goals": "Goals",
    "/sessions": "Study Sessions",
    "/tests": "Mock Tests",
    "/leaderboard": "Leaderboard",
    "/analytics": "Analytics",
  };
  return map[path] || "StudyBuddy";
}
