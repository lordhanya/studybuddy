import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          return;
        }
        setWorkspaceId(ws[0].id);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading leaderboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Compare progress with your study group members.
          </p>
        </div>
        <Link
          to="/workspaces"
          className="text-sm text-[hsl(var(--muted-foreground))] hover:underline"
        >
          ← Back to workspaces
        </Link>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      {!data || !data.workspace ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No workspaces found.</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Create or join a group and workspace to see the leaderboard.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <CardTitle className="text-base">{data.workspace.name}</CardTitle>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {data.workspace.examType} {data.workspace.examYear} · Sorted by{" "}
                {METRICS.find((m) => m.key === data.metric)?.label || data.metric}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {METRICS.map((m) => (
                <Button
                  key={m.key}
                  variant={metric === m.key ? "default" : "outline"}
                  size="sm"
                  disabled={metricLoading}
                  onClick={() => setMetric(m.key)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className={metricLoading ? "opacity-60 transition-opacity" : ""}>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      <th className="text-left pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">#</th>
                      <th className="text-left pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Member</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Completion</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Topics</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Hours</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Weekly</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Mock Avg</th>
                      <th className="text-right pb-3 text-xs text-[hsl(var(--muted-foreground))] font-medium">Score</th>
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
              {data.members.length === 0 && (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
                  No members with progress yet. Start tracking topics to appear on the leaderboard.
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
