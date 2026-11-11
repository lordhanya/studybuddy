import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";
import { logActivity } from "../../lib/activityLog.js";

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
  if (title !== undefined) {
    const cleanTitle = String(title).trim();
    if (!cleanTitle) {
      res.status(400).json({ message: "Title cannot be empty" });
      return;
    }
    data.title = cleanTitle;
  }
  if (description !== undefined) {
    data.description = String(description || "").trim() || null;
  }
  if (targetDate !== undefined) {
    if (targetDate === null || targetDate === "") {
      data.targetDate = null;
    } else {
      const parsedDate = new Date(targetDate);
      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({ message: "Invalid target date" });
        return;
      }
      data.targetDate = parsedDate;
    }
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: "Invalid status" });
      return;
    }
    data.status = status;
  }

  const updated = await prisma.goal.update({ where: { id }, data, include: { workspace: { select: { id: true, name: true } } } });

  // Auto-log goal achievement to the group feed when it transitions to COMPLETED.
  if (status === "COMPLETED" && goal.status !== "COMPLETED") {
    try {
      await logActivity({
        userId: req.user.id,
        type: "GOAL_ACHIEVED",
        content: `Achieved goal "${updated.title}"`,
        groupId: goal.groupId || undefined,
        workspaceId: goal.workspaceId || undefined,
        metadata: { goalId: updated.id },
      });
    } catch {
      // Never fail the goal update because feed logging failed.
    }
  }

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
