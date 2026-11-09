import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getTest(req, res) {
  const { id } = req.query;
  const test = await prisma.mockTest.findUnique({
    where: { id },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!test) {
    res.status(404).json({ message: "Mock test not found" });
    return;
  }
  if (test.userId !== req.user.id) {
    res.status(403).json({ message: "You can only access your own tests" });
    return;
  }
  res.json(test);
}

async function updateTest(req, res) {
  const { id } = req.query;
  const { title, subject, totalMarks, obtainedMarks, attemptedQuestions, correctAnswers, incorrectAnswers, testDate } = req.body || {};

  const test = await prisma.mockTest.findUnique({ where: { id } });
  if (!test) {
    res.status(404).json({ message: "Mock test not found" });
    return;
  }
  if (test.userId !== req.user.id) {
    res.status(403).json({ message: "You can only update your own tests" });
    return;
  }

  const data = {};
  if (title !== undefined) {
    const cleanTitle = String(title).trim();
    if (!cleanTitle) {
      res.status(400).json({ message: "Title cannot be empty" });
      return;
    }
    data.title = cleanTitle;
  }
  if (subject !== undefined) {
    const cleanSubject = String(subject).trim();
    if (!cleanSubject) {
      res.status(400).json({ message: "Subject cannot be empty" });
      return;
    }
    data.subject = cleanSubject;
  }

  const nextTotal = totalMarks !== undefined ? Number(totalMarks) : test.totalMarks;
  const nextObtained = obtainedMarks !== undefined ? Number(obtainedMarks) : test.obtainedMarks;
  if (!Number.isFinite(nextTotal) || nextTotal <= 0) {
    res.status(400).json({ message: "Valid total marks is required" });
    return;
  }
  if (!Number.isFinite(nextObtained) || nextObtained < 0 || nextObtained > nextTotal) {
    res.status(400).json({ message: "Obtained marks must be between 0 and total marks" });
    return;
  }
  if (totalMarks !== undefined) data.totalMarks = nextTotal;
  if (obtainedMarks !== undefined) data.obtainedMarks = nextObtained;

  for (const [key, label] of [
    ["attemptedQuestions", "Attempted questions"],
    ["correctAnswers", "Correct answers"],
    ["incorrectAnswers", "Incorrect answers"],
  ]) {
    const value = { attemptedQuestions, correctAnswers, incorrectAnswers }[key];
    if (value === undefined) continue;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      res.status(400).json({ message: `${label} must be a non-negative number` });
      return;
    }
    data[key] = Math.round(num);
  }

  if (testDate !== undefined) {
    const date = new Date(testDate);
    if (Number.isNaN(date.getTime())) {
      res.status(400).json({ message: "Invalid test date" });
      return;
    }
    data.testDate = date;
  }

  const updated = await prisma.mockTest.update({ where: { id }, data, include: { workspace: { select: { id: true, name: true } } } });
  res.json(updated);
}

async function deleteTest(req, res) {
  const { id } = req.query;
  const test = await prisma.mockTest.findUnique({ where: { id } });
  if (!test) {
    res.status(404).json({ message: "Mock test not found" });
    return;
  }
  if (test.userId !== req.user.id) {
    res.status(403).json({ message: "You can only delete your own tests" });
    return;
  }
  await prisma.mockTest.delete({ where: { id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getTest)(req, res);
  if (req.method === "PUT") return requireAuth(updateTest)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteTest)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
