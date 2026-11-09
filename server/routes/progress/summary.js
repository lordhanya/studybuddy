import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getProgressSummary(req, res) {
  const { workspaceId } = req.query;
  if (!workspaceId) {
    res.status(400).json({ message: "workspaceId is required" });
    return;
  }
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) {
    res.status(404).json({ message: "Workspace not found" });
    return;
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: ws.groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this workspace's group" });
    return;
  }

  const memberships = await prisma.groupMember.findMany({
    where: { groupId: ws.groupId },
    include: { user: true },
  });
  const userIds = memberships.map((m) => m.user.id);

  const [totalTopics, completedGroups, inProgressGroups] = await Promise.all([
    prisma.topic.count({
      where: { chapter: { subject: { workspaceId } } },
    }),
    prisma.topicProgress.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        status: "COMPLETED",
        topic: { chapter: { subject: { workspaceId } } },
      },
      _count: { _all: true },
    }),
    prisma.topicProgress.groupBy({
      by: ["userId"],
      where: {
        userId: { in: userIds },
        status: "IN_PROGRESS",
        topic: { chapter: { subject: { workspaceId } } },
      },
      _count: { _all: true },
    }),
  ]);

  const completedByUser = new Map(completedGroups.map((g) => [g.userId, g._count._all]));
  const inProgressByUser = new Map(inProgressGroups.map((g) => [g.userId, g._count._all]));

  const userProgress = memberships.map((m) => {
    const completed = completedByUser.get(m.user.id) || 0;
    const inProgress = inProgressByUser.get(m.user.id) || 0;
    return {
      user: { id: m.user.id, fullName: m.user.fullName, email: m.user.email },
      totalTopics,
      completedTopics: completed,
      inProgressTopics: inProgress,
      completionPercentage: totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0,
    };
  });

  const myProgress = userProgress.find((p) => p.user.id === req.user.id);

  res.json({
    workspace: { id: ws.id, name: ws.name, examType: ws.examType, examYear: ws.examYear },
    totalTopics,
    myProgress,
    members: userProgress,
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getProgressSummary)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
