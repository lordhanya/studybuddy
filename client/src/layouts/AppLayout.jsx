import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
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

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 1024;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sb-sidebar-collapsed") === "true";
  });

  // Persist desktop collapsed preference.
  useEffect(() => {
    if (!isMobile()) {
      localStorage.setItem("sb-sidebar-collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Reopen sidebar when resizing back to desktop.
  useEffect(() => {
    const handleResize = () => {
      if (!isMobile()) setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer on Escape.
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && sidebarOpen && isMobile()) setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen]);

  // Close mobile drawer on route change; lock body scroll while open.
  useEffect(() => {
    if (isMobile()) setSidebarOpen(false);

    if (sidebarOpen && isMobile()) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [location.pathname, sidebarOpen]);

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const themeIcon = theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  const themeLabel = theme === "dark" ? "Light mode" : "Dark mode";

  const themeToggle = (labelVisible) => (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
      aria-label="Toggle theme"
    >
      {themeIcon}
      {labelVisible && <span className="text-sm">{themeLabel}</span>}
    </button>
  );

  const signOutButton = (labelVisible) => (
    <button
      type="button"
      onClick={logout}
      className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
    >
      <LogOut className="h-4 w-4" />
      {labelVisible && <span className="text-sm">Sign out</span>}
    </button>
  );

  return (
    <div className="flex h-[100dvh] flex-col lg:flex-row overflow-hidden relative">
      {/* Mobile backdrop */}
      {sidebarOpen && isMobile() && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]
          lg:translate-x-0 lg:border-r lg:${sidebarCollapsed ? "w-20" : "w-64"}
        `}
      >
        <div className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span
              className={
                !sidebarCollapsed ? "font-semibold text-sm tracking-tight" : "sr-only"
              }
            >
              StudyBuddy
            </span>
          </Link>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="ml-auto rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors lg:hidden"
              aria-label="Collapse sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {sidebarCollapsed && !isMobile() && (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
              aria-label="Expand sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="space-y-0.5 px-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showLabel = !sidebarCollapsed || isMobile();
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {showLabel && item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-3 border-t border-[hsl(var(--border))]">
          {themeToggle(!sidebarCollapsed && !isMobile())}
          {!isMobile() && signOutButton(!sidebarCollapsed)}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-10 sm:h-14 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/40 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {isMobile() && (
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-sm sm:text-base font-semibold tracking-tight min-w-0 truncate">
              {currentPageTitle(location.pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {themeToggle(false)}
            <div className="flex items-center gap-2 pl-2 border-l border-[hsl(var(--border))]">
              {!isMobile() && (
                <span className="hidden sm:block text-sm text-[hsl(var(--muted-foreground))]">
                  {user?.fullName}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                {!sidebarCollapsed && !isMobile() && "Sign out"}
              </Button>
            </div>
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
  if (path.startsWith("/workspaces/")) return "Syllabus";
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
