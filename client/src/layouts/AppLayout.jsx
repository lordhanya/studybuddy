import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  { href: "/sessions", label: "Sessions", icon: Clock },
  { href: "/tests", label: "Mock Tests", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem("sb-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);
    setDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("sb-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const isActive = (href) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-screen flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`lg:flex-shrink-0 border-r border-[hsl(var(--input))] bg-[hsl(var(--card))] transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[hsl(var(--input))]">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
            <span className={sidebarOpen ? "font-semibold text-lg" : "sr-only"}>
              StudyBuddy
            </span>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
              aria-label="Collapse sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="space-y-1 px-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  className={`
                    flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      active
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
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
        <div className="p-3 border-t border-[hsl(var(--input))]">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className={sidebarOpen ? "" : "sr-only"}>
              {dark ? "Light mode" : "Dark mode"}
            </span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[hsl(var(--input))] bg-[hsl(var(--background))]/50 backdrop-blur px-6">
          <div className="flex items-center gap-4">
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
            <h1 className="text-sm font-semibold">{currentPageTitle(location.pathname)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-[hsl(var(--input))]">
              <span className="text-sm text-[hsl(var(--muted-foreground))] hidden sm:block">
                {user?.fullName}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                {sidebarOpen && "Sign out"}
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
