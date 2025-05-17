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
  getActiveUserById: async (id: string) => {
    logger.info(`[USER][getUserById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[USER][getUserById] ID InvalidId");
        return errMsg.InvalidId;
      }
      const user = await prisma.user.findUnique({
        where: { id, isActive: true, deletedAt: null },
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
  updateAvatar: async (
    imageId: string,
    avatar: Static<typeof avatarSchema>
  ) => {
    logger.info(`[USER][updateAvatar] Start {"imageId": "${imageId}""}`);
    try {
      if (!imageId || !ObjectId.isValid(imageId)) {
        logger.warn("[USER][updateAvatar] InvalidId");
        return errMsg.InvalidId;
      }
      if (!avatar) {
        logger.warn("[USER][updateAvatar] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingAvatar = await prisma.image.findUnique({
        where: { id: imageId },
      });

      if (!existingAvatar) {
        logger.warn("[USER][updateAvatar] ImageIdNotFound");
        return errMsg.ImageIdNotFound;
      }
      await prisma.image.update({
        where: { id: imageId },
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
