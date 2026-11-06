import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

async function listSessions(req, res) {
  const { workspaceId, limit } = req.query;
  let where = { userId: req.user.id };
  if (workspaceId) where.workspaceId = workspaceId;

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

  const sessions = await prisma.studySession.findMany({
    where,
    include: { workspace: { select: { id: true, name: true } } },
    orderBy: { startedAt: "desc" },
    take: limit ? Math.min(parseInt(limit, 10), 100) : 50,
  });

  res.json(sessions);
}

async function createSession(req, res) {
  const { workspaceId, duration, startedAt, endedAt } = req.body || {};

  if (!duration || duration <= 0) {
    res.status(400).json({ message: "Valid duration (minutes) is required" });
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

  const session = await prisma.studySession.create({
    data: {
      userId: req.user.id,
      workspaceId: workspaceIdFinal,
      duration,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      endedAt: endedAt ? new Date(endedAt) : null,
    },
    include: { workspace: { select: { id: true, name: true } } },
  });

  res.status(201).json(session);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listSessions)(req, res);
  if (req.method === "POST") return requireAuth(createSession)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
