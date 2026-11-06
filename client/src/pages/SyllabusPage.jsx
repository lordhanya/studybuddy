import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Plus } from "lucide-react";

const STATUS_CONFIG = {
  NOT_STARTED: { label: "Not started", variant: "outline" },
  IN_PROGRESS: { label: "In progress", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  NEEDS_REVISION: { label: "Needs revision", variant: "destructive" },
};

export default function SyllabusPage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingChapterFor, setAddingChapterFor] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [addingTopicFor, setAddingTopicFor] = useState("");
  const [topicName, setTopicName] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const loadData = async () => {
    try {
      const [ws, prog] = await Promise.all([
        api.workspaces.get(workspaceId),
        api.progress.list(workspaceId),
      ]);
      setWorkspace(ws);
      const map = {};
      (prog || []).forEach((p) => {
        map[p.topic.id] = p.status;
      });
      setProgressMap(map);
    } catch (e) {
      setError(e.message || "Failed to load syllabus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [workspaceId]);

  const completion = () => {
    if (!workspace) return 0;
    let total = 0;
    let completed = 0;
    workspace.subjects.forEach((subject) =>
      subject.chapters.forEach((chapter) =>
        chapter.topics.forEach((topic) => {
          total += 1;
          if (progressMap[topic.id] === "COMPLETED") completed += 1;
        })
      )
    );
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const setStatus = async (topicId, status) => {
    try {
      await api.progress.update(topicId, status);
      setProgressMap((current) => ({ ...current, [topicId]: status }));
    } catch (err) {
      setError(err.message || "Failed to update progress");
    }
  };

  const cycleStatus = (topicId) => {
    const current = progressMap[topicId] || "NOT_STARTED";
    const order = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "NEEDS_REVISION"];
    const next = order[(order.indexOf(current) + 1) % order.length];
    setStatus(topicId, next);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await api.subjects.create({
        workspaceId,
        name: subjectName.trim(),
        description: subjectDescription.trim() || undefined,
      });
      setSubjectName("");
      setSubjectDescription("");
      setShowAddSubject(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create subject");
    } finally {
      setSaving(false);
    }
  };

  const handleAddChapter = async (e, subjectId) => {
    e.preventDefault();
    if (!chapterName.trim()) return;
    setSavingItem(true);
    setError("");
    try {
      await api.chapters.create({
        subjectId,
        name: chapterName.trim(),
      });
      setChapterName("");
      setAddingChapterFor("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create chapter");
    } finally {
      setSavingItem(false);
    }
  };

  const handleAddTopic = async (e, chapterId) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    setSavingItem(true);
    setError("");
    try {
      await api.topics.create({
        chapterId,
        name: topicName.trim(),
      });
      setTopicName("");
      setAddingTopicFor("");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create topic");
    } finally {
      setSavingItem(false);
    }
  };

  if (loading) {
    return <div className="text-[hsl(var(--muted-foreground))]">Loading syllabus…</div>;
  }

  if (!workspace) {
    return <div className="text-[hsl(var(--destructive))] text-sm">{error || "Workspace not found"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <Link
            to="/workspaces"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:underline mb-2 block"
          >
            ← Back to workspaces
          </Link>
          <h1 className="text-lg font-semibold">{workspace.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {workspace.examType} {workspace.examYear} · {workspace.group.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">Completion: {completion()}%</Badge>
          <Button onClick={() => setShowAddSubject((open) => !open)}>
            <Plus className="h-4 w-4" /> Add subject
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 px-3 py-2 rounded border border-[hsl(var(--destructive))]/20">
          {error}
        </div>
      )}

      {showAddSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Add subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Subject name</Label>
                <Input
                  id="subjectName"
                  required
                  placeholder="e.g. Engineering Mathematics"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectDescription">Description (optional)</Label>
                <Input
                  id="subjectDescription"
                  placeholder="e.g. Linear algebra, calculus, probability"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving || !subjectName.trim()}>
                  {saving ? "Adding…" : "Add subject"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddSubject(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="h-1 bg-[hsl(var(--border))]" />

      {workspace.subjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              No subjects yet. Add your first subject to start building the syllabus.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workspace.subjects.map((subject, subjectIndex) => (
            <Card key={subject.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                      Subject {subjectIndex + 1}
                    </span>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    {subject.description && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        · {subject.description}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAddingChapterFor(
                        addingChapterFor === subject.id ? "" : subject.id
                      );
                      setChapterName("");
                      setAddingTopicFor("");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add chapter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {addingChapterFor === subject.id && (
                  <form
                    onSubmit={(e) => handleAddChapter(e, subject.id)}
                    className="flex flex-col sm:flex-row gap-2 mb-3"
                  >
                    <Input
                      autoFocus
                      required
                      placeholder="Chapter name"
                      value={chapterName}
                      onChange={(e) => setChapterName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={savingItem || !chapterName.trim()}
                      >
                        {savingItem ? "Adding…" : "Add"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAddingChapterFor("");
                          setChapterName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                {subject.chapters.length === 0 && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] py-2">
                    No chapters yet. Add a chapter to this subject.
                  </p>
                )}
                <div className="space-y-3">
                  {subject.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="border-l border-[hsl(var(--input))] pl-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        <span className="text-sm font-medium">{chapter.name}</span>
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {chapter.topics.length} topics
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingTopicFor(
                                addingTopicFor === chapter.id ? "" : chapter.id
                              );
                              setTopicName("");
                              setAddingChapterFor("");
                            }}
                            className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                          >
                            <Plus className="h-3 w-3" /> Add topic
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {chapter.topics.length === 0 ? (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] py-1">
                            No topics in this chapter yet.
                          </p>
                        ) : (
                          chapter.topics.map((topic) => {
                            const status = progressMap[topic.id] || "NOT_STARTED";
                            const cfg = STATUS_CONFIG[status];
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                className="w-full flex items-center justify-between text-left hover:bg-[hsl(var(--secondary))]/50 rounded px-3 py-2 transition-colors"
                                onClick={() => cycleStatus(topic.id)}
                                title="Click to cycle topic status"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-2 h-2 rounded-full ${statusDotClass(status)}`}
                                  />
                                  <span className="text-sm truncate">{topic.name}</span>
                                  {topic.description && (
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1 truncate">
                                      {topic.description}
                                    </span>
                                  )}
                                </span>
                                <Badge variant={cfg.variant} className="text-xs shrink-0">
                                  {cfg.label}
                                </Badge>
                              </button>
                            );
                          })
                        )}
                      </div>
                      {addingTopicFor === chapter.id && (
                        <form
                          onSubmit={(e) => handleAddTopic(e, chapter.id)}
                          className="flex flex-col sm:flex-row gap-2 mt-2"
                        >
                          <Input
                            autoFocus
                            required
                            placeholder="Topic name"
                            value={topicName}
                            onChange={(e) => setTopicName(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={savingItem || !topicName.trim()}
                            >
                              {savingItem ? "Adding…" : "Add"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAddingTopicFor("");
                                setTopicName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function statusDotClass(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500";
    case "IN_PROGRESS":
      return "bg-blue-500";
    case "NEEDS_REVISION":
      return "bg-rose-500";
    default:
      return "bg-[hsl(var(--muted-foreground))]/40";
  }
}
