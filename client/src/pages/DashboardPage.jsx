import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import {
  Activity,
  BookOpen,
  Clock,
  Flame,
  List,
  MessageCircle,
  RefreshCw,
  Share2,
  Target,
  Users as UsersIcon,
} from "lucide-react";

const ACTIVITY_ICONS = {
  TOPIC_COMPLETED: BookOpen,
  CHAPTER_COMPLETED: BookOpen,
  STUDY_SESSION: Flame,
  MOCK_TEST: Share2,
  DAILY_UPDATE: MessageCircle,
  GOAL_ACHIEVED: Target,
  MEMBER_JOINED: UsersIcon,
};

const EMPTY_STATS = {
  completion: 0,
  topicsCompleted: 0,
  studyHours: 0,
  weeklySessions: 0,
  recentActivities: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const data = await api.get("/api/dashboard/stats");
      setStats({ ...EMPTY_STATS, ...data });
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
    );
  }

  const cards = [
    { label: "Syllabus completion", value: `${stats.completion}%`, icon: List },
    { label: "Topics completed", value: stats.topicsCompleted, icon: Activity },
    { label: "Study hours", value: stats.studyHours, icon: Clock },
    { label: "Weekly sessions", value: stats.weeklySessions, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName || "there"}. Here's your progress at a glance.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadDashboard} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      {card.label}
                    </div>
                    <div className="mt-1 text-2xl font-bold">{card.value}</div>
                  </div>
                  <div className="rounded-md p-2 bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/activity")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-0">
                {stats.recentActivities.length ? (
                  stats.recentActivities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || Activity;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 py-3 border-b border-[hsl(var(--border))] last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.content}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {activity.user?.fullName} ·{" "}
                            {new Date(activity.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="No recent activity yet"
                    description="Start by joining a group and tracking topics."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Button className="w-full justify-start gap-2" onClick={() => navigate("/groups")}>
                <UsersIcon className="h-4 w-4 shrink-0" /> Join or create a group
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/workspaces")}
              >
                <List className="h-4 w-4 shrink-0" /> Track a topic
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/sessions")}
              >
                <Clock className="h-4 w-4 shrink-0" /> Log a study session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
