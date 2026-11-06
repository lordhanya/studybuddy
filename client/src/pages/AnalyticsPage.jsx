import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart3, BookOpen } from "lucide-react";

export default function AnalyticsPage() {
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

  if (loading) return <div className="text-[hsl(var(--muted-foreground))]">Loading analytics…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Your personal progress overview.
          </p>
        </div>
        <Link to="/workspaces" className="text-sm text-[hsl(var(--muted-foreground))] hover:underline">
          ← Back to workspaces
        </Link>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      {!data ? (
        <Card>
          <CardContent className="text-center py-10">
            <BarChart3 className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No workspaces found.</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Create or join a group and workspace to see analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total study hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalStudyHours}h</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subjects tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.subjectProgress.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mock tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.mockTrend.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg subject completion</CardTitle>
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

          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily hours chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Study hours (last 30 days)</CardTitle>
                  <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const maxHours = Math.max(
                    1,
                    ...data.dailyHours.map((d) => d.hours)
                  );
                  return (
                    <div className="h-64 flex items-end gap-1">
                      {data.dailyHours.map((d, index) => (
                        <div
                          key={d.date}
                          className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1"
                          title={`${d.date}: ${d.hours}h`}
                        >
                          <div
                            className="w-full bg-[hsl(var(--primary))] rounded-t"
                            style={{
                              height: `${Math.max((d.hours / maxHours) * 90, d.hours > 0 ? 3 : 1)}%`,
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
                  );
                })()}
              </CardContent>
            </Card>

            {/* Subject progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Subject completion</CardTitle>
                  <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.subjectProgress.map((s) => (
                  <div key={s.subjectId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.subjectName}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        {s.completedTopics}/{s.totalTopics} topics
                      </div>
                    </div>
                    <div className="w-24 flex items-end gap-1">
                      <div
                        className="h-8 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-[hsl(var(--primary))]"
                          style={{ width: `${s.completionPercentage}%` }}
                        />
                      </div>
                      <span className="ml-1 text-xs font-medium">
                        {s.completionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Mock test trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mock test performance</CardTitle>
                <BarChart3 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.mockTrend.length ? (
                data.mockTrend.map((t) => (
                  <div key={t.title} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-32 flex items-end gap-1">
                      <div
                        className="h-16 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${t.percentage}%` }}
                        />
                      </div>
                      <span className="ml-1 text-xs font-medium">
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
