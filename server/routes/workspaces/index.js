import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function listWorkspaces(req, res) {
  const workspaces = await prisma.workspace.findMany({
    where: {
      group: {
        members: { some: { userId: req.user.id } },
      },
    },
    include: {
      group: { select: { id: true, name: true } },
      _count: { select: { subjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(workspaces);
}

async function createWorkspace(req, res) {
  const { groupId, name, description, examType, examYear } = req.body || {};

  if (!groupId || !name || !examType || !examYear) {
    res.status(400).json({ message: "groupId, name, examType and examYear are required" });
    return;
  }

  // Verify user is a member of the group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }

  const workspace = await prisma.workspace.create({
    data: { groupId, name, description, examType, examYear },
    include: { group: { select: { id: true, name: true } } },
  });

  res.status(201).json(workspace);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listWorkspaces)(req, res);
  if (req.method === "POST") return requireAuth(createWorkspace)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
