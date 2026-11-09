import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "@/services/api";

export interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const data = await api.auth.register({ fullName, email, password });
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Clear the local session even if the request fails.
    } finally {
      setUser(null);
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      // Not signed in, or the API is unavailable during local frontend-only dev.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
