import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trash2 } from "lucide-react";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    workspaceId: "",
    title: "",
    subject: "",
    totalMarks: "100",
    obtainedMarks: "0",
    attemptedQuestions: "0",
    correctAnswers: "0",
    incorrectAnswers: "0",
    testDate: "",
  });
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [t, ws] = await Promise.all([
        api.tests.list(),
        api.workspaces.list(),
      ]);
      setTests(Array.isArray(t) ? t : []);
      setWorkspaces(Array.isArray(ws) ? ws : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const avgPct = tests.length
    ? Math.round(
        (tests.reduce((acc, t) => acc + (t.totalMarks > 0 ? (t.obtainedMarks / t.totalMarks) * 100 : 0), 0) /
          tests.length) *
          10
      ) / 10
    : 0;

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const body = {
        workspaceId: form.workspaceId || undefined,
        title: form.title,
        subject: form.subject,
        totalMarks: parseInt(form.totalMarks, 10),
        obtainedMarks: parseInt(form.obtainedMarks, 10),
        attemptedQuestions: parseInt(form.attemptedQuestions, 10) || 0,
        correctAnswers: parseInt(form.correctAnswers, 10) || 0,
        incorrectAnswers: parseInt(form.incorrectAnswers, 10) || 0,
        testDate: form.testDate || undefined,
      };
      const test = await api.tests.create(body);
      setTests([test, ...tests]);
      setForm({
        workspaceId: "",
        title: "",
        subject: "",
        totalMarks: "100",
        obtainedMarks: "0",
        attemptedQuestions: "0",
        correctAnswers: "0",
        incorrectAnswers: "0",
        testDate: "",
      });
      setCreating(false);
    } catch (err) {
      setError(err.message || "Failed to record test");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this test?")) return;
    try {
      await api.tests.remove(id);
      setTests(tests.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete test");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading tests…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mock Tests</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Record your mock test results and track performance over time.
          </p>
        </div>
        <Link to="/workspaces" className="text-sm text-[hsl(var(--muted-foreground))] hover:underline">
          ← Back to workspaces
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{tests.length}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Tests taken</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">{avgPct}%</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Average score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">
              {tests.reduce((acc, t) => acc + t.obtainedMarks, 0)}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total marks obtained</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="text-2xl font-bold">
              {tests.reduce((acc, t) => acc + t.totalMarks, 0)}
            </div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Total possible marks</div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Record mock test result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <form onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="testWorkspace">Workspace</Label>
                <select
                  id="testWorkspace"
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
                <Label htmlFor="testTitle">Test title</Label>
                <Input
                  id="testTitle"
                  required
                  placeholder="e.g. GATE CS Mock 1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testSubject">Subject</Label>
                <Input
                  id="testSubject"
                  required
                  placeholder="e.g. Algorithms"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testTotal">Total marks</Label>
                <Input
                  id="testTotal"
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testObtained">Obtained marks</Label>
                <Input
                  id="testObtained"
                  type="number"
                  value={form.obtainedMarks}
                  onChange={(e) => setForm({ ...form, obtainedMarks: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testCorrect">Correct answers</Label>
                <Input
                  id="testCorrect"
                  type="number"
                  value={form.correctAnswers}
                  onChange={(e) => setForm({ ...form, correctAnswers: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testIncorrect">Incorrect answers</Label>
                <Input
                  id="testIncorrect"
                  type="number"
                  value={form.incorrectAnswers}
                  onChange={(e) => setForm({ ...form, incorrectAnswers: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDate">Test date</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={form.testDate}
                  onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
              Attempted questions is auto-calculated from correct + incorrect if not provided.
            </p>
            <Button type="submit" disabled={creating || !form.title || !form.subject} className="mt-2">
              {creating ? "Recording…" : "Record test"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tests.length ? (
          tests.map((t) => {
            const pct = t.totalMarks > 0 ? Math.round((t.obtainedMarks / t.totalMarks) * 100) : 0;
            return (
              <Card key={t.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{t.title}</CardTitle>
                    <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      <BarChart3 className="h-3 w-3 shrink-0" />
                      <span>{t.subject}</span>
                      {t.workspace && <span>· {t.workspace.name}</span>}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {new Date(t.testDate).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    variant={pct >= 60 ? "default" : pct >= 40 ? "secondary" : "destructive"}
                    className="text-xs shrink-0"
                  >
                    {pct}%
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-2 md:grid-cols-4 text-sm pt-3">
                    <div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Obtained</div>
                      <div className="font-medium">{t.obtainedMarks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Total</div>
                      <div className="font-medium">{t.totalMarks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Correct</div>
                      <div className="font-medium">{t.correctAnswers}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">Incorrect</div>
                      <div className="font-medium">{t.incorrectAnswers}</div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No mock tests yet.</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Record your first test result above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
