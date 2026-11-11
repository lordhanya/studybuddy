import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

const VALID_PERIODS = ["MORNING", "EVENING"];

// GET /api/dailyUpdates?groupId=&date=&period=
async function listDailyUpdates(req, res) {
  const { groupId, date, period, userId } = req.query;

  if (!groupId) {
    res.status(400).json({ message: "groupId is required" });
    return;
  }

  // Verify membership.
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }

  const where = { groupId };
  if (date) where.date = date;
  if (period && VALID_PERIODS.includes(period)) where.period = period;
  if (userId) where.userId = userId;

  const updates = await prisma.dailyUpdate.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true } },
    },
    orderBy: [{ date: "desc" }, { period: "asc" }, { createdAt: "desc" }],
  });

  res.json(updates);
}

// POST /api/dailyUpdates  (upsert: create or update my update for today)
async function upsertDailyUpdate(req, res) {
  const { groupId, date, period, studying, plan, completed, workspaceId } =
    req.body || {};

  if (!groupId || !date || !period) {
    res.status(400).json({ message: "groupId, date and period are required" });
    return;
  }
  if (!VALID_PERIODS.includes(period)) {
    res.status(400).json({ message: "period must be MORNING or EVENING" });
    return;
  }
  // At least one field must be provided.
  if (
    !studying &&
    !plan &&
    !completed &&
    (studying === undefined || studying === "") &&
    (plan === undefined || plan === "") &&
    (completed === undefined || completed === "")
  ) {
    res.status(400).json({ message: "Provide at least one of studying, plan or completed" });
    return;
  }

  // Verify membership.
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }

  let workspaceIdFinal = workspaceId || null;
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }
    const wsMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: ws.groupId, userId: req.user.id } },
    });
    if (!wsMembership) {
      res.status(403).json({ message: "Not a member of this workspace's group" });
      return;
    }
    workspaceIdFinal = ws.id;
  }

  const existing = await prisma.dailyUpdate.findFirst({
    where: { userId: req.user.id, groupId, date, period },
  });

  let update;
  if (existing) {
    update = await prisma.dailyUpdate.update({
      where: { id: existing.id },
      data: {
        studying: studying !== undefined ? (studying || null) : existing.studying,
        plan: plan !== undefined ? (plan || null) : existing.plan,
        completed: completed !== undefined ? (completed || null) : existing.completed,
        workspaceId: workspaceIdFinal,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });
  } else {
    update = await prisma.dailyUpdate.create({
      data: {
        userId: req.user.id,
        groupId,
        date,
        period,
        studying: studying || null,
        plan: plan || null,
        completed: completed || null,
        workspaceId: workspaceIdFinal,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });
  }

  res.status(201).json(update);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listDailyUpdates)(req, res);
  if (req.method === "POST") return requireAuth(upsertDailyUpdate)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
