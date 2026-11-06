import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";

async function checkChapterAccess(req, chapterId) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      subject: { include: { workspace: true } },
    },
  });
  if (!chapter) return null;
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: chapter.subject.workspace.groupId, userId: req.user.id } },
  });
  return membership ? chapter : null;
}

async function listTopics(req, res) {
  const { chapterId } = req.query;
  if (!chapterId) {
    res.status(400).json({ message: "chapterId is required" });
    return;
  }
  const chapter = await checkChapterAccess(req, chapterId);
  if (!chapter) {
    res.status(403).json({ message: "Not a member of this chapter's group" });
    return;
  }
  const topics = await prisma.topic.findMany({
    where: { chapterId },
    orderBy: { position: "asc" },
  });
  res.json(topics);
}

async function createTopic(req, res) {
  const { chapterId, name, description, position } = req.body || {};
  if (!chapterId || !name) {
    res.status(400).json({ message: "chapterId and name are required" });
    return;
  }
  const chapter = await checkChapterAccess(req, chapterId);
  if (!chapter) {
    res.status(403).json({ message: "Not a member of this chapter's group" });
    return;
  }
  const maxPos = await prisma.topic.aggregate({
    where: { chapterId },
    _max: { position: true },
  });
  const topic = await prisma.topic.create({
    data: {
      chapterId,
      name,
      description,
      position: position != null ? position : (maxPos._max.position || 0) + 1,
    },
  });
  res.status(201).json(topic);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listTopics)(req, res);
  if (req.method === "POST") return requireAuth(createTopic)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
