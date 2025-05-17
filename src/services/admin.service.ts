// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";
import {
  denyIfAdminOrSuperAdmin,
  hasAdminRole,
  hasSuperAdminRole,
} from "@/utils/auth";

const prisma = new PrismaClient();

const adminService = {
  getAllUsersPaginated: async (
    page: number,
    pageSize: number,
    search?: string,
    roles?: string[],
    isActive?: boolean,
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ) => {
    logger.info(
      `[ADMIN][getAllUsersPaginated] Start {"page": "${page}", "pageSize": "${pageSize}", "search": "${search}", "role": "${roles}", "isActive": "${isActive}", "sortBy": "${sortBy}", "sortOrder": "${sortOrder}"}`
    );

    try {
      const skip = (page - 1) * pageSize;

      // สร้าง where clause ตามเงื่อนไขการกรอง
      const where: any = { deletedAt: null };

      // เพิ่มเงื่อนไขการค้นหา
      if (search) {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (roles && roles.length > 0) {
        where.roles = { hasSome: roles };
      }

      // เพิ่มเงื่อนไขการกรองตามสถานะ
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // สร้าง orderBy clause
      const orderBy: any = {};
      if (sortBy) {
        orderBy[sortBy] = sortOrder || "asc";
      } else {
        // ค่าเริ่มต้นคือเรียงตาม createdAt จากใหม่ไปเก่า
        orderBy.createdAt = "desc";
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: pageSize,
          where,
          orderBy,
          select: {
            id: true,
            username: true,
            email: true,
            provider: true,
            imageId: true,
            image: true,
            tokenVersion: true,
            roles: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      if (users.length === 0) {
        logger.warn("[ADMIN][getAllUsersPaginated] UserNotFound");
        return errMsg.UserNotFound;
      }

      logger.info("[ADMIN][getAllUsersPaginated] Success");

      return {
        status: 200,
        data: users,
        pageCount: Math.ceil(total / pageSize),
        total,
      };
    } catch (err) {
      logger.error("[ADMIN][getAllUsersPaginated] Error:", err);
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

      if (user.deletedAt) {
        logger.warn("[ADMIN][forceLogoutUserById] User deleted");
        return errMsg.UserDeleted;
      }

      // ป้องกันการ logout Admin/SuperAdmin
      denyIfAdminOrSuperAdmin(user.roles);

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
        where: { id, deletedAt: null },
      });

      if (!user) {
        logger.warn("[ADMIN][softDeleteUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      if (user.deletedAt) {
        logger.warn("[ADMIN][softDeleteUser] User deleted");
        return errMsg.UserDeleted;
      }

      // ป้องกันการ soft delete Admin/SuperAdmin
      denyIfAdminOrSuperAdmin(user.roles);

      await prisma.user.update({
        where: { id },
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

      // ป้องกันการ restore Admin/SuperAdmin
      denyIfAdminOrSuperAdmin(user.roles);

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
