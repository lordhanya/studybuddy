import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Clock, BarChart3, BookOpen } from "lucide-react";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const ws = await api.workspaces.list();
      if (!ws || ws.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }
      const result = await api.analytics.get(ws[0].id);
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Your personal progress overview."
        backLink="/workspaces"
        backLabel="Back to workspaces"
      />

      {error && <ErrorBanner message={error} />}

      {!data ? (
        <Card>
          <CardContent className="text-center py-12">
            <EmptyState
              icon={BarChart3}
              title="No workspaces found"
              description="Create or join a group and workspace to see analytics."
              actions={
                <Button onClick={() => navigate("/workspaces")}>Create a workspace</Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total study hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalStudyHours}h</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subjects tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.subjectProgress.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.mockTrend.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg subject completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.subjectProgress.length
                    ? Math.round(
                        data.subjectProgress.reduce(
                          (acc, s) => acc + s.completionPercentage,
                          0
                        ) / data.subjectProgress.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {/* Daily hours chart */}
            <Card>
              <CardHeader className="flex items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Study hours (last 30 days)</CardTitle>
                </div>
                <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div
                    className="h-64 min-w-[600px] flex items-end gap-1 px-2 sm:px-0"
                  >
                    {data.dailyHours.map((d, index) => (
                      <div
                        key={d.date}
                        className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1"
                        title={`${d.date}: ${d.hours}h`}
                      >
                        <div
                          className="w-full bg-[hsl(var(--primary))] rounded-t"
                          style={{
                            height: `${Math.max(
                              (d.hours /
                                (Math.max(1, ...data.dailyHours.map((dd) => dd.hours)))) *
                                90,
                              d.hours > 0 ? 3 : 1
                            )}%`,
                          }}
                        />
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {index % 5 === 0 || index === data.dailyHours.length - 1
                            ? d.date.slice(5)
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject progress */}
            <Card>
              <CardHeader className="flex items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Subject completion</CardTitle>
                </div>
                <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </CardHeader>
              <CardContent className="space-y-3">
                {data.subjectProgress.length ? (
                  data.subjectProgress.map((s) => (
                    <div key={s.subjectId} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.subjectName}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {s.completedTopics}/{s.totalTopics} topics
                        </div>
                      </div>
                      <div className="w-24 shrink-0 flex items-end gap-1">
                        <div className="h-8 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div className="h-full bg-[hsl(var(--primary))]" style={{ width: `${s.completionPercentage}%` }} />
                        </div>
                        <span className="ml-1 text-xs font-medium whitespace-nowrap">
                          {s.completionPercentage}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">
                    No subject progress yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mock test trend */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Mock test performance</CardTitle>
              </div>
              <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </CardHeader>
            <CardContent className="space-y-2">
              {data.mockTrend.length ? (
                data.mockTrend.map((t) => (
                  <div key={t.title} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-32 shrink-0 flex items-end gap-1">
                      <div className="h-16 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${t.percentage}%` }} />
                      </div>
                      <span className="ml-1 text-xs font-medium whitespace-nowrap">
                        {t.percentage}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center py-4">
                  No mock test data yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
