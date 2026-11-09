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

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

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
      {labelVisible && <span>{themeLabel}</span>}
    </button>
  );

  const signOutButton = (labelVisible) => (
    <button
      type="button"
      onClick={logout}
      className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
    >
      <LogOut className="h-4 w-4" />
      {labelVisible && "Sign out"}
    </button>
  );

  return (
    <div className="flex h-[100dvh] flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`lg:flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span className={sidebarOpen ? "font-semibold text-sm tracking-tight" : "sr-only"}>
              StudyBuddy
            </span>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
              aria-label="Collapse sidebar"
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
                  {sidebarOpen && item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-3 border-t border-[hsl(var(--border))]">
          {themeToggle(sidebarOpen)}
          {sidebarOpen && signOutButton(true)}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-12 sm:h-16 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/40 px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                aria-label="Expand sidebar"
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
            <div className="flex items-center gap-3 pl-2 border-l border-[hsl(var(--border))]">
              <span className="hidden sm:block text-sm text-[hsl(var(--muted-foreground))]">
                {user?.fullName}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                {sidebarOpen && "Sign out"}
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
