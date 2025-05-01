// src/prisma/jobs/cleanupJob.ts
import cron from "node-cron";
import { prisma } from "../client";
import { logger } from "../../utils/logger";

export function startCleanupJob() {
  // รันทุกวันเวลาเที่ยงคืน (0:00)
  cron.schedule("0 0 * * *", async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deletedUsers = await prisma.user.findMany({
        where: {
          deletedAt: { lt: sevenDaysAgo },
        },
        select: { id: true, username: true },
      });

      if (deletedUsers.length === 0) {
        logger.info("[CleanupJob] No users to permanently delete");
        return;
      }

      const userIds = deletedUsers.map((user) => user.id);

      await prisma.$transaction(async (tx) => {
        // ลบข้อมูลที่เกี่ยวข้อง
        await tx.review.deleteMany({ where: { userId: { in: userIds } } });
        await tx.userGameInteraction.deleteMany({
          where: { userId: { in: userIds } },
        });
        await tx.gameScore.deleteMany({ where: { userId: { in: userIds } } });
        await tx.savedGame.deleteMany({ where: { userId: { in: userIds } } });
        await tx.gameRoom.deleteMany({ where: { hostId: { in: userIds } } });
        await tx.roomPlayer.deleteMany({ where: { userId: { in: userIds } } });
        await tx.gameInvite.deleteMany({
          where: { inviterId: { in: userIds } },
        });
        await tx.gameInvite.deleteMany({
          where: { inviteeId: { in: userIds } },
        });
        // ลบ user
        await tx.user.deleteMany({
          where: { id: { in: userIds } },
        });
      });

      logger.info(
        `[CleanupJob] Permanently deleted ${
          deletedUsers.length
        } users: ${deletedUsers.map((u) => u.username).join(", ")}`
      );
    } catch (error) {
      logger.error("[CleanupJob] Error during cleanup:", error);
    }
  });

  logger.info("[CleanupJob] Started cleanup job for soft-deleted users");
}
