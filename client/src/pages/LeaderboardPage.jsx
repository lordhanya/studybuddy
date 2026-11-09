import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Trophy, Users } from "lucide-react";

const METRICS = [
  { key: "composite", label: "Composite" },
  { key: "completion", label: "Syllabus Completion" },
  { key: "topics", label: "Topics Completed" },
  { key: "hours", label: "Study Hours" },
  { key: "weekly", label: "Weekly Consistency" },
  { key: "mock", label: "Mock Test Avg" },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workspaceId, setWorkspaceId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricLoading, setMetricLoading] = useState(false);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState("composite");

  useEffect(() => {
    let cancelled = false;
    api.workspaces
      .list()
      .then((ws) => {
        if (cancelled) return;
        if (!ws || ws.length === 0) {
          setData({ workspace: null, members: [], metric });
          setLoading(false);
          return;
        }
        setWorkspaceId(ws[0].id);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Failed to load leaderboard");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setMetricLoading(true);
    setError("");
    api.leaderboard
      .get(workspaceId, metric)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setMetricLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, metric]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Compare progress with your study group members."
        backLink="/workspaces"
        backLabel="Back to workspaces"
      />

      {error && <ErrorBanner message={error} />}

      {!data || !data.workspace ? (
        <Card>
          <CardContent className="text-center py-12">
            <EmptyState
              icon={Users}
              title="No workspaces found"
              description="Create or join a group and workspace to see the leaderboard."
              actions={
                <Button onClick={() => navigate("/workspaces")}>Create a workspace</Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{data.workspace.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {data.workspace.examType} {data.workspace.examYear}
              </Badge>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Sorted by{" "}
              {METRICS.find((m) => m.key === data.metric)?.label || data.metric}
            </p>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
              {METRICS.map((m) => (
                <Button
                  key={m.key}
                  variant={metric === m.key ? "default" : "outline"}
                  size="sm"
                  disabled={metricLoading}
                  onClick={() => setMetric(m.key)}
                  className="whitespace-nowrap shrink-0"
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className={metricLoading ? "opacity-60 transition-opacity" : ""}>
            <CardContent className="pt-0">
              {data.members.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No members with progress yet. Start tracking topics to appear on the leaderboard.
                </div>
              ) : typeof window !== "undefined" && window.innerWidth < 768 ? (
                // Mobile: stacked member cards
                data.members.map((m) => (
                  <Card key={m.user.id} className="border-[hsl(var(--border))]">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium">
                              {m.user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{m.user.fullName}</div>
                            <div className="text-xs text-[hsl(var(--muted-foreground))]">
                              {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">#{m.rank}</div>
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            {m.compositeScore} pts
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-4 text-xs">
                        <div>
                          <div className="text-[hsl(var(--muted-foreground))]">Completion</div>
                          <div className="font-medium">{m.completionPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-[hsl(var(--muted-foreground))]">Topics</div>
                          <div className="font-medium">
                            {m.topicsCompleted}/{m.totalTopics}
                          </div>
                        </div>
                        <div>
                          <div className="text-[hsl(var(--muted-foreground))]">Hours</div>
                          <div className="font-medium">{m.studyHours}h</div>
                        </div>
                        <div>
                          <div className="text-[hsl(var(--muted-foreground))]">Mock Avg</div>
                          <div className="font-medium">{m.mockAveragePercentage}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Desktop: table
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="border-b border-[hsl(var(--border))]">
                        <th className="text-left pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-8">#</th>
                        <th className="text-left pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Member</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-20">Completion</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-20">Topics</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-16">Hours</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-16">Weekly</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-20">Mock Avg</th>
                        <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium w-16">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.members.map((m) => (
                        <tr
                          key={m.user.id}
                          className={`border-b border-[hsl(var(--border))] ${
                            m.user.id === user?.id ? "bg-[hsl(var(--secondary))]/30" : ""
                          }`}
                        >
                          <td className="pb-3 text-xs font-medium">{m.rank}</td>
                          <td className="pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-medium">
                                  {m.user.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{m.user.fullName}</div>
                                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                                  {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="pb-3 text-right">
                            <div className="font-medium">{m.completionPercentage}%</div>
                          </td>
                          <td className="pb-3 text-right">{m.topicsCompleted}/{m.totalTopics}</td>
                          <td className="pb-3 text-right">{m.studyHours}h</td>
                          <td className="pb-3 text-right">{m.weeklySessions}</td>
                          <td className="pb-3 text-right">{m.mockAveragePercentage}%</td>
                          <td className="pb-3 text-right font-medium">{m.compositeScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {data.members.length > 0 && typeof window !== "undefined" && window.innerWidth < 768 && (
                <div className="flex items-center justify-between mt-3 border-t border-[hsl(var(--border))] pt-3">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {data.members.length} member{data.members.length === 1 ? "" : "s"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            <Trophy className="inline h-3 w-3 mr-1" />
            Composite score = 40% syllabus completion + 20% study hours (capped) +
            20% weekly consistency + 20% mock test average. Study hours is never used
            as the sole ranking metric.
          </p>
        </>
      )}
    </div>
  );
}
