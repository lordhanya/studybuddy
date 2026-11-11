import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Plus, BookOpen, Users, Trash2 } from "lucide-react";

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [form, setForm] = useState({
    groupId: "",
    name: "",
    description: "",
    examType: "",
    examYear: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wsResult, gsResult] = await Promise.allSettled([
        api.workspaces.list(),
        api.get("/api/groups"),
      ]);
      if (wsResult.status === "fulfilled") {
        setWorkspaces(Array.isArray(wsResult.value) ? wsResult.value : []);
      }
      if (gsResult.status === "fulfilled") {
        setGroups(Array.isArray(gsResult.value) ? gsResult.value : []);
      }
      const failed = [wsResult, gsResult].find((r) => r.status === "rejected");
      if (failed) {
        setError(failed.reason?.message || "Failed to load workspaces");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.workspaces.create(form);
      setForm({ groupId: "", name: "", description: "", examType: "", examYear: "" });
      setCreating(false);
      loadData();
    } catch (err) {
      setError(err.message || "Failed to create workspace");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workspace? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.workspaces.remove(id);
      setWorkspaces((current) => current.filter((w) => w.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete workspace");
    } finally {
      setDeleting("");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="A workspace holds one exam syllabus within a study group."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 shrink-0" /> New workspace
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {creating && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {groups.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Create a study group first"
                description="Workspaces belong to a group. Create or join a group, then come back to add a workspace."
                actions={
                  <Button onClick={() => navigate("/groups")}>Go to groups</Button>
                }
              />
            ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wsGroup">Study group</Label>
                <select
                  id="wsGroup"
                  required
                  className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  value={form.groupId}
                  onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                >
                  <option value="">Select a group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wsName">Workspace name</Label>
                <Input
                  id="wsName"
                  required
                  placeholder="e.g. GATE 2027 CS"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wsExam">Exam type</Label>
                <Input
                  id="wsExam"
                  required
                  placeholder="e.g. GATE"
                  value={form.examType}
                  onChange={(e) => setForm({ ...form, examType: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wsYear">Exam year</Label>
                <Input
                  id="wsYear"
                  required
                  placeholder="e.g. 2027"
                  value={form.examYear}
                  onChange={(e) => setForm({ ...form, examYear: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wsDesc">Description</Label>
                <Input
                  id="wsDesc"
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" className="w-full sm:w-auto">Create workspace</Button>
                <Button variant="outline" type="button" onClick={() => setCreating(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.length ? (
          workspaces.map((w) => (
            <Card
              key={w.id}
              className="h-full flex flex-col"
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{w.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    <Users className="h-3 w-3 shrink-0" />
                    <span className="truncate">{w.group.name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {w.examType} {w.examYear}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {w.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2 flex-1">
                    {w.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between text-sm pt-3 border-t border-[hsl(var(--border))]">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {w._count?.subjects ?? 0} subject{(w._count?.subjects ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => navigate(`/workspaces/${w.id}/syllabus`)}>
                      Open syllabus
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(w.id);
                      }}
                      disabled={deleting === w.id}
                    >
                      {deleting === w.id ? "Deleting…" : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={BookOpen}
              title="No workspaces yet"
              description="Create one to start tracking a syllabus."
              actions={
                <Button onClick={() => setCreating(true)}>Create workspace</Button>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
