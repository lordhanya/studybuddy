import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import {
  MessageCircle,
  Flame,
  BookOpen,
  Share2,
  Target,
  Users,
  Plus,
} from "lucide-react";

const TYPE_LABELS = {
  TOPIC_COMPLETED: "Topic completed",
  CHAPTER_COMPLETED: "Chapter completed",
  STUDY_SESSION: "Study session",
  MOCK_TEST: "Mock test",
  DAILY_UPDATE: "Daily update",
  GOAL_ACHIEVED: "Goal achieved",
  MEMBER_JOINED: "Member joined",
};

const POST_TYPES = [
  "DAILY_UPDATE",
  "TOPIC_COMPLETED",
  "CHAPTER_COMPLETED",
  "STUDY_SESSION",
  "MOCK_TEST",
  "GOAL_ACHIEVED",
];

const TYPE_ICONS = {
  TOPIC_COMPLETED: BookOpen,
  CHAPTER_COMPLETED: BookOpen,
  STUDY_SESSION: Flame,
  MOCK_TEST: Share2,
  DAILY_UPDATE: MessageCircle,
  GOAL_ACHIEVED: Target,
  MEMBER_JOINED: Users,
};

export default function ActivityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("DAILY_UPDATE");
  const [creating, setCreating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentingOn, setCommentingOn] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.workspaces
      .list()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setWorkspaces(list);
        if (list.length) setWorkspaceId(list[0].id);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load workspaces");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadActivities = useCallback(async (id) => {
    if (!id) {
      setActivities([]);
      return;
    }
    try {
      setError("");
      const data = await api.activities.list({ workspaceId: id });
      setActivities(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load activities");
    }
  }, []);

  useEffect(() => {
    loadActivities(workspaceId);
  }, [workspaceId, loadActivities]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!workspaceId || !newContent.trim()) return;
    setError("");
    setCreating(true);
    try {
      const activity = await api.activities.create({
        type: newType,
        content: newContent.trim(),
        workspaceId,
      });
      setActivities((current) => [activity, ...current]);
      setNewContent("");
      setNewType("DAILY_UPDATE");
    } catch (err) {
      setError(err.message || "Failed to post activity");
    } finally {
      setCreating(false);
    }
  };

  const handleReaction = async (activityId, type) => {
    try {
      const result = await api.activities.reactions.add(activityId, type);
      setActivities((acts) =>
        acts.map((activity) => {
          if (activity.id !== activityId) return activity;
          const others = (activity.reactions || []).filter(
            (reaction) => reaction.userId !== user?.id
          );
          return {
            ...activity,
            reactions: result.removed ? others : [...others, result],
          };
        })
      );
    } catch (err) {
      setError(err.message || "Failed to add reaction");
    }
  };

  const handleCommentAdd = async (activityId, e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await api.activities.comments.add(activityId, newComment.trim());
      setActivities((acts) =>
        acts.map((activity) =>
          activity.id === activityId
            ? { ...activity, comments: [...(activity.comments || []), comment] }
            : activity
        )
      );
      setNewComment("");
      setCommentingOn("");
    } catch (err) {
      setError(err.message || "Failed to add comment");
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading feed…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="See what's happening in your study groups."
      />

      {!workspaces.length ? (
        <Card>
          <CardContent className="text-center py-10">
            <EmptyState
              icon={MessageCircle}
              title="No workspace yet"
              description="Create a workspace before posting activity."
              actions={
                <Button onClick={() => navigate("/workspaces")}>
                  <Plus className="h-4 w-4" /> Create a workspace
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {error && <ErrorBanner message={error} />}

          <Card>
            <CardContent className="pt-5 pb-4">
              <div>
                <CardTitle className="text-base mb-4">Share an update</CardTitle>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="activityWorkspace"
                      className="block text-xs font-medium text-[hsl(var(--muted-foreground))]"
                    >
                      Workspace
                    </label>
                    <select
                      id="activityWorkspace"
                      value={workspaceId}
                      onChange={(e) => setWorkspaceId(e.target.value)}
                      className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    >
                      {workspaces.map((workspace) => (
                        <option key={workspace.id} value={workspace.id}>
                          {workspace.name} ({workspace.examType} {workspace.examYear})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="activityContent"
                      className="block text-xs font-medium text-[hsl(var(--muted-foreground))]"
                    >
                      What are you working on?
                    </label>
                    <textarea
                      id="activityContent"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="e.g. Finished Linear Algebra chapter, completed 3 mock tests…"
                      rows={3}
                      className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Type:</span>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full sm:w-auto rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
                    >
                      {POST_TYPES.map((key) => (
                        <option key={key} value={key}>
                          {TYPE_LABELS[key]}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" disabled={creating || !newContent.trim()} className="w-full sm:w-auto">
                      {creating ? "Posting…" : "Post"}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {activities.length === 0 ? (
              <Card>
                <EmptyState
                  icon={MessageCircle}
                  title="No activity yet"
                  description="Share your first study update to get started."
                />
              </Card>
            ) : (
              activities.map((activity) => {
                const Icon = TYPE_ICONS[activity.type] || MessageCircle;
                const reactions = activity.reactions || [];
                const comments = activity.comments || [];
                return (
                  <Card key={activity.id}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                            <span className="font-medium">
                              {activity.user?.fullName || "Unknown"}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {TYPE_LABELS[activity.type] || activity.type}
                            </Badge>
                            <span className="text-[hsl(var(--muted-foreground))]">
                              {formatTime(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mb-3 break-words">{activity.content}</p>

                          <div className="flex items-center gap-4 mb-3 border-t border-[hsl(var(--input))] pt-2 flex-wrap">
                            {["🔥", "👍", "⭐", "✅"].map((emoji) => {
                              const reacted = reactions.some(
                                (reaction) =>
                                  reaction.userId === user?.id && reaction.type === emoji
                              );
                              const count = reactions.filter(
                                (reaction) => reaction.type === emoji
                              ).length;
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReaction(activity.id, emoji)}
                                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors ${
                                    reacted
                                      ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                                  }`}
                                >
                                  {emoji} <span className="font-medium">{count}</span>
                                </button>
                              );
                            })}
                          </div>

                          <div className="space-y-2">
                            {comments.map((comment) => (
                              <div key={comment.id} className="flex items-start gap-2 text-sm">
                                <span className="text-[hsl(var(--muted-foreground))]">
                                  {comment.user?.fullName || "Unknown"}:
                                </span>
                                <span className="break-words">{comment.content}</span>
                              </div>
                            ))}
                            {commentingOn === activity.id ? (
                              <form
                                onSubmit={(e) => handleCommentAdd(activity.id, e)}
                                className="flex gap-2 flex-col sm:flex-row"
                              >
                                <input
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Write a comment…"
                                  className="flex-1 w-full sm:w-auto rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                                />
                                <Button type="submit" size="sm" disabled={!newComment.trim()} className="w-full sm:w-auto">
                                  Post
                                </Button>
                              </form>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCommentingOn(activity.id)}
                                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] underline"
                              >
                                Add a comment
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
