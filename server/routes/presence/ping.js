import { prisma } from "../../../lib/prisma.js";
import { requireAuth } from "../../../lib/middleware.js";

// POST /api/presence/ping  — heartbeat; updates lastSeenAt for all groups of the user.
// Throttled client-side (max once per minute) to avoid hammering the DB.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  return requireAuth(async (req, res) => {
    try {
      const now = new Date();

      const memberships = await prisma.groupMember.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });

      await prisma.$transaction(
        memberships.map((m) =>
          prisma.groupMember.update({
            where: { id: m.id },
            data: { lastSeenAt: now },
          })
        )
      );

      res.json({ ok: true, lastSeenAt: now });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update presence" });
    }
  })(req, res);
}
