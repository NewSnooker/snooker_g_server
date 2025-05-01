// src/services/user.service.ts
import { PrismaClient, Role } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

const superAdminService = {
  forceLogoutAll: async (id: string) => {
    logger.info(`[SUPER_ADMIN][forceLogoutAll] Start by {"id": "${id}"}`);
    try {
      await prisma.user.updateMany({
        where: { id: { not: id } },
        data: { tokenVersion: { increment: 1 } },
      });

      logger.info("[SUPER_ADMIN][forceLogoutAll] Success");
      return {
        status: 200,
        message: "บังคับให้ออกจากระบบสําเร็จ",
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][forceLogoutAll] Error:", err);
      throw error(500, err);
    }
  },
  forceLogoutUserById: async (id: string) => {
    logger.info(`[SUPER_ADMIN][forceLogoutUserById] Start {"id": "${id}"}`);

    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[SUPER_ADMIN][forceLogoutUserById] Invalid ID");
        return errMsg.InvalidId;
      }
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[SUPER_ADMIN][forceLogoutUserById] User not found");
        return errMsg.UserNotFound;
      }

      await prisma.user.update({
        where: { id },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      logger.info(
        `[SUPER_ADMIN][forceLogoutUserById] Success - ${user.username} logged out`
      );
      return {
        status: 200,
        message: `ออกจากระบบของ ${user.username} สําเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][forceLogoutUserById] Error:", err);
      throw error(500, err);
    }
  },
  softDeleteUserById: async (id: string) => {
    logger.info(`[SUPER_ADMIN][softDeleteUserById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[SUPER_ADMIN][softDeleteUser] InvalidId");
        return errMsg.InvalidId;
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[SUPER_ADMIN][softDeleteUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      await prisma.user.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      logger.info("[SUPER_ADMIN][softDeleteUser] Success");
      return {
        status: 200,
        message: `ย้ายผู้ใช้งาน ${user.username} ไปถังขยะสำเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][softDeleteUser] Error:", err);
      throw err;
    }
  },
  hardDeleteUserById: async (id: string) => {
    logger.info(`[ADMIN][hardDeleteUserById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[ADMIN][hardDeleteUserById] InvalidId");
        return errMsg.InvalidId;
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[ADMIN][hardDeleteUserById] UserNotFound");
        return errMsg.UserNotFound;
      }

      await prisma.$transaction(async (tx) => {
        await tx.review.deleteMany({ where: { userId: id } });
        await tx.userGameInteraction.deleteMany({ where: { userId: id } });
        await tx.gameScore.deleteMany({ where: { userId: id } });
        await tx.savedGame.deleteMany({ where: { userId: id } });
        await tx.gameRoom.deleteMany({ where: { hostId: id } });
        await tx.roomPlayer.deleteMany({ where: { userId: id } });
        await tx.gameInvite.deleteMany({ where: { inviterId: id } });
        await tx.gameInvite.deleteMany({ where: { inviteeId: id } });
        await tx.user.delete({ where: { id } });
      });

      logger.info("[ADMIN][hardDeleteUserById] Success");
      return {
        status: 200,
        message: `ลบผู้ใช้งาน ${user.username} ถาวรสำเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][hardDeleteUserById] Error:", err);
      throw error(500, err);
    }
  },
  restoreUser: async (id: string) => {
    logger.info(`[SUPER_ADMIN][restoreUser] Start {"id": "${id}"}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[SUPER_ADMIN][restoreUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      if (!user.deletedAt) {
        logger.warn("[SUPER_ADMIN][restoreUser] UserNotDeleted");
        return errMsg.UserNotDeleted;
      }

      await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      logger.info("[SUPER_ADMIN][restoreUser] Success");
      return {
        status: 200,
        message: `กู้คืนผู้ใช้งาน ${user.username} สําเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][restoreUser] Error:", err);
      throw err;
    }
  },
};

export { superAdminService };
