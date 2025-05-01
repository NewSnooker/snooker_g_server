// src/services/user.service.ts
import { PrismaClient, Role } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";
import { hasAdminRole, hasSuperAdminRole } from "@/utils/auth";

const prisma = new PrismaClient();

const adminService = {
  getAllUsersPaginated: async (page: number, limit: number) => {
    logger.info(
      `[USER][getAllUsersPaginated] Start {"page": "${page}", "limit": "${limit}"}`
    );
    try {
      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
            roles: true,
            tokenVersion: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count(),
      ]);

      if (users.length === 0) {
        logger.warn("[USER][getAllUsersPaginated] UserNotFound");
        return errMsg.UserNotFound;
      }
      logger.info("[USER][getAllUsersPaginated] Success");

      return {
        status: 200,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      logger.error("[USER][getAllUsersPaginated] Error:", err);
      throw error(500, err);
    }
  },
  forceLogoutUserById: async (id: string) => {
    logger.info(`[ADMIN][forceLogoutUserById] Start {"id": "${id}"}`);

    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[ADMIN][forceLogoutUserById] Invalid ID");
        return errMsg.InvalidId;
      }
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[ADMIN][forceLogoutUserById] User not found");
        return errMsg.UserNotFound;
      }
      const isAdmin = hasAdminRole(user.roles);
      const isSuperAdmin = hasSuperAdminRole(user.roles);

      if (isAdmin || isSuperAdmin) {
        logger.warn(
          "[ADMIN][forceLogoutUserById] Forbidden - Admin/SuperAdmin cannot be logged out"
        );
        return errMsg.Forbidden;
      }

      await prisma.user.update({
        where: { id },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      logger.info(
        `[ADMIN][forceLogoutUserById] Success - ${user.username} logged out`
      );
      return {
        status: 200,
        message: `ออกจากระบบของ ${user.username} สําเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][forceLogoutUserById] Error:", err);
      throw error(500, err);
    }
  },
  softDeleteUserById: async (id: string) => {
    logger.info(`[ADMIN][softDeleteUserById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[ADMIN][softDeleteUser] InvalidId");
        return errMsg.InvalidId;
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[ADMIN][softDeleteUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      await prisma.user.update({
        where: { id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      logger.info("[ADMIN][softDeleteUser] Success");
      return {
        status: 200,
        message: `ย้ายผู้ใช้งาน ${user.username} ไปถังขยะสำเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][softDeleteUser] Error:", err);
      throw err;
    }
  },
  restoreUser: async (id: string) => {
    logger.info(`[ADMIN][restoreUser] Start {"id": "${id}"}`);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[ADMIN][restoreUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      if (!user.deletedAt) {
        logger.warn("[ADMIN][restoreUser] UserNotDeleted");
        return errMsg.UserNotDeleted;
      }
      const isAdmin = hasAdminRole(user.roles);
      const isSuperAdmin = hasSuperAdminRole(user.roles);

      if (isAdmin || isSuperAdmin) {
        logger.warn(
          "[ADMIN][restoreUser] Forbidden - Admin/SuperAdmin cannot be restored"
        );
        return errMsg.Forbidden;
      }

      await prisma.user.update({
        where: { id },
        data: { deletedAt: null },
      });
      logger.info("[ADMIN][restoreUser] Success");
      return {
        status: 200,
        message: `กู้คืนผู้ใช้งาน ${user.username} สําเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][restoreUser] Error:", err);
      throw err;
    }
  },
};

export { adminService };
