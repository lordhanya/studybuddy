import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

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

  // Total topics in this workspace
  const totalTopics = await prisma.topic.count({
    where: {
      chapter: {
        subject: { workspaceId },
      },
    },
  });

  // Progress per user in this workspace
  const memberships = await prisma.groupMember.findMany({
    where: { groupId: ws.groupId },
    include: { user: true },
  });

  const userProgress = await Promise.all(
    memberships.map(async (m) => {
      const completed = await prisma.topicProgress.count({
        where: {
          userId: m.user.id,
          status: "COMPLETED",
          topic: {
            chapter: { subject: { workspaceId } },
          },
        },
      });
      const inProgress = await prisma.topicProgress.count({
        where: {
          userId: m.user.id,
          status: "IN_PROGRESS",
          topic: {
            chapter: { subject: { workspaceId } },
          },
        },
      });
      const percentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;
      return {
        user: { id: m.user.id, fullName: m.user.fullName, email: m.user.email },
        totalTopics,
        completedTopics: completed,
        inProgressTopics: inProgress,
        completionPercentage: percentage,
      };
    })
  );

  // Current user's detailed progress
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
