import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

async function listTests(req, res) {
  const { workspaceId, limit } = req.query;
  let where = { userId: req.user.id };
  if (workspaceId) where.workspaceId = workspaceId;

  if (workspaceId) {
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
  }

  const tests = await prisma.mockTest.findMany({
    where,
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { testDate: "desc" },
    take: limit ? Math.min(parseInt(limit, 10), 100) : 50,
  });

  res.json(tests);
}

async function createTest(req, res) {
  const { workspaceId, title, subject, totalMarks, obtainedMarks, attemptedQuestions, correctAnswers, incorrectAnswers, testDate } = req.body || {};

  if (!title || !subject) {
    res.status(400).json({ message: "Title and subject are required" });
    return;
  }
  if (totalMarks == null || totalMarks <= 0) {
    res.status(400).json({ message: "Valid total marks is required" });
    return;
  }
  if (obtainedMarks == null || obtainedMarks < 0 || obtainedMarks > totalMarks) {
    res.status(400).json({ message: "Obtained marks must be between 0 and total marks" });
    return;
  }

  let workspaceIdFinal = workspaceId || null;
  if (workspaceId) {
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
  }

  const test = await prisma.mockTest.create({
    data: {
      userId: req.user.id,
      workspaceId: workspaceIdFinal,
      title,
      subject,
      totalMarks,
      obtainedMarks,
      attemptedQuestions:
        attemptedQuestions != null
          ? attemptedQuestions
          : (correctAnswers || 0) + (incorrectAnswers || 0),
      correctAnswers: correctAnswers || 0,
      incorrectAnswers: incorrectAnswers || 0,
      testDate: testDate ? new Date(testDate) : new Date(),
    },
    include: { workspace: { select: { id: true, name: true } } },
  });

  res.status(201).json(test);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listTests)(req, res);
  if (req.method === "POST") return requireAuth(createTest)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
