import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import { Plus, Users } from "lucide-react";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createMode, setCreateMode] = useState(false);
  const [joinMode, setJoinMode] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const loadGroups = async () => {
    try {
      const data = await api.get("/api/groups");
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const created = await api.post("/api/groups", { name, description });
      setGroups((current) => [created, ...current]);
      setName("");
      setDescription("");
      setCreateMode(false);
    } catch (err) {
      setError(err.message || "Failed to create group");
    }
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/groups/join", { inviteCode: inviteCode.trim() });
      setJoinMode(false);
      setInviteCode("");
      await loadGroups();
    } catch (err) {
      setError(err.message || "Invalid invite code");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[hsl(var(--muted-foreground))]">
        Loading groups…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Groups"
        description="Create or join groups to study together and compare progress."
        actions={
          <div className="flex gap-2 sm:flex-col sm:w-full">
            <Button className="w-auto sm:w-full" onClick={() => setCreateMode(true)}>
              <Plus className="h-4 w-4 shrink-0" /> Create group
            </Button>
            <Button variant="outline" className="w-auto sm:w-full" onClick={() => setJoinMode(true)}>
              Join by invite code
            </Button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {createMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create a new group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <form onSubmit={createGroup}>
              <div className="space-y-2">
                <Label htmlFor="groupName">Group name</Label>
                <Input
                  id="groupName"
                  required
                  placeholder="e.g. GATE 2027 CS Study Group"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">Description</Label>
                <Input
                  id="groupDescription"
                  placeholder="What are you preparing for together?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                You'll be the group owner. Share the invite code with friends.
              </p>
              <Button type="submit" className="w-full">Create group</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {joinMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Join a group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <form onSubmit={joinGroup}>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <Input
                  id="inviteCode"
                  required
                  placeholder="ABCD1234"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Ask a group member for their invite code.
              </p>
              <Button type="submit" className="w-full">Join group</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!createMode && !joinMode && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.length ? (
            groups.map((g) => (
              <Card key={g.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    {g.isOwner && (
                      <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                        Owner
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {g.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                      {g.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"}
                    </span>
                    {!g.isOwner && g.createdBy && (
                      <span>· Created by {g.createdBy.fullName}</span>
                    )}
                  </div>
                  {g.inviteCode && (
                    <div className="flex items-center gap-2 text-xs bg-[hsl(var(--secondary))] px-2 py-1.5 rounded-md">
                      <span className="font-mono">Invite: {g.inviteCode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={Users}
                title="No groups yet"
                description="Create one to get started, or join with an invite code."
                actions={
                  <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto justify-center">
                    <Button className="w-full sm:w-auto" onClick={() => setCreateMode(true)}>
                      Create group
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => setJoinMode(true)}>
                      Join by invite code
                    </Button>
                  </div>
                }
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
