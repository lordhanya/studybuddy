import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/middleware.js";
import {
  getActivityAccess,
  denyActivityAccess,
} from "../lib/activityAccess.js";

async function getActivity(req, res) {
  const { id } = req.query;

  const access = await getActivityAccess(id, req.user.id);
  if (access.status !== "ok") {
    denyActivityAccess(res, access);
    return;
  }

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      reactions: { include: { user: { select: { id: true, fullName: true } } } },
      comments: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  res.json(activity);
}

async function deleteActivity(req, res) {
  const { id } = req.query;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) {
    res.status(404).json({ message: "Activity not found" });
    return;
  }
  if (activity.userId !== req.user.id) {
    res.status(403).json({ message: "You can only delete your own activities" });
    return;
  }
  await prisma.activity.delete({ where: { id } });
  res.json({ ok: true });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(getActivity)(req, res);
  if (req.method === "DELETE") return requireAuth(deleteActivity)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
