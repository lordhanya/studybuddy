import { BookOpen, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthLayout({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[hsl(var(--background))] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="flex items-center justify-between mb-6">
          <BookOpen className="h-5 w-5 text-[hsl(var(--primary))]" />
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
