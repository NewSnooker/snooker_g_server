// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { Static } from "@sinclair/typebox";
import { avatarSchema, userBodySchema } from "../schema/user.schema";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

const userService = {
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
            createdAt: true,
            updatedAt: true,
            image: true,
            tokenVersion: true,
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

  getUserById: async (id: string) => {
    logger.info(`[USER][getUserById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[USER][getUserById] ID InvalidId");
        return errMsg.InvalidId;
      }
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          tokenVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        logger.warn("[USER][getUserById] UserNotFound");
        return errMsg.UserNotFound;
      }
      logger.info("[USER][getUserById] Success");

      return {
        status: 200,
        data: user,
      };
    } catch (err) {
      logger.error("[USER][getUserById] Error:", err);
      throw error(500, err);
    }
  },

  updateUser: async (id: string, user: Static<typeof userBodySchema>) => {
    logger.info(`[USER][updateUser] Start {"id": "${id}", "user": "${user}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[USER][updateUser] InvalidId");
        return errMsg.InvalidId;
      }
      if (!user) {
        logger.warn("[USER][updateUser] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        logger.warn("[USER][updateUser] UserNotFound");
        return errMsg.UserNotFound;
      }

      // ตรวจสอบว่ามีการเปลี่ยนอีเมลเป็นอีเมลที่มีอยู่แล้วหรือไม่
      if (user.email && user.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (emailExists) {
          logger.warn("[USER][updateUser] EmailExists");
          return errMsg.EmailExists;
        }
      }

      await prisma.user.update({
        where: { id },
        data: user,
      });

      logger.info("[USER][updateUser] Success");

      return {
        status: 200,
        message: `แก้ไขข้อมูลผู้ใช้งานสําเร็จ`,
      };
    } catch (err) {
      logger.error("[USER][updateUser] Error:", err);
      throw error(500, err);
    }
  },
  updateAvatar: async (id: string, avatar: Static<typeof avatarSchema>) => {
    logger.info(`[USER][updateAvatar] Start {"id": "${id}""}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[USER][updateAvatar] InvalidId");
        return errMsg.InvalidId;
      }
      if (!avatar) {
        logger.warn("[USER][updateAvatar] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingAvatar = await prisma.image.findUnique({
        where: { id },
      });

      if (!existingAvatar) {
        logger.warn("[USER][updateAvatar] ImageIdNotFound");
        return errMsg.ImageIdNotFound;
      }
      await prisma.image.update({
        where: { id },
        data: avatar,
      });

      logger.info("[USER][updateAvatar] Success");

      return {
        status: 200,
        message: `แก้ไขรูปโปรไฟล์สําเร็จ`,
      };
    } catch (err) {
      logger.error("[USER][updateAvatar] Error:", err);
      throw error(500, err);
    }
  },
  updateUsername: async (id: string, username: string) => {
    logger.info(`[USER][updateUsername] Start {"id": "${id}""}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[USER][updateUsername] InvalidId");
        return errMsg.InvalidId;
      }
      if (!username) {
        logger.warn("[USER][updateUsername] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        logger.warn("[USER][updateUsername] UserNotFound");
        return errMsg.UserNotFound;
      }
      await prisma.user.update({
        where: { id },
        data: { username },
      });

      logger.info("[USER][updateUsername] Success");

      return {
        status: 200,
        message: `แก้ไขชื่อผู้ใช้สําเร็จ`,
      };
    } catch (err) {
      logger.error("[USER][updateUsername] Error:", err);
      throw error(500, err);
    }
  },
};

export { userService };
