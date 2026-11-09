import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getDashboardStats(req, res) {
  const userId = req.user.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  const workspaces = await prisma.workspace.findMany({
    where: { groupId: { in: groupIds } },
    select: { id: true },
  });
  const workspaceIds = workspaces.map((w) => w.id);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalTopics, completedTopics, sessionAgg, weeklySessions, recentActivities] =
    await Promise.all([
      prisma.topic.count({
        where: { chapter: { subject: { workspaceId: { in: workspaceIds } } } },
      }),
      prisma.topicProgress.count({
        where: {
          userId,
          status: "COMPLETED",
          topic: { chapter: { subject: { workspaceId: { in: workspaceIds } } } },
        },
      }),
      prisma.studySession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      prisma.studySession.count({
        where: { userId, startedAt: { gte: sevenDaysAgo } },
      }),
      prisma.activity.findMany({
        where: workspaceIds.length
          ? {
              OR: [
                { groupId: { in: groupIds } },
                { workspaceId: { in: workspaceIds } },
              ],
            }
          : { groupId: { in: groupIds } },
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

  const studyHours =
    Math.round(((sessionAgg._sum.duration || 0) / 60) * 10) / 10;

  res.json({
    topicsCompleted: completedTopics,
    totalTopics,
    studyHours,
    weeklySessions,
    completion: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    recentActivities,
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getDashboardStats)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
