import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DashboardPage from "@/pages/DashboardPage";
import GroupsPage from "@/pages/GroupsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import WorkspacesPage from "@/pages/WorkspacesPage";
import SyllabusPage from "@/pages/SyllabusPage";
import ActivityPage from "@/pages/ActivityPage";
import GoalsPage from "@/pages/GoalsPage";
import SessionsPage from "@/pages/SessionsPage";
import TestsPage from "@/pages/TestsPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

function FullPageLoader() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[hsl(var(--background))] text-sm text-[hsl(var(--muted-foreground))]">
      Loading…
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            </PublicOnlyRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspaces/:workspaceId/syllabus" element={<SyllabusPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
