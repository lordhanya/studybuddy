import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

const ONLINE_WINDOW_MINUTES = 5;

async function getGroup(req, res) {
  const { id } = req.query;

  // Verify membership.
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }

  const group = await prisma.studyGroup.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, fullName: true } },
      _count: { select: { members: true, workspaces: true, activities: true } },
      members: {
        include: {
          user: { select: { id: true, fullName: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      workspaces: {
        select: { id: true, name: true, examType: true, examYear: true },
      },
    },
  });

  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }

  const now = new Date();
  const onlineThreshold = new Date(now.getTime() - ONLINE_WINDOW_MINUTES * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const membersWithPresence = group.members.map((m) => {
    const lastSeen = m.lastSeenAt ? new Date(m.lastSeenAt) : null;
    const onlineNow = lastSeen && lastSeen >= onlineThreshold;
    const activeToday = lastSeen && lastSeen >= startOfToday;
    return {
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      role: m.role,
      joinedAt: m.joinedAt,
      lastSeenAt: m.lastSeenAt,
      onlineNow,
      activeToday,
    };
  });

  res.json({
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    role: membership.role,
    isOwner: group.createdBy === req.user.id,
    createdBy: group.creator,
    memberCount: group._count.members,
    workspaceCount: group._count.workspaces,
    recentActivityCount: group._count.activities,
    members: membersWithPresence,
    workspaces: group.workspaces,
  });
}

async function deleteGroup(req, res) {
  const { id } = req.query;
  const group = await prisma.studyGroup.findUnique({ where: { id } });
  if (!group) {
    res.status(404).json({ message: "Group not found" });
    return;
  }
  if (group.createdBy !== req.user.id) {
    res.status(403).json({ message: "Only the group owner can delete the group" });
    return;
  }
  await prisma.studyGroup.delete({ where: { id } });
  res.json({ ok: true });
}

async function exitGroup(req, res) {
  const { id } = req.query;
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }
  if (membership.role === "OWNER") {
    res.status(400).json({ message: "Owner cannot exit. Delete the group instead." });
    return;
  }
  await prisma.groupMember.delete({ where: { id: membership.id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getGroup)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteGroup)(req, res);
  if (req.method === "POST") return requireAuth(exitGroup)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
