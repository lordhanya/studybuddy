import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Clock, BarChart3, BookOpen } from "lucide-react";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (id) => {
    if (!id) return;
    setError("");
    try {
      const result = await api.analytics.get(id);
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.workspaces
      .list()
      .then((ws) => {
        if (cancelled) return;
        const list = Array.isArray(ws) ? ws : [];
        setWorkspaces(list);
        if (!list.length) {
          setData(null);
          setLoading(false);
          return;
        }
        setWorkspaceId(list[0].id);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Failed to load workspaces");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setData(null);
    loadAnalytics(workspaceId);
  }, [workspaceId, loadAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading analytics…
      </div>
    );
  }

  const subjectProgress = data?.subjectProgress || [];
  const dailyHours = data?.dailyHours || [];
  const mockTrend = data?.mockTrend || [];
  const maxDailyHours = Math.max(1, ...dailyHours.map((d) => d.hours));
  const avgCompletion = subjectProgress.length
    ? Math.round(
        subjectProgress.reduce((acc, s) => acc + s.completionPercentage, 0) /
          subjectProgress.length
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={
          data?.workspace
            ? `Personal progress for ${data.workspace.name}.`
            : "Your personal progress overview."
        }
        actions={
          workspaces.length > 1 ? (
            <select
              aria-label="Select workspace"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full sm:w-auto rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.examType} {w.examYear})
                </option>
              ))}
            </select>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} onRetry={() => loadAnalytics(workspaceId)} />}

      {!data ? (
        workspaces.length === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart3}
              title="No workspaces found"
              description="Create or join a group and workspace to see analytics."
              actions={
                <Button onClick={() => navigate("/workspaces")}>Create a workspace</Button>
              }
            />
          </Card>
        ) : null
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total study hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalStudyHours ?? 0}h</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Subjects tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{subjectProgress.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.mockTestsTaken ?? mockTrend.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg subject completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{avgCompletion}%</div>
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
                  <div className="h-64 min-w-[600px] flex items-end gap-1 px-2 sm:px-0">
                    {dailyHours.map((d, index) => (
                      <div
                        key={d.date}
                        className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1"
                        title={`${d.date}: ${d.hours}h`}
                      >
                        <div
                          className="w-full bg-[hsl(var(--primary))] rounded-t"
                          style={{
                            height: `${Math.max(
                              (d.hours / maxDailyHours) * 90,
                              d.hours > 0 ? 3 : 1
                            )}%`,
                          }}
                        />
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {index % 5 === 0 || index === dailyHours.length - 1
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
                {subjectProgress.length ? (
                  subjectProgress.map((s) => (
                    <div key={s.subjectId} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.subjectName}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">
                          {s.completedTopics}/{s.totalTopics} topics
                        </div>
                      </div>
                      <div className="w-24 shrink-0 flex items-end gap-1">
                        <div className="h-8 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[hsl(var(--primary))]"
                            style={{ width: `${s.completionPercentage}%` }}
                          />
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
              {mockTrend.length ? (
                mockTrend.map((t, index) => (
                  <div key={`${t.title}-${index}`} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(t.date)}
                      </div>
                    </div>
                    <div className="w-32 shrink-0 flex items-end gap-1">
                      <div className="h-16 w-full bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[hsl(var(--primary))]"
                          style={{ width: `${t.percentage}%` }}
                        />
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

// Mock test dates are stored as date-only values at UTC midnight.
function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { timeZone: "UTC" });
}
