import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function resolveTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("sb-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveTheme);

  const root = document.documentElement;

  // Apply theme to DOM and persist preference.
  useEffect(() => {
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    localStorage.setItem("sb-theme", theme);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0b0b0c" : "#ffffff");
    }
  }, [theme]);

  // Follow system preference when the user has not made an explicit choice.
  useEffect(() => {
    const saved = localStorage.getItem("sb-theme");
    if (saved) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setThemeState(e.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
