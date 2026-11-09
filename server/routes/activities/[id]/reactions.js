import { prisma } from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/middleware.js";
import {
  getActivityAccess,
  denyActivityAccess,
} from "../../../lib/activityAccess.js";

async function handleReactions(req, res) {
  const { id } = req.query;

  const access = await getActivityAccess(id, req.user.id);
  if (access.status !== "ok") {
    denyActivityAccess(res, access);
    return;
  }

  if (req.method === "GET") {
    const reactions = await prisma.reaction.findMany({
      where: { activityId: id },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(reactions);
    return;
  }

  if (req.method === "POST") {
    const { type } = req.body || {};
    if (!type) {
      res.status(400).json({ message: "Reaction type is required" });
      return;
    }
    // Toggle: remove if user already reacted with same type, else add/update
    const existing = await prisma.reaction.findUnique({
      where: {
        activityId_userId_type: { activityId: id, userId: req.user.id, type },
      },
    });
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      res.json({ ok: true, removed: true });
    } else {
      // Remove any other reaction type by this user on this activity (one reaction per user)
      await prisma.reaction.deleteMany({
        where: { activityId: id, userId: req.user.id },
      });
      const reaction = await prisma.reaction.create({
        data: { activityId: id, userId: req.user.id, type },
        include: { user: { select: { id: true, fullName: true } } },
      });
      res.status(201).json(reaction);
    }
    return;
  }

  res.status(405).json({ message: "Method not allowed" });
}

export default async function handler(req, res) {
  if (req.method === "GET" || req.method === "POST") {
    return requireAuth(handleReactions)(req, res);
  }
  res.status(405).json({ message: "Method not allowed" });
}
