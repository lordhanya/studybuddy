import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

const VALID_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"];

async function getGoal(req, res) {
  const { id } = req.query;
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!goal) {
    res.status(404).json({ message: "Goal not found" });
    return;
  }
  if (goal.userId !== req.user.id) {
    res.status(403).json({ message: "You can only access your own goals" });
    return;
  }
  res.json(goal);
}

async function updateGoal(req, res) {
  const { id } = req.query;
  const { title, description, targetDate, status } = req.body || {};

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) {
    res.status(404).json({ message: "Goal not found" });
    return;
  }
  if (goal.userId !== req.user.id) {
    res.status(403).json({ message: "You can only update your own goals" });
    return;
  }

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }
    data.status = status;
  }

  const updated = await prisma.goal.update({ where: { id }, data, include: { workspace: { select: { id: true, name: true } } } });
  res.json(updated);
}

async function deleteGoal(req, res) {
  const { id } = req.query;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) {
    res.status(404).json({ message: "Goal not found" });
    return;
  }
  if (goal.userId !== req.user.id) {
    res.status(403).json({ message: "You can only delete your own goals" });
    return;
  }
  await prisma.goal.delete({ where: { id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getGoal)(req, res);
  if (req.method === "PUT") return requireAuth(updateGoal)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteGoal)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
