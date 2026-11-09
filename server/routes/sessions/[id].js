import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function getSession(req, res) {
  const { id } = req.query;
  const session = await prisma.studySession.findUnique({
    where: { id },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return;
  }
  if (session.userId !== req.user.id) {
    res.status(403).json({ message: "You can only access your own sessions" });
    return;
  }
  res.json(session);
}

async function updateSession(req, res) {
  const { id } = req.query;
  const { duration, startedAt, endedAt } = req.body || {};

  const session = await prisma.studySession.findUnique({ where: { id } });
  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return;
  }
  if (session.userId !== req.user.id) {
    res.status(403).json({ message: "You can only update your own sessions" });
    return;
  }

  const data = {};
  if (duration !== undefined) {
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      res.status(400).json({ message: "Valid duration (minutes) is required" });
      return;
    }
    data.duration = Math.round(minutes);
  }
  if (startedAt !== undefined) {
    if (startedAt === null || startedAt === "") {
      res.status(400).json({ message: "Start time is required" });
      return;
    }
    const start = new Date(startedAt);
    if (Number.isNaN(start.getTime())) {
      res.status(400).json({ message: "Invalid start time" });
      return;
    }
    data.startedAt = start;
  }
  if (endedAt !== undefined) {
    if (endedAt === null || endedAt === "") {
      data.endedAt = null;
    } else {
      const end = new Date(endedAt);
      if (Number.isNaN(end.getTime())) {
        res.status(400).json({ message: "Invalid end time" });
        return;
      }
      data.endedAt = end;
    }
  }

  const updated = await prisma.studySession.update({ where: { id }, data, include: { workspace: { select: { id: true, name: true } } } });
  res.json(updated);
}

async function deleteSession(req, res) {
  const { id } = req.query;
  const session = await prisma.studySession.findUnique({ where: { id } });
  if (!session) {
    res.status(404).json({ message: "Session not found" });
    return;
  }
  if (session.userId !== req.user.id) {
    res.status(403).json({ message: "You can only delete your own sessions" });
    return;
  }
  await prisma.studySession.delete({ where: { id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getSession)(req, res);
  if (req.method === "PUT") return requireAuth(updateSession)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteSession)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
