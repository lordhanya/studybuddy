import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function checkWorkspaceAccess(req, workspaceId) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) return null;
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: workspace.groupId, userId: req.user.id } },
  });
  return membership ? workspace : null;
}

async function listSubjects(req, res) {
  const { workspaceId } = req.query;
  if (!workspaceId) {
    res.status(400).json({ message: "workspaceId is required" });
    return;
  }
  const ws = await checkWorkspaceAccess(req, workspaceId);
  if (!ws) {
    res.status(403).json({ message: "Not a member of this workspace's group" });
    return;
  }
  const subjects = await prisma.subject.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { chapters: true } },
      chapters: {
        include: {
          _count: { select: { topics: true } },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { position: "asc" },
  });
  res.json(subjects);
}

async function createSubject(req, res) {
  const { workspaceId, name, description, position } = req.body || {};
  if (!workspaceId || !name) {
    res.status(400).json({ message: "workspaceId and name are required" });
    return;
  }
  const ws = await checkWorkspaceAccess(req, workspaceId);
  if (!ws) {
    res.status(403).json({ message: "Not a member of this workspace's group" });
    return;
  }
  const maxPos = await prisma.subject.aggregate({
    where: { workspaceId },
    _max: { position: true },
  });
  const subject = await prisma.subject.create({
    data: {
      workspaceId,
      name,
      description,
      position: position != null ? position : (maxPos._max.position || 0) + 1,
    },
  });
  res.status(201).json(subject);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listSubjects)(req, res);
  if (req.method === "POST") return requireAuth(createSubject)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
