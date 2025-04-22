// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

const adminService = {
  forceLogoutById: async (id: string) => {
    logger.info(`[ADMIN][forceLogoutById] Start {"id": "${id}"}`);
    try {
      if (!id || !ObjectId.isValid(id)) {
        logger.warn("[ADMIN][forceLogoutById] InvalidId");
        return errMsg.InvalidId;
      }
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        logger.warn("[ADMIN][forceLogoutById] UserNotFound");
        return errMsg.UserNotFound;
      }

      await prisma.user.update({
        where: { id: id },
        data: { tokenVersion: { increment: 1 } },
      });
      logger.info("[ADMIN][forceLogoutById] Success");
      return {
        status: 200,
        message: `ออกจากระบบของ ${user.username} สําเร็จ`,
      };
    } catch (err) {
      logger.error("[ADMIN][forceLogoutById] Error:", err);
      throw error(500, err);
    }
  },
  forceLogoutAll: async () => {
    logger.info("[ADMIN][forceLogoutAll] Start");
    try {
      await prisma.user.updateMany({
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });

      logger.info("[ADMIN][forceLogoutAll] Success");
      return {
        status: 200,
        message: "บังคับให้ออกจากระบบทุกผู้ใช้เรียบร้อยแล้ว",
      };
    } catch (err) {
      logger.error("[ADMIN][forceLogoutAll] Error:", err);
      throw error(500, err);
    }
  },
};

export { adminService };
