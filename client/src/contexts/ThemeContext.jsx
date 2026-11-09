import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "sb-theme";

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function getSavedTheme() {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

function resolveTheme() {
  if (typeof window === "undefined") return "light";
  const saved = getSavedTheme();
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(resolveTheme);
  // Tracks whether the user explicitly picked a theme. When they have not,
  // the app follows the operating system preference.
  const hasExplicitChoice = useRef(getSavedTheme() !== null);

  // Apply theme to the DOM and keep browser chrome in sync.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#0b0b0c" : "#ffffff");
    }
  }, [theme]);

  // Follow system preference until the user makes an explicit choice.
  useEffect(() => {
    if (hasExplicitChoice.current) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => {
      if (!hasExplicitChoice.current) {
        setThemeState(event.matches ? "dark" : "light");
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((next) => {
    if (next !== "dark" && next !== "light") return;
    hasExplicitChoice.current = true;
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      hasExplicitChoice.current = true;
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
