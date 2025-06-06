// src/services/user.service.ts
import { AuthProvider, PrismaClient, Role } from "@prisma/client";
import { error, Static } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";
import { hasAdminOrSuperAdminRole, validateRoles } from "@/utils/auth";
import { isAfter } from "date-fns";
import { userBodySchema, userUpdateBodySchema } from "@/schema/user.schema";
import { SALT_ROUNDS } from "@/config/constant";
import { commonService } from "./common.service";
import bcrypt from "bcrypt";
import { imageBodySchema } from "@/schema/common.schema";

const prisma = new PrismaClient();

const adminService = {
  getAllUsersPaginated: async (
    page: number,
    pageSize: number,
    search?: string,
    roles?: string[],
    isActive?: boolean,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
    createdAtStart?: string,
    createdAtEnd?: string
  ) => {
    logger.info(
      `[ADMIN][getAllUsersPaginated] Start {"page": "${page}", "pageSize": "${pageSize}", "search": "${search}", "roles": "${roles}", "isActive": "${isActive}", "sortBy": "${sortBy}", "sortOrder": "${sortOrder}", "createdAtStart": "${createdAtStart}", "createdAtEnd": "${createdAtEnd}"}`
    );

    try {
      const skip = (page - 1) * pageSize;

      // Validation for createdAt
      if (createdAtStart || createdAtEnd) {
        const startDate = createdAtStart ? new Date(createdAtStart) : undefined;
        const endDate = createdAtEnd ? new Date(createdAtEnd) : undefined;

        if (startDate && isNaN(startDate.getTime())) {
          throw error(
            400,
            `Invalid createdAtStart date format: ${createdAtStart}`
          );
        }
        if (endDate && isNaN(endDate.getTime())) {
          throw error(400, `Invalid createdAtEnd date format: ${createdAtEnd}`);
        }
        if (startDate && endDate && isAfter(startDate, endDate)) {
          throw error(400, "createdAtStart must be before createdAtEnd");
        }
      }

      // Validation for roles
      if (roles && roles.length > 0) {
        validateRoles(roles as Role[]);
      }

      // Validation for isActive
      if (isActive !== undefined && typeof isActive !== "boolean") {
        throw error(400, "isActive must be true or false");
      }

      const where: any = { deletedAt: null };

      if (search) {
        where.OR = [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

      if (roles && roles.length > 0) {
        where.roles = { hasSome: roles };
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (createdAtStart || createdAtEnd) {
        where.createdAt = {};
        if (createdAtStart && !isNaN(new Date(createdAtStart).getTime())) {
          where.createdAt.gte = new Date(createdAtStart);
        }
        if (createdAtEnd && !isNaN(new Date(createdAtEnd).getTime())) {
          where.createdAt.lte = new Date(createdAtEnd);
        }
        if (!where.createdAt.gte && !where.createdAt.lte) {
          delete where.createdAt;
        }
      }

      const orderBy: any = {};
      if (sortBy) {
        orderBy[sortBy] = sortOrder || "asc";
      } else {
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
  forceLogoutUserById: async (ids: string[]) => {
    logger.info(
      `[ADMIN][forceLogoutUserById] Start {"ids": "${ids.join(", ")}"}`
    );

    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[ADMIN][forceLogoutUserById] Invalid ID(s)");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(
              `[ADMIN][forceLogoutUserById] User not found for id: ${id}`
            );
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (user.deletedAt) {
            logger.warn(
              `[ADMIN][forceLogoutUserById] User deleted for id: ${id}`
            );
            return { status: 400, message: errMsg.UserDeleted.message, id };
          }

          // ป้องกันการ logout Admin/SuperAdmin
          const denyResponse = hasAdminOrSuperAdminRole(user.roles);
          if (denyResponse) {
            logger.warn(
              `[ADMIN][forceLogoutUserById] AdminCannotLogout for id: ${id}`
            );
            return {
              status: 403,
              message: errMsg.AdminCannotLogout.message,
              id,
            };
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
            id,
          };
        })
      );

      // ตรวจสอบว่ามี error หรือไม่
      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[ADMIN][forceLogoutUserById] Success - ${ids.length} users logged out`
      );
      return {
        status: 200,
        message: `ออกจากระบบของ ${ids.length} ผู้ใช้สำเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][forceLogoutUserById] Error:", err);
      throw error(500, err);
    }
  },
  softDeleteUserById: async (ids: string[]) => {
    logger.info(
      `[ADMIN][softDeleteUserById] Start {"ids": "${ids.join(", ")}"}`
    );
    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[ADMIN][softDeleteUser] InvalidId");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id, deletedAt: null },
          });

          if (!user) {
            logger.warn(`[ADMIN][softDeleteUser] UserNotFound for id: ${id}`);
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (user.deletedAt) {
            logger.warn(`[ADMIN][softDeleteUser] User deleted for id: ${id}`);
            return { status: 400, message: errMsg.UserDeleted.message, id };
          }

          // ป้องกันการ soft delete Admin/SuperAdmin
          const denyResponse = hasAdminOrSuperAdminRole(user.roles);
          if (denyResponse) {
            logger.warn(
              `[ADMIN][softDeleteUser] AdminCannotDelete for id: ${id}`
            );
            return {
              status: 403,
              message: errMsg.AdminCannotDelete.message,
              id,
            };
          }

          await prisma.user.update({
            where: { id },
            data: { deletedAt: new Date() },
          });

          logger.info(`[ADMIN][softDeleteUser] Success for id: ${id}`);
          return {
            status: 200,
            message: `ย้ายผู้ใช้งาน ${user.username} ไปถังขยะสำเร็จ`,
            id,
          };
        })
      );

      // ตรวจสอบว่ามี error หรือไม่
      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[ADMIN][softDeleteUser] Success - ${ids.length} users soft deleted`
      );
      return {
        status: 200,
        message: `ย้ายผู้ใช้งาน ${ids.length} รายไปถังขยะสำเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][softDeleteUser] Error:", err);
      throw err;
    }
  },
  restoreUser: async (ids: string[]) => {
    logger.info(`[ADMIN][restoreUser] Start {"ids": "${ids.join(", ")}"}`);

    try {
      if (!ids.length || !ids.every((id) => ObjectId.isValid(id))) {
        logger.warn("[ADMIN][restoreUser] Invalid ID(s)");
        return errMsg.InvalidId;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          const user = await prisma.user.findUnique({
            where: { id },
          });

          if (!user) {
            logger.warn(`[ADMIN][restoreUser] UserNotFound for id: ${id}`);
            return { status: 404, message: errMsg.UserNotFound.message, id };
          }

          if (!user.deletedAt) {
            logger.warn(`[ADMIN][restoreUser] UserNotDeleted for id: ${id}`);
            return { status: 400, message: errMsg.UserNotDeleted.message, id };
          }

          // ป้องกันการ restore Admin/SuperAdmin
          const denyResponse = hasAdminOrSuperAdminRole(user.roles);
          if (denyResponse) {
            logger.warn(`[ADMIN][restoreUser] Forbidden for id: ${id}`);
            return {
              status: 403,
              message: errMsg.AdminCannotRestore.message,
              id,
            };
          }

          await prisma.user.update({
            where: { id },
            data: { deletedAt: null }, // กู้คืนโดยตั้ง deletedAt เป็น null
          });

          logger.info(`[ADMIN][restoreUser] Success for id: ${id}`);
          return {
            status: 200,
            message: `กู้คืนผู้ใช้งาน ${user.username} สําเร็จ`,
            id,
          };
        })
      );

      // ตรวจสอบว่ามี error หรือไม่
      const failed = results.find((res) => res.status !== 200);
      if (failed) {
        return failed;
      }

      logger.info(
        `[ADMIN][restoreUser] Success - ${ids.length} users restored`
      );
      return {
        status: 200,
        message: `กู้คืนผู้ใช้งาน ${ids.length} รายสำเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][restoreUser] Error:", err);
      throw error(500, err);
    }
  },
  createUser: async (
    user: Static<typeof userBodySchema> & {
      image: Static<typeof imageBodySchema>;
    }
  ) => {
    logger.info(`[ADMIN][createUser] Start {"email": "${user.email}"}`);

    try {
      if (Object.values(user).some((v) => !v)) {
        logger.warn("[ADMIN][createUser] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingEmail = await commonService.verifyActiveUserByEmail(
        user.email
      );

      if (existingEmail) {
        logger.warn("[ADMIN][createUser] EmailExists");
        return errMsg.EmailExists;
      }

      user.password = await bcrypt.hash(user.password, SALT_ROUNDS);

      const newImage = await prisma.image.create({
        data: {
          key: user.image.key,
          name: user.image.name,
          url: user.image.url,
        },
      });

      await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          password: user.password,
          provider: AuthProvider.LOCAL,
          imageId: newImage.id,
          deletedAt: null,
        },
      });
      logger.info(`[ADMIN][createUser] Success`);
      return {
        status: 201,
        message: "สร้างบัญชีผู้ใช้งานสําเร็จ",
      };
    } catch (err) {
      logger.error("[ADMIN][createUser] Error:", err);
      throw error(500, err);
    }
  },
  updateUser: async (
    user: Static<typeof userUpdateBodySchema> & { id: string }
  ) => {
    logger.info(`[ADMIN][updateUser] Start {"email": "${user.email}"}`);

    try {
      if (Object.values(user).some((v) => !v)) {
        logger.warn("[ADMIN][updateUser] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingEmail = await commonService.verifyActiveUserByEmail(
        user.email
      );

      if (existingEmail) {
        logger.warn("[ADMIN][updateUser] EmailExists");
        return errMsg.EmailExists;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username: user.username,
          email: user.email,
        },
      });

      logger.info(`[ADMIN][updateUser] Success`);
      return {
        status: 200,
        message: "แก้ไขบัญชีผู้ใช้งานสําเร็จ",
      };
    } catch (err) {
      logger.error("[ADMIN][updateUser] Error:", err);
      throw error(500, err);
    }
  },
};

export { adminService };
