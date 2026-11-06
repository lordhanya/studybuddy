import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";
import {
  getActivityAccess,
  denyActivityAccess,
} from "../../lib/activityAccess.js";

async function handleComments(req, res) {
  const { activityId } = req.query;

  const access = await getActivityAccess(activityId, req.user.id);
  if (access.status !== "ok") {
    denyActivityAccess(res, access);
    return;
  }

  if (req.method === "GET") {
    const comments = await prisma.comment.findMany({
      where: { activityId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
    return;
  }

  if (req.method === "POST") {
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }
    const comment = await prisma.comment.create({
      data: { activityId, userId: req.user.id, content: content.trim() },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    res.status(201).json(comment);
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default async function handler(req, res) {
  if (req.method === "GET" || req.method === "POST") {
    return requireAuth(handleComments)(req, res);
  }
  res.status(405).json({ message: "Method not allowed" });
}
