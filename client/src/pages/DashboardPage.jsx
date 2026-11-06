import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    return <div className="text-[hsl(var(--muted-foreground))]">Loading…</div>;
  }

  const cards = [
    { label: "Syllabus completion", value: `${stats.completion}%`, icon: List },
    { label: "Topics completed", value: stats.topicsCompleted, icon: Activity },
    { label: "Study hours", value: stats.studyHours, icon: Clock },
    { label: "Weekly sessions", value: stats.weeklySessions, icon: Target },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Dashboard</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Welcome back, {user?.fullName}. Here's your progress at a glance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{card.label}</div>
                    <div className="mt-2 text-2xl font-bold">{card.value}</div>
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

      <div className="grid gap-6 md:grid-cols-12">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate("/activity")}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {stats.recentActivities.length ? (
                  stats.recentActivities.map((activity) => {
                    const Icon = ACTIVITY_ICONS[activity.type] || Activity;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 py-3 border-b border-[hsl(var(--input))] last:border-b-0"
                      >
                        <div className="w-8 h-8 rounded bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
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
                  <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                    No recent activity yet. Start by joining a group and tracking topics.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Button className="w-full justify-start gap-2" onClick={() => navigate("/groups")}>
                <UsersIcon className="h-4 w-4" /> Join or create a group
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/workspaces")}
              >
                <List className="h-4 w-4" /> Track a topic
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate("/sessions")}
              >
                <Clock className="h-4 w-4" /> Log a study session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
