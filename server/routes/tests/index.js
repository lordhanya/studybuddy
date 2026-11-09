import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

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
    take: parseLimit(limit, 50),
  });

  res.json(tests);
}

function parseLimit(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
}

async function createTest(req, res) {
  const { workspaceId, title, subject, totalMarks, obtainedMarks, attemptedQuestions, correctAnswers, incorrectAnswers, testDate } = req.body || {};

  const cleanTitle = String(title || "").trim();
  const cleanSubject = String(subject || "").trim();
  const total = Number(totalMarks);
  const obtained = Number(obtainedMarks);
  const attempted = attemptedQuestions == null ? null : Number(attemptedQuestions);
  const correct = correctAnswers == null ? 0 : Number(correctAnswers);
  const incorrect = incorrectAnswers == null ? 0 : Number(incorrectAnswers);

  if (!cleanTitle || !cleanSubject) {
    res.status(400).json({ message: "Title and subject are required" });
    return;
  }
  if (!Number.isFinite(total) || total <= 0) {
    res.status(400).json({ message: "Valid total marks is required" });
    return;
  }
  if (!Number.isFinite(obtained) || obtained < 0 || obtained > total) {
    res.status(400).json({ message: "Obtained marks must be between 0 and total marks" });
    return;
  }
  if (attempted != null && (!Number.isFinite(attempted) || attempted < 0)) {
    res.status(400).json({ message: "Attempted questions must be a non-negative number" });
    return;
  }
  if (!Number.isFinite(correct) || correct < 0 || !Number.isFinite(incorrect) || incorrect < 0) {
    res.status(400).json({ message: "Correct and incorrect answers must be non-negative numbers" });
    return;
  }

  let parsedDate = new Date();
  if (testDate) {
    parsedDate = new Date(testDate);
    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: "Invalid test date" });
      return;
    }
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
      title: cleanTitle,
      subject: cleanSubject,
      totalMarks: total,
      obtainedMarks: obtained,
      attemptedQuestions: attempted != null ? Math.round(attempted) : attemptedCount(correct, incorrect),
      correctAnswers: Math.round(correct),
      incorrectAnswers: Math.round(incorrect),
      testDate: parsedDate,
    },
    include: { workspace: { select: { id: true, name: true } } },
  });

  res.status(201).json(test);
}

function attemptedCount(correct, incorrect) {
  return Math.round(correct) + Math.round(incorrect);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listTests)(req, res);
  if (req.method === "POST") return requireAuth(createTest)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
