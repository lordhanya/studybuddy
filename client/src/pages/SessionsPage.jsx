import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
      console.error(e);
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
      setSessions([session, ...sessions]);
      setForm({ workspaceId: "", duration: "", startedAt: "", endedAt: "" });
      setCreating(false);
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
      setSessions(sessions.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete session");
    }
  };

  if (loading) return <div className="text-[hsl(var(--muted-foreground))]">Loading sessions…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Study Sessions</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Track your study time. Duration is in minutes.
          </p>
        </div>
        <Link to="/workspaces" className="text-sm text-[hsl(var(--muted-foreground))] hover:underline">
          ← Back to workspaces
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Total study hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Total sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold">
              {sessions.length ? Math.round(totalHours / sessions.length * 10) / 10 : 0}h
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Avg per session</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="text-2xl font-bold">
              {workspaces.length}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">Workspaces</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      {/* Create session */}
      <Card>
        <CardHeader>
          <CardTitle>Log a study session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="sessWorkspace">Workspace</Label>
                <select
                  id="sessWorkspace"
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
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
            <Button type="submit" disabled={creating || !form.duration} className="mt-2">
              {creating ? "Logging…" : "Log session"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sessions list */}
      <div className="space-y-4">
        {sessions.length ? (
          sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {s.workspace ? s.workspace.name : "Personal session"}
                  </CardTitle>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(s.startedAt).toLocaleString()}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {s.duration} min
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {Math.round((s.duration / 60) * 10) / 10} hours
                  </span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-10">
              <Clock className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No study sessions yet.</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Log your first session above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
