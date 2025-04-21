// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import { errMsg } from "@/config/message.error";

const prisma = new PrismaClient();

const adminService = {
  forceLogoutById: async (id: string) => {
    try {
      if (!id || !ObjectId.isValid(id)) {
        throw error(400, errMsg.InvalidId);
      }
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw error(404, errMsg.UserNotFound);
      }

      await prisma.user.update({
        where: { id: id },
        data: { tokenVersion: { increment: 1 } },
      });
      return {
        status: "success",
        message: `ออกจากระบบของ ${user.username} สําเร็จ`,
      };
    } catch (err) {
      throw error(500, err);
    }
  },
  forceLogoutAll: async () => {
    try {
      await prisma.user.updateMany({
        data: {
          tokenVersion: {
            increment: 1,
          },
        },
      });

      return {
        status: "success",
        message: "บังคับให้ออกจากระบบทุกผู้ใช้เรียบร้อยแล้ว",
      };
    } catch (err) {
      throw error(500, err);
    }
  },
};

export { adminService };
