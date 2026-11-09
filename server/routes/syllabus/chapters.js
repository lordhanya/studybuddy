import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function checkSubjectAccess(req, subjectId) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { workspace: true },
  });
  if (!subject) return null;
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: subject.workspace.groupId, userId: req.user.id } },
  });
  return membership ? subject : null;
}

async function listChapters(req, res) {
  const { subjectId } = req.query;
  if (!subjectId) {
    res.status(400).json({ message: "subjectId is required" });
    return;
  }
  const subject = await checkSubjectAccess(req, subjectId);
  if (!subject) {
    res.status(403).json({ message: "Not a member of this subject's group" });
    return;
  }
  const chapters = await prisma.chapter.findMany({
    where: { subjectId },
    include: {
      _count: { select: { topics: true } },
      topics: { orderBy: { position: "asc" } },
    },
    orderBy: { position: "asc" },
  });
  res.json(chapters);
}

async function createChapter(req, res) {
  const { subjectId, name, description, position } = req.body || {};
  const cleanName = String(name || "").trim();
  if (!subjectId || !cleanName) {
    res.status(400).json({ message: "subjectId and name are required" });
    return;
  }
  const subject = await checkSubjectAccess(req, subjectId);
  if (!subject) {
    res.status(403).json({ message: "Not a member of this subject's group" });
    return;
  }
  const maxPos = await prisma.chapter.aggregate({
    where: { subjectId },
    _max: { position: true },
  });
  const chapter = await prisma.chapter.create({
    data: {
      subjectId,
      name: cleanName,
      description: String(description || "").trim() || null,
      position: position != null ? position : (maxPos._max.position || 0) + 1,
    },
  });
  res.status(201).json(chapter);
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listChapters)(req, res);
  if (req.method === "POST") return requireAuth(createChapter)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
