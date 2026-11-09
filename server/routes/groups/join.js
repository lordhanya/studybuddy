import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  return requireAuth(async (req, res) => {
    try {
      const inviteCode = String(req.body?.inviteCode || "").trim().toUpperCase();
      if (!inviteCode) {
        res.status(400).json({ message: "Invite code is required" });
        return;
      }

      const group = await prisma.studyGroup.findUnique({ where: { inviteCode } });
      if (!group) {
        res.status(404).json({ message: "Invalid invite code" });
        return;
      }

      const existing = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: group.id, userId: req.user.id } },
      });
      if (existing) {
        res.status(409).json({ message: "Already a member of this group" });
        return;
      }

      await prisma.groupMember.create({
        data: { groupId: group.id, userId: req.user.id, role: "MEMBER" },
      });

      res.json({
        id: group.id,
        name: group.name,
        description: group.description,
        role: "MEMBER",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to join group" });
    }
  })(req, res);
}
