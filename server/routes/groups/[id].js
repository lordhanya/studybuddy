import { prisma } from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/middleware.js";

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

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getGroup)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
