// src/services/user.service.ts
import { PrismaClient, Role } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

const superAdminService = {
  forceLogoutAll: async (id: string) => {
    logger.info(
      `[SUPER_ADMIN][forceLogoutAll] Start by super admin {"id": "${id}"}`
    );
    try {
      await prisma.user.updateMany({
        where: { id: { not: id }, deletedAt: null, isActive: true },
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

  forceLogoutUserById: async (ids: string[]) => {
    logger.info(
      `[SUPER_ADMIN][forceLogoutUserById] Start {"ids": "${ids.join(", ")}"}`
    );

    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[SUPER_ADMIN][forceLogoutUserById] Invalid ID(s)");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(
              `[SUPER_ADMIN][forceLogoutUserById] User not found for id: ${id}`
            );
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (user.deletedAt) {
            logger.warn(
              `[SUPER_ADMIN][forceLogoutUserById] User deleted for id: ${id}`
            );
            return { status: 400, message: errMsg.UserDeleted.message, id };
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
            id,
          };
        })
      );

      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[SUPER_ADMIN][forceLogoutUserById] Success - ${ids.length} users logged out`
      );
      return {
        status: 200,
        message: `ออกจากระบบของ ${ids.length} ผู้ใช้สำเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][forceLogoutUserById] Error:", err);
      throw error(500, err);
    }
  },

  softDeleteUserById: async (ids: string[]) => {
    logger.info(
      `[SUPER_ADMIN][softDeleteUserById] Start {"ids": "${ids.join(", ")}"}`
    );
    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[SUPER_ADMIN][softDeleteUser] InvalidId");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(
              `[SUPER_ADMIN][softDeleteUser] UserNotFound for id: ${id}`
            );
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (user.deletedAt) {
            logger.warn(
              `[SUPER_ADMIN][softDeleteUser] User deleted for id: ${id}`
            );
            return { status: 400, message: errMsg.UserDeleted.message, id };
          }

          await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
          });

          logger.info(`[SUPER_ADMIN][softDeleteUser] Success for id: ${id}`);
          return {
            status: 200,
            message: `ย้ายผู้ใช้งาน ${user.username} ไปถังขยะสำเร็จ`,
            id,
          };
        })
      );

      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[SUPER_ADMIN][softDeleteUser] Success - ${ids.length} users soft deleted`
      );
      return {
        status: 200,
        message: `ย้ายผู้ใช้งาน ${ids.length} รายไปถังขยะสำเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][softDeleteUser] Error:", err);
      throw error(500, err);
    }
  },

  hardDeleteUserById: async (ids: string[]) => {
    logger.info(
      `[SUPER_ADMIN][hardDeleteUserById] Start {"ids": "${ids.join(", ")}"}`
    );
    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[SUPER_ADMIN][hardDeleteUserById] InvalidId");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(
              `[SUPER_ADMIN][hardDeleteUserById] UserNotFound for id: ${id}`
            );
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (user.deletedAt) {
            logger.warn(
              `[SUPER_ADMIN][hardDeleteUserById] User deleted for id: ${id}`
            );
            return { status: 400, message: errMsg.UserDeleted.message, id };
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

          logger.info(
            `[SUPER_ADMIN][hardDeleteUserById] Success for id: ${id}`
          );
          return {
            status: 200,
            message: `ลบผู้ใช้งาน ${user.username} ถาวรสำเร็จ`,
            id,
          };
        })
      );

      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[SUPER_ADMIN][hardDeleteUserById] Success - ${ids.length} users hard deleted`
      );
      return {
        status: 200,
        message: `ลบผู้ใช้งาน ${ids.length} รายถาวรสำเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][hardDeleteUserById] Error:", err);
      throw error(500, err);
    }
  },

  restoreUser: async (ids: string[]) => {
    logger.info(
      `[SUPER_ADMIN][restoreUser] Start {"ids": "${ids.join(", ")}"}`
    );
    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[SUPER_ADMIN][restoreUser] Invalid ID(s)");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(
              `[SUPER_ADMIN][restoreUser] UserNotFound for id: ${id}`
            );
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (!user.deletedAt) {
            logger.warn(
              `[SUPER_ADMIN][restoreUser] UserNotDeleted for id: ${id}`
            );
            return { status: 400, message: errMsg.UserNotDeleted.message, id };
          }

          await prisma.user.update({
            where: { id },
            data: { deletedAt: null },
          });

          logger.info(`[SUPER_ADMIN][restoreUser] Success for id: ${id}`);
          return {
            status: 200,
            message: `กู้คืนผู้ใช้งาน ${user.username} สําเร็จ`,
            id,
          };
        })
      );

      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[SUPER_ADMIN][restoreUser] Success - ${ids.length} users restored`
      );
      return {
        status: 200,
        message: `กู้คืนผู้ใช้งาน ${ids.length} รายสำเร็จ`,
      };
    } catch (err) {
      logger.error("[SUPER_ADMIN][restoreUser] Error:", err);
      throw error(500, err);
    }
  },
  impersonateUser: async (adminId: string, userIdToImpersonate: string) => {
    logger.info(
      `[SUPER_ADMIN][impersonateUser] Admin ${adminId} impersonates ${userIdToImpersonate}`
    );

    // ตรวจสอบสิทธิ์ admin
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || !admin.roles.includes("ADMIN")) {
      logger.warn("[SUPER_ADMIN][impersonateUser] Unauthorized");
      return errMsg.Unauthorized;
    }

    // ตรวจสอบว่า user เป้าหมายมีอยู่จริง
    const targetUser = await prisma.user.findUnique({
      where: { id: userIdToImpersonate },
    });
    if (!targetUser) {
      logger.warn("[SUPER_ADMIN][impersonateUser] UserToImpersonateNotFound");
      return errMsg.UserNotFound;
    }

    // บันทึก log
    await prisma.impersonationLog.create({
      data: {
        adminId,
        impersonatedId: userIdToImpersonate,
      },
    });

    return {
      status: 200,
      message: "เข้าสู่ระบบแทนผู้ใช้สำเร็จ",
      data: {
        id: targetUser.id,
        roles: targetUser.roles,
        tokenVersion: targetUser.tokenVersion,
        impersonated: true,
        impersonatorId: adminId,
      },
    };
  },
};

export { superAdminService };
