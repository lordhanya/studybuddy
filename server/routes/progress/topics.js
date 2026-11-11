import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";
import { logActivity } from "../../lib/activityLog.js";

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "NEEDS_REVISION"];

async function checkTopicAccess(req, topicId) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      chapter: {
        include: {
          subject: { include: { workspace: true } },
        },
      },
    },
  });
  if (!topic) return null;
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: topic.chapter.subject.workspace.groupId, userId: req.user.id },
    },
  });
  return membership ? topic : null;
}

async function updateTopicProgress(req, res) {
  const { topicId } = req.query;
  const { status } = req.body || {};

  if (!topicId || !status) {
    res.status(400).json({ message: "topicId and status are required" });
    return;
  }
  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const topic = await checkTopicAccess(req, topicId);
  if (!topic) {
    res.status(403).json({ message: "Not a member of this topic's group" });
    return;
  }

  const progress = await prisma.topicProgress.upsert({
    where: { topicId_userId: { topicId, userId: req.user.id } },
    update: { status, completedAt: status === "COMPLETED" ? new Date() : null },
    create: { topicId, userId: req.user.id, status, completedAt: status === "COMPLETED" ? new Date() : null },
  });

  // Auto-log topic completion to the group feed.
  if (status === "COMPLETED") {
    try {
      await logActivity({
        userId: req.user.id,
        type: "TOPIC_COMPLETED",
        content: `Completed topic "${topic.name}"`,
        workspaceId: topic.chapter.subject.workspace.id,
        metadata: { topicId, chapterId: topic.chapterId },
      });
    } catch {
      // Never fail the progress update because feed logging failed.
    }
  }

  res.json(progress);
}

async function listProgress(req, res) {
  const { workspaceId } = req.query;
  if (!workspaceId) {
    res.status(400).json({ message: "workspaceId is required" });
    return;
  }
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

  const progress = await prisma.topicProgress.findMany({
    where: {
      userId: req.user.id,
      topic: { chapter: { subject: { workspaceId } } },
    },
    include: {
      topic: {
        include: {
          chapter: { include: { subject: true } },
        },
      },
    },
  });

  res.json(progress);
}

export default async function handler(req, res) {
  if (req.method === "POST") return requireAuth(updateTopicProgress)(req, res);
  if (req.method === "GET") return requireAuth(listProgress)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
