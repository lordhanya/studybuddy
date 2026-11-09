import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getWorkspace(req, res) {
  const { id } = req.query;
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      group: { select: { id: true, name: true } },
      subjects: {
        include: {
          chapters: {
            include: {
              topics: { orderBy: { position: "asc" } },
            },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });
  if (!workspace) {
    res.status(404).json({ message: "Workspace not found" });
    return;
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: workspace.groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }
  res.json(workspace);
}

async function updateWorkspace(req, res) {
  const { id } = req.query;
  const { name, description, examType, examYear } = req.body || {};
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    res.status(404).json({ message: "Workspace not found" });
    return;
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: workspace.groupId, userId: req.user.id } },
  });
  if (!membership) {
    res.status(403).json({ message: "Not a member of this group" });
    return;
  }
  const updated = await prisma.workspace.update({
    where: { id },
    data: { name, description, examType, examYear },
  });
  res.json(updated);
}

async function deleteWorkspace(req, res) {
  const { id } = req.query;
  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    res.status(404).json({ message: "Workspace not found" });
    return;
  }
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: workspace.groupId, userId: req.user.id } },
  });
  if (!membership || membership.role !== "OWNER") {
    res.status(403).json({ message: "Only the group owner can delete a workspace" });
    return;
  }
  await prisma.workspace.delete({ where: { id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getWorkspace)(req, res);
  if (req.method === "PUT") return requireAuth(updateWorkspace)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteWorkspace)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
