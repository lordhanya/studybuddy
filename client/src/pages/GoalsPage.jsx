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
import { Target, Trash2, Users, Share2 } from "lucide-react";

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "outline" },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    workspaceId: "",
    groupId: "",
    title: "",
    description: "",
    targetDate: "",
    status: "ACTIVE",
    visibility: "PERSONAL",
    progress: 0,
  });
  const [shareToGroup, setShareToGroup] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gs, ws, grps] = await Promise.all([
        api.goals.list({ scope: "personal" }),
        api.workspaces.list(),
        api.groups.list(),
      ]);
      setGoals(Array.isArray(gs) ? gs : []);
      setWorkspaces(Array.isArray(ws) ? ws : []);
      setGroups(Array.isArray(grps) ? grps : []);
    } catch (e) {
      setError(e.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const body = {
        title: form.title,
        description: form.description || undefined,
        targetDate: form.targetDate || undefined,
        status: form.status,
        visibility: shareToGroup ? "GROUP" : "PERSONAL",
        progress: form.progress || 0,
      };
      if (form.workspaceId) body.workspaceId = form.workspaceId;
      if (shareToGroup && form.groupId) body.groupId = form.groupId;
      const goal = await api.goals.create(body);
      setGoals((current) => [goal, ...current]);
      setForm({
        workspaceId: "",
        groupId: "",
        title: "",
        description: "",
        targetDate: "",
        status: "ACTIVE",
        visibility: "PERSONAL",
        progress: 0,
      });
      setShareToGroup(false);
    } catch (err) {
      setError(err.message || "Failed to create goal");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await api.goals.update(id, { status });
      setGoals((gs) => gs.map((g) => (g.id === id ? updated : g)));
    } catch (err) {
      setError(err.message || "Failed to update goal");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await api.goals.remove(id);
      setGoals((gs) => gs.filter((g) => g.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete goal");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading goals…
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");
  const completionRate = goals.length ? Math.round((completedGoals.length / goals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Goals"
        description="Set personal study targets and track your progress over time."
      />

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{goals.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Goals completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Active goals</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Create a new goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="goalTitle">Goal title</Label>
                <Input
                  id="goalTitle"
                  required
                  placeholder="e.g. Complete Engineering Mathematics"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="goalDesc">Description</Label>
                <Input
                  id="goalDesc"
                  placeholder="What do you want to achieve?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalWorkspace">Workspace</Label>
                <select
                  id="goalWorkspace"
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  value={form.workspaceId}
                  onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
                >
                  <option value="">None (personal goal)</option>
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.examType} {w.examYear})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalTarget">Target date</Label>
                <Input
                  id="goalTarget"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalProgress">Progress (%)</Label>
                <Input
                  id="goalProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({ ...form, progress: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalStatus">Status</Label>
                <select
                  id="goalStatus"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    id="goalShare"
                    type="checkbox"
                    checked={shareToGroup}
                    onChange={(e) => setShareToGroup(e.target.checked)}
                    className="rounded bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--ring))] focus:ring-[hsl(var(--ring))]"
                  />
                  <Label htmlFor="goalShare" className="text-sm cursor-pointer">
                    Share to group <Share2 className="h-3.5 w-3.5 ml-1" />
                  </Label>
                </div>
                {shareToGroup && (
                  <div className="space-y-2">
                    <Label htmlFor="goalGroup">Share with</Label>
                    <select
                      id="goalGroup"
                      value={form.groupId}
                      onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                      className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    >
                      <option value="">Select a group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Group members will see this goal and its progress.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" disabled={creating || !form.title.trim()} className="mt-2 w-full sm:w-auto">
              {creating ? "Creating…" : "Create goal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.length ? (
          goals.map((goal) => {
            const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.ACTIVE;
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    {goal.description && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={cfg.variant} className="text-xs shrink-0">
                    {cfg.label}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  {goal.workspace && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                      {goal.workspace.name} · {goal.workspace.examType} {goal.workspace.examYear}
                    </p>
                  )}
                  {goal.targetDate && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                      Target: {formatDate(goal.targetDate)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(
                          goal.id,
                          goal.status === "ACTIVE" ? "COMPLETED" : "ACTIVE"
                        )
                      }
                    >
                      {goal.status === "ACTIVE" ? "Mark complete" : "Reopen"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Create your first study goal above."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

// Date-only fields are stored at UTC midnight. Format in UTC so the day the
// user picked does not shift backwards in negative UTC offsets.
function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { timeZone: "UTC" });
}
