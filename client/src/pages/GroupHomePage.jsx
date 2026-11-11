import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import PresenceStrip from "@/components/PresenceStrip";
import TodayCheckin from "@/components/TodayCheckin";
import ContributionGraph from "@/components/ContributionGraph";
import { Users, Target, Activity, Clock, Share2, MoreHorizontal, Sun, LogOut, Trash2 } from "lucide-react";

function ymd(date) {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

export default function GroupHomePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [todayUpdates, setTodayUpdates] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [exitingGroup, setExitingGroup] = useState(false);
  const [removingMember, setRemovingMember] = useState("");

  const today = ymd(new Date());

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const [g, updates, goals, acts] = await Promise.all([
        api.groups.get(id),
        api.dailyUpdates.list({ groupId: id, date: today }),
        api.goals.list({ scope: "group", groupId: id }),
        api.activities.list({ groupId: id }),
      ]);
      setGroup(g);
      setTodayUpdates(Array.isArray(updates) ? updates : []);
      setGroupGoals(Array.isArray(goals) ? goals : []);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch (e) {
      setError(e.message || "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [id, today]);

  const handleDeleteGroup = async () => {
    if (!window.confirm("Delete this group? All workspaces and activity will be removed.")) return;
    setDeletingGroup(true);
    try {
      await api.groups.remove(id);
      navigate("/groups");
    } catch (err) {
      setError(err.message || "Failed to delete group");
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleExitGroup = async () => {
    if (!window.confirm("Leave this group? You'll lose access to its workspaces and activity.")) return;
    setExitingGroup(true);
    try {
      await api.groups.exit(id);
      navigate("/groups");
    } catch (err) {
      setError(err.message || "Failed to leave group");
    } finally {
      setExitingGroup(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    setRemovingMember(userId);
    try {
      await api.groups.removeMember(id, userId);
      loadGroup();
    } catch (err) {
      setError(err.message || "Failed to remove member");
    } finally {
      setRemovingMember("");
    }
  };

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Presence heartbeat every 60 seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      api.presence.ping().catch(() => {
        // Silence; best-effort presence.
      });
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading group…
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        {error || "Group not found"}
      </div>
    );
  }

  // Build activity-by-date for the contribution graph (this user's activity in this group).
  const activityByDate = {};
  activities.forEach((a) => {
    const d = new Date(a.createdAt).toISOString().slice(0, 10);
    activityByDate[d] = (activityByDate[d] || 0) + 1;
  });
  todayUpdates.forEach((u) => {
    activityByDate[u.date] = (activityByDate[u.date] || 0) + 1;
  });

  // My update for today (merged morning+evening for the check-in editor).
  const myUpdate = todayUpdates.find((u) => u.userId === user.id);

  // Members with their today updates.
  const membersWithUpdates = (group.members || []).map((m) => {
    const u = todayUpdates.find((x) => x.userId === m.userId);
    return { ...m, update: u || null };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        description={group.description}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/groups")}>
              <Users className="h-3.5 w-3.5" /> All groups
            </Button>
            {!group.isOwner ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExitGroup}
                disabled={exitingGroup}
              >
                {exitingGroup ? "Leaving…" : <LogOut className="h-3.5 w-3.5" />}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
              >
                {deletingGroup ? "Deleting…" : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            <button
              type="button"
              className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
              onClick={() =>
                navigator.clipboard.writeText(`${window.location.origin}/groups/${id}`)
              }
              title="Copy group link"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <MoreHorizontal className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadGroup} />}

      {/* Group header card */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{group.name}</span>
                {group.isOwner && (
                  <Badge variant="outline" className="text-[10px]">
                    Owner
                  </Badge>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
                <span>
                  {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                </span>
                <span>·</span>
                <span>{group.workspaceCount} workspace{group.workspaceCount === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>{group.recentActivityCount} recent activity</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs bg-[hsl(var(--secondary))] px-3 py-1.5 rounded-md font-mono">
                <span>Invite: {group.inviteCode}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/workspaces")}
                disabled={!group.workspaces?.length}
              >
                <Clock className="h-3.5 w-3.5" /> Workspaces
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: presence + today check-in + contribution graph */}
        <div className="lg:col-span-4 space-y-6">
          <PresenceStrip members={group.members} />

          <TodayCheckin
            groupId={group.id}
            workspaceId={group.workspaces?.[0]?.id || undefined}
            myUpdate={myUpdate || null}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contribution graph</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ContributionGraph activityByDate={activityByDate} today={today} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: today board + group goals + feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today board */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-base">Today's board</CardTitle>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{today}</span>
            </CardHeader>
            <CardContent className="pt-0">
              {membersWithUpdates.length ? (
                <div className="space-y-3">
                  {membersWithUpdates.map((m) => {
                    const u = m.update;
                    return (
                      <div
                        key={m.userId}
                        className="flex items-start gap-3 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
                      >
                        <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center shrink-0 text-xs font-medium">
                          {m.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{m.fullName}</span>
                            {m.role === "OWNER" && (
                              <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                Owner
                              </span>
                            )}
                          </div>
                          {u ? (
                            <div className="space-y-1 text-sm">
                              {u.studying && (
                                <div className="flex items-start gap-1.5">
                                  <Sun className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                                  <span className="break-words">{u.studying}</span>
                                </div>
                              )}
                              {u.plan && (
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[hsl(var(--muted-foreground))]">Plan:</span>{" "}
                                  <span className="break-words">{u.plan}</span>
                                </div>
                              )}
                              {u.completed && (
                                <div className="flex items-start gap-1.5">
                                  <Clock className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                                  <span className="break-words">{u.completed}</span>
                                </div>
                              )}
                              {!u.studying && !u.plan && !u.completed && (
                                <span className="text-[hsl(var(--muted-foreground))] text-xs">
                                  No check-in yet
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[hsl(var(--muted-foreground))] text-sm">
                              No check-in today
                            </span>
                          )}
                        </div>
                          {m.onlineNow && (
                            <span className="text-[10px] bg-[hsl(var(--accent))] px-1.5 py-0.5 rounded text-[hsl(var(--accent-foreground))] font-medium ml-2">
                              Online
                            </span>
                          )}
                          {(group.isOwner || group.role === "ADMIN") &&
                            m.userId !== user.id &&
                            m.role !== "OWNER" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(m.userId);
                                }}
                                disabled={removingMember === m.userId}
                              >
                                {removingMember === m.userId ? "Removing…" : <Trash2 className="h-3 w-3" />}
                              </Button>
                            )}
                        </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No members yet"
                  description="Invite friends to your group to see who's studying today."
                />
              )}
            </CardContent>
          </Card>

          {/* Group goals */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-base">Group goals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {groupGoals.length ? (
                <div className="space-y-3">
                  {groupGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{g.title}</span>
                        <Badge
                          variant={
                            g.status === "COMPLETED"
                              ? "default"
                              : g.status === "CANCELLED"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {g.status}
                        </Badge>
                      </div>
                      {g.description && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                          {g.description}
                        </p>
                      )}
                      <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5 mb-2 overflow-hidden">
                        <div
                          className="h-full bg-[hsl(var(--primary))]"
                          style={{ width: `${Math.min(g.progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
                        <span>Progress: {g.progress}%</span>
                        <span>
                          {g.user?.fullName || "A member"} ·{" "}
                          {new Date(g.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Target}
                  title="No group goals yet"
                  description="Create a goal and share it with the group."
                />
              )}
            </CardContent>
          </Card>

          {/* Group feed */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <CardTitle className="text-base">Group activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activities.length ? (
                <div className="space-y-4">
                  {activities.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3 border-b border-[hsl(var(--border))] last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="font-medium">{a.user?.fullName || "Unknown"}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {a.type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[hsl(var(--muted-foreground))]">
                            {new Date(a.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm break-words">{a.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No group activity yet"
                  description="Start by checking in or completing a topic."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
