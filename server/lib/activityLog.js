import { prisma } from "./prisma.js";

/**
 * Resolve the groupId for an activity. If a workspaceId is given, the group is
 * derived from the workspace. Falls back to the explicitly provided groupId.
 */
async function resolveGroupId({ groupId, workspaceId }) {
  if (groupId) return groupId;
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { groupId: true },
    });
    return ws ? ws.groupId : null;
  }
  return null;
}

/**
 * Write an activity to the group feed from a real user action.
 *
 * @param {object} params
 * @param {string} params.userId - actor
 * @param {import("@prisma/client").ActivityType} params.type
 * @param {string} params.content - human-readable feed text
 * @param {string} [params.groupId] - explicit group scope
 * @param {string} [params.workspaceId] - used to derive groupId if groupId omitted
 * @param {object} [params.metadata]
 * @param {string} [params.activityId] - optional id of the source record (test/session/etc.)
 */
export async function logActivity({
  userId,
  type,
  content,
  groupId,
  workspaceId,
  metadata = {},
  activityId,
}) {
  const resolvedGroupId = await resolveGroupId({ groupId, workspaceId });

  // Activities with no group scope stay private to the author (existing behavior).
  if (!resolvedGroupId) {
    return prisma.activity.create({
      data: {
        userId,
        type,
        content,
        groupId: null,
        workspaceId: workspaceId || null,
        metadata: { ...metadata, activityId },
      },
    });
  }

  return prisma.activity.create({
    data: {
      groupId: resolvedGroupId,
      userId,
      type,
      content,
      workspaceId: workspaceId || null,
      metadata: { ...metadata, activityId },
    },
  });
}

export { resolveGroupId };
