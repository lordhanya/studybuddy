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
  if (title !== undefined) data.title = title;
  if (subject !== undefined) data.subject = subject;
  if (totalMarks !== undefined) data.totalMarks = totalMarks;
  if (obtainedMarks !== undefined) data.obtainedMarks = obtainedMarks;
  if (attemptedQuestions !== undefined) data.attemptedQuestions = attemptedQuestions;
  if (correctAnswers !== undefined) data.correctAnswers = correctAnswers;
  if (incorrectAnswers !== undefined) data.incorrectAnswers = incorrectAnswers;
  if (testDate !== undefined) data.testDate = new Date(testDate);

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
