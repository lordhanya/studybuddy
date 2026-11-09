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
  if (duration !== undefined) data.duration = duration;
  if (startedAt !== undefined) data.startedAt = new Date(startedAt);
  if (endedAt !== undefined) data.endedAt = endedAt ? new Date(endedAt) : null;

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
