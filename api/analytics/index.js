import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

async function getAnalytics(req, res) {
  const { workspaceId } = req.query;

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

  const uid = req.user.id;

  // Study hours over last 30 days (daily)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sessions = await prisma.studySession.findMany({
    where: { userId: uid, workspaceId, startedAt: { gte: thirtyDaysAgo } },
    select: { duration: true, startedAt: true },
  });

  // Group by day (UTC), then fill the full 30-day window so the chart has
  // a continuous x-axis even on days with no sessions.
  const daily = {};
  sessions.forEach((s) => {
    const day = s.startedAt.toISOString().slice(0, 10);
    daily[day] = (daily[day] || 0) + s.duration;
  });
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const dailyHours = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date(todayUtc - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    dailyHours.push({
      date,
      hours: Math.round(((daily[date] || 0) / 60) * 10) / 10,
    });
  }

  // Subject-wise completion
  const subjects = await prisma.subject.findMany({
    where: { workspaceId },
    include: {
      chapters: {
        include: {
          topics: {
            include: {
              progress: { where: { userId: uid } },
            },
          },
        },
      },
    },
    orderBy: { position: "asc" },
  });

  const subjectProgress = subjects.map((s) => {
    let total = 0, completed = 0;
    s.chapters.forEach((c) =>
      c.topics.forEach((t) => {
        total += 1;
        const p = t.progress[0];
        if (p && p.status === "COMPLETED") completed += 1;
      })
    );
    return {
      subjectId: s.id,
      subjectName: s.name,
      totalTopics: total,
      completedTopics: completed,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Mock test trend (last 10)
  const tests = await prisma.mockTest.findMany({
    where: { userId: uid, workspaceId },
    select: { title: true, obtainedMarks: true, totalMarks: true, testDate: true },
    orderBy: { testDate: "desc" },
    take: 10,
  });

  const mockTrend = tests
    .map((t) => ({
      title: t.title,
      date: t.testDate,
      percentage:
        t.totalMarks > 0
          ? Math.round((t.obtainedMarks / t.totalMarks) * 100)
          : 0,
    }))
    .reverse();

  res.json({
    workspace: { id: ws.id, name: ws.name },
    totalStudyHours: Math.round((sessions.reduce((acc, s) => acc + s.duration, 0) / 60) * 10) / 10,
    dailyHours,
    subjectProgress,
    mockTrend,
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getAnalytics)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
