import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

const VALID_TYPES = [
  "TOPIC_COMPLETED",
  "CHAPTER_COMPLETED",
  "STUDY_SESSION",
  "MOCK_TEST",
  "DAILY_UPDATE",
  "GOAL_ACHIEVED",
  "MEMBER_JOINED",
];

async function listActivities(req, res) {
  const { groupId, workspaceId, type, limit } = req.query;

  // Require at least a group or workspace to scope the feed
  if (!groupId && !workspaceId) {
    res.status(400).json({ message: "groupId or workspaceId is required" });
    return;
  }

  // Verify membership if groupId provided
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
    });
    if (!membership) {
      res.status(403).json({ message: "Not a member of this group" });
      return;
    }
  }

  // Verify membership if workspaceId provided
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

  const where = {};
  if (groupId) where.groupId = groupId;
  if (workspaceId) where.workspaceId = workspaceId;
  if (type && VALID_TYPES.includes(type)) where.type = type;

  const activities = await prisma.activity.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      reactions: { include: { user: { select: { id: true, fullName: true } } } },
      comments: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit ? Math.min(parseInt(limit, 10), 100) : 50,
  });

  res.json(activities);
}

async function createActivity(req, res) {
  const { groupId, userId, workspaceId, type, content, metadata } = req.body || {};

  if (!type || !VALID_TYPES.includes(type)) {
    res.status(400).json({ message: "Valid activity type is required" });
    return;
  }
  if (!content) {
    res.status(400).json({ message: "Content is required" });
    return;
  }
  // Use the authenticated user unless explicitly overriding (not allowed here)
  const actorId = req.user.id;

  // Verify group membership if groupId provided
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: actorId } },
    });
    if (!membership) {
      res.status(403).json({ message: "Not a member of this group" });
      return;
    }
  }

  // Verify workspace membership if workspaceId provided
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) {
      res.status(404).json({ message: "Workspace not found" });
      return;
    }
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: ws.groupId, userId: actorId } },
    });
    if (!membership) {
      res.status(403).json({ message: "Not a member of this workspace's group" });
      return;
    }
  }

  const activity = await prisma.activity.create({
    data: {
      groupId: groupId || null,
      userId: actorId,
      workspaceId: workspaceId || null,
      type,
      content,
      metadata: metadata || {},
    },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      reactions: true,
      comments: true,
    },
  });

  res.status(201).json(activity);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listActivities)(req, res);
  if (req.method === "POST") return requireAuth(createActivity)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
