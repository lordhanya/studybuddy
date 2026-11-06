import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

const VALID_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"];

async function listGoals(req, res) {
  const { workspaceId, status } = req.query;

  let where = { userId: req.user.id };
  if (workspaceId) where.workspaceId = workspaceId;
  if (status && VALID_STATUSES.includes(status)) where.status = status;

  // Verify workspace membership if workspaceId provided
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

  const goals = await prisma.goal.findMany({
    where,
    include: {
      workspace: { select: { id: true, name: true, examType: true, examYear: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(goals);
}

async function createGoal(req, res) {
  const { workspaceId, title, description, targetDate, status } = req.body || {};

  if (!title) {
    res.status(400).json({ message: "Title is required" });
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

  const goalStatus = status && VALID_STATUSES.includes(status) ? status : "ACTIVE";

  const goal = await prisma.goal.create({
    data: {
      userId: req.user.id,
      workspaceId: workspaceIdFinal,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : null,
      status: goalStatus,
    },
    include: {
      workspace: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(goal);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listGoals)(req, res);
  if (req.method === "POST") return requireAuth(createGoal)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
