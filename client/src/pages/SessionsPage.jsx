import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Clock, Trash2 } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    workspaceId: "",
    duration: "",
    startedAt: "",
    endedAt: "",
  });
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sess, ws] = await Promise.all([
        api.sessions.list(),
        api.workspaces.list(),
      ]);
      setSessions(Array.isArray(sess) ? sess : []);
      setWorkspaces(Array.isArray(ws) ? ws : []);
    } catch (e) {
      setError(e.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const totalHours = sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const body = {
        workspaceId: form.workspaceId || undefined,
        duration: parseInt(form.duration, 10),
        startedAt: form.startedAt || undefined,
        endedAt: form.endedAt || undefined,
      };
      const session = await api.sessions.create(body);
      setSessions((current) => [session, ...current]);
      setForm({ workspaceId: "", duration: "", startedAt: "", endedAt: "" });
    } catch (err) {
      setError(err.message || "Failed to log session");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    try {
      await api.sessions.remove(id);
      setSessions((current) => current.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete session");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading sessions…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Sessions"
        description="Track your study time. Duration is in minutes."
      />

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total study hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">
              {sessions.length ? Math.round((totalHours / sessions.length) * 10) / 10 : 0}h
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Avg per session</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{workspaces.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Workspaces</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log a study session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="sessWorkspace">Workspace</Label>
                <select
                  id="sessWorkspace"
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  value={form.workspaceId}
                  onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
                >
                  <option value="">Personal (no workspace)</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.examType} {w.examYear})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessDuration">Duration (minutes)</Label>
                <Input
                  id="sessDuration"
                  type="number"
                  required
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessStarted">Started at</Label>
                <Input
                  id="sessStarted"
                  type="datetime-local"
                  value={form.startedAt}
                  onChange={(e) => setForm({ ...form, startedAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessEnded">Ended at</Label>
                <Input
                  id="sessEnded"
                  type="datetime-local"
                  value={form.endedAt}
                  onChange={(e) => setForm({ ...form, endedAt: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={creating || !form.duration} className="mt-2 w-full sm:w-auto">
              {creating ? "Logging…" : "Log session"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {sessions.length ? (
          sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">
                    {s.workspace ? s.workspace.name : "Personal session"}
                  </CardTitle>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(s.startedAt).toLocaleString()}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {s.duration} min
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {Math.round((s.duration / 60) * 10) / 10} hours
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                      aria-label="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              icon={Clock}
              title="No study sessions yet"
              description="Log your first session above."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
