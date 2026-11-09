import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getLeaderboard(req, res) {
  const { workspaceId, metric } = req.query;

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

  const members = await prisma.groupMember.findMany({
    where: { groupId: ws.groupId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });
  const userIds = members.map((m) => m.user.id);

  // Batch every aggregate once instead of querying per member.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    totalTopics,
    completedGroups,
    sessionGroups,
    weeklyGroups,
    mockTests,
  ] = await Promise.all([
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
    prisma.studySession.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, workspaceId },
      _sum: { duration: true },
    }),
    prisma.studySession.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, workspaceId, startedAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
    prisma.mockTest.findMany({
      where: { userId: { in: userIds }, workspaceId },
      select: { userId: true, obtainedMarks: true, totalMarks: true },
    }),
  ]);

  const completedByUser = new Map(completedGroups.map((g) => [g.userId, g._count._all]));
  const durationByUser = new Map(sessionGroups.map((g) => [g.userId, g._sum.duration || 0]));
  const weeklyByUser = new Map(weeklyGroups.map((g) => [g.userId, g._count._all]));
  const testsByUser = new Map();
  for (const test of mockTests) {
    if (!testsByUser.has(test.userId)) testsByUser.set(test.userId, []);
    testsByUser.get(test.userId).push(test);
  }

  const results = members.map((m) => {
    const uid = m.user.id;
    const completedTopics = completedByUser.get(uid) || 0;
    const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    const studyHours = Math.round(((durationByUser.get(uid) || 0) / 60) * 10) / 10;
    const weeklySessions = weeklyByUser.get(uid) || 0;

    const tests = testsByUser.get(uid) || [];
    let avgPct = 0;
    if (tests.length > 0) {
      const sum = tests.reduce(
        (acc, t) => acc + (t.totalMarks > 0 ? (t.obtainedMarks / t.totalMarks) * 100 : 0),
        0
      );
      avgPct = Math.round(sum / tests.length);
    }

    // Composite score: completion (40%) + study hours capped (20%)
    // + weekly consistency (20%) + mock average (20%).
    const hoursScore = Math.min(studyHours, 40) / 40;
    const weeklyScore = Math.min(weeklySessions, 7) / 7;
    const composite = Math.round(
      completionPct * 0.4 +
        hoursScore * 100 * 0.2 +
        weeklyScore * 100 * 0.2 +
        avgPct * 0.2
    );

    return {
      user: { id: m.user.id, fullName: m.user.fullName, email: m.user.email },
      role: m.role,
      completionPercentage: completionPct,
      topicsCompleted: completedTopics,
      totalTopics,
      studyHours,
      weeklySessions,
      mockTestsTaken: tests.length,
      mockAveragePercentage: avgPct,
      compositeScore: composite,
    };
  });

  // Sort by composite score (or by specified metric)
  results.sort((a, b) => {
    if (metric === "completion") return b.completionPercentage - a.completionPercentage;
    if (metric === "topics") return b.topicsCompleted - a.topicsCompleted;
    if (metric === "hours") return b.studyHours - a.studyHours;
    if (metric === "weekly") return b.weeklySessions - a.weeklySessions;
    if (metric === "mock") return b.mockAveragePercentage - a.mockAveragePercentage;
    return b.compositeScore - a.compositeScore;
  });

  // Add rank
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  res.json({
    workspace: { id: ws.id, name: ws.name, examType: ws.examType, examYear: ws.examYear },
    metric: metric || "composite",
    members: results,
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getLeaderboard)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
