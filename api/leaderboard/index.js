import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

async function getLeaderboard(req, res) {
  const { workspaceId, metric } = req.query;

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

  // Get all group members
  const members = await prisma.groupMember.findMany({
    where: { groupId: ws.groupId },
    include: { user: { select: { id: true, fullName: true, email: true } } },
  });

  // Compute metrics per member
  const results = await Promise.all(
    members.map(async (m) => {
      const uid = m.user.id;

      // Syllabus completion for this workspace
      const totalTopics = await prisma.topic.count({
        where: { chapter: { subject: { workspaceId } } },
      });
      const completedTopics = await prisma.topicProgress.count({
        where: { userId: uid, status: "COMPLETED", topic: { chapter: { subject: { workspaceId } } } },
      });
      const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Study hours (total duration in minutes -> hours)
      const sessionAgg = await prisma.studySession.aggregate({
        where: { userId: uid, workspaceId },
        _sum: { duration: true },
      });
      const studyHours = Math.round(((sessionAgg._sum.duration || 0) / 60) * 10) / 10;

      // Weekly consistency: sessions in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weeklySessions = await prisma.studySession.count({
        where: { userId: uid, workspaceId, startedAt: { gte: sevenDaysAgo } },
      });

      // Mock test performance: average percentage
      const tests = await prisma.mockTest.findMany({
        where: { userId: uid, workspaceId },
        select: { obtainedMarks: true, totalMarks: true },
      });
      let avgPct = 0;
      if (tests.length > 0) {
        const sum = tests.reduce((acc, t) => acc + (t.totalMarks > 0 ? (t.obtainedMarks / t.totalMarks) * 100 : 0), 0);
        avgPct = Math.round(sum / tests.length);
      }

      // Composite score: completion (40%) + study hours capped (20%) + weekly consistency (20%) + mock avg (20%)
      // Avoid using study hours as sole metric - combine with others
      const hoursScore = Math.min(studyHours, 40) / 40; // cap at 40 hours
      const weeklyScore = Math.min(weeklySessions, 7) / 7; // cap at 7 sessions/week
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
    })
  );

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
  results.forEach((r, i) => { r.rank = i + 1; });

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
