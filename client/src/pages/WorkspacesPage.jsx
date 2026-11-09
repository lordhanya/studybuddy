import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Users } from "lucide-react";

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
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
      const [ws, gs] = await Promise.all([
        api.workspaces.list(),
        api.get("/api/groups"),
      ]);
      setWorkspaces(ws || []);
      setGroups(gs || []);
    } catch (e) {
      console.error(e);
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Workspaces</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            A workspace holds one exam syllabus within a study group.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 shrink-0" /> New workspace
        </Button>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      {creating && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <form onSubmit={handleCreate}>
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create workspace</Button>
                <Button variant="outline" type="button" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.length ? (
          workspaces.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div>
                  <CardTitle className="text-base">{w.name}</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    <Users className="h-3 w-3 shrink-0" />
                    <span>{w.group.name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">{w.examType} {w.examYear}</Badge>
              </CardHeader>
              <CardContent>
                {w.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    {w.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {w._count.subjects} subject{w._count.subjects !== 1 ? "s" : ""}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/workspaces/${w.id}/syllabus`)}
                  >
                    Open syllabus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No workspaces yet.</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Create one to start tracking a syllabus.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
