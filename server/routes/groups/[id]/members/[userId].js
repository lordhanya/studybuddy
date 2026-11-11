import { prisma } from "../../../../lib/prisma.js";
import { requireAuth } from "../../../../lib/middleware.js";

// DELETE /api/groups/:groupId/members/:userId  — owner/admin removes a member
export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  return requireAuth(async (req, res) => {
    const { groupId, userId } = req.query;

    const group = await prisma.studyGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      res.status(404).json({ message: "Group not found" });
      return;
    }

    const requester = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: req.user.id } },
    });
    if (!requester) {
      res.status(403).json({ message: "Not a member of this group" });
      return;
    }

    if (requester.role !== "OWNER" && requester.role !== "ADMIN") {
      res.status(403).json({ message: "Only owner or admin can remove members" });
      return;
    }

    const target = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!target) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (target.role === "OWNER") {
      res.status(400).json({ message: "Cannot remove the group owner" });
      return;
    }

    if (target.userId === req.user.id) {
      res.status(400).json({ message: "Use exit group to leave yourself" });
      return;
    }

    await prisma.groupMember.delete({ where: { id: target.id } });
    res.json({ ok: true });
  })(req, res);
}
