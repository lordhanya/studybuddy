import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

const VALID_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"];
const VALID_VISIBILITY = ["PERSONAL", "GROUP"];

async function listGoals(req, res) {
  const { workspaceId, status, scope, groupId } = req.query;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.user.id },
    select: { groupId: true },
  });
  const myGroupIds = memberships.map((m) => m.groupId);

  let where = { userId: req.user.id };

  if (scope === "group") {
    // Group goals visible to me: shared with any group I'm a member of.
    where.visibility = "GROUP";
    if (groupId) {
      if (!myGroupIds.includes(groupId)) {
        res.status(403).json({ message: "Not a member of this group" });
        return;
      }
      where.groupId = groupId;
    } else {
      where.groupId = { in: myGroupIds };
    }
  } else {
    // Personal scope: only the user's own private goals.
    where.visibility = "PERSONAL";
    where.groupId = null;
  }

  if (workspaceId) where.workspaceId = workspaceId;
  if (status && VALID_STATUSES.includes(status)) where.status = status;

  // Verify workspace membership if workspaceId provided.
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }
    if (!myGroupIds.includes(ws.groupId)) {
      res.status(403).json({ message: "Not a member of this workspace's group" });
      return;
    }
  }

  const goals = await prisma.goal.findMany({
    where,
    include: {
      workspace: { select: { id: true, name: true, examType: true, examYear: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(goals);
}

async function createGoal(req, res) {
  const { workspaceId, groupId, title, description, targetDate, status, visibility, progress } =
    req.body || {};

  const cleanTitle = String(title || "").trim();
  const cleanDescription = String(description || "").trim();

  if (!cleanTitle) {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  const cleanVisibility = VALID_VISIBILITY.includes(visibility) ? visibility : "PERSONAL";
  const cleanProgress = Number(progress);
  const cleanProgressValue =
    Number.isFinite(cleanProgress) && cleanProgress >= 0 && cleanProgress <= 100
      ? Math.round(cleanProgress)
      : 0;

  let parsedDate = null;
  if (targetDate) {
    parsedDate = new Date(targetDate);
    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: "Invalid target date" });
      return;
    }
  }

  let workspaceIdFinal = workspaceId || null;
  let groupIdFinal = null;

  if (cleanVisibility === "GROUP") {
    if (!groupId) {
      res.status(400).json({ message: "Group is required when sharing a goal" });
      return;
    }
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
    });
    if (!membership) {
      res.status(403).json({ message: "Not a member of this group" });
      return;
    }
    groupIdFinal = groupId;
  }

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
    workspaceIdFinal = ws.id;
  }

  const goalStatus = status && VALID_STATUSES.includes(status) ? status : "ACTIVE";

  const goal = await prisma.goal.create({
    data: {
      userId: req.user.id,
      groupId: groupIdFinal,
      workspaceId: workspaceIdFinal,
      title: cleanTitle,
      description: cleanDescription || null,
      targetDate: parsedDate,
      status: goalStatus,
      visibility: cleanVisibility,
      progress: cleanProgressValue,
    },
    include: {
      workspace: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(goal);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listGoals)(req, res);
  if (req.method === "POST") return requireAuth(createGoal)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
