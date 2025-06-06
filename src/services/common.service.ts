import { errMsg } from "@/config/message.error";
import { logger } from "@/utils/logger";
import { PrismaClient } from "@prisma/client";
import { ObjectId } from "mongodb";

const prisma = new PrismaClient();
export const commonService = {
  verifyActiveUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email, isActive: true },
      select: {
        id: true,
        tokenVersion: true,
        roles: true,
      },
    });
  },
  getActiveUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: { email, isActive: true, deletedAt: null },
    });
  },
  createTempUpload: async (
    key: string,
    name: string,
    url: string,
    uploadedById: string
  ) => {
    logger.info(
      `[COMMON][createTempUpload] Start {"key": "${key}" by "${uploadedById}"}`
    );
    if (!key || !name || !url) {
      logger.warn("[USER][createTempUpload] InvalidUserData");
      return errMsg.InvalidUserData;
    }
    const temp = await prisma.tempUpload.create({
      data: { key, name, url, uploadedById },
    });
    logger.info(`[COMMON][createTempUpload] Success {"tempId": "${temp.id}"}`);

    return {
      status: 200,
      message: "สร้างรูปภาพชั่วคราวสําเร็จ",
    };
  },
  getTempUploadByUserId: async (userId: string) => {
    logger.info(`[COMMON][getTempUpload] {"userId": "${userId}"}`);
    const temp = await prisma.tempUpload.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: "desc" },
    });
    if (temp.length === 0) {
      logger.warn("[COMMON][getTempUpload] TempNotFound");
      return errMsg.TempNotFound;
    }
    logger.info(`[COMMON][getTempUpload] Success`);
    return {
      status: 200,
      data: temp,
    };
  },
  deleteTempUploadByUserId: async (userId: string) => {
    logger.info(`[COMMON][deleteTempUploadById] {"userId": "${userId}"}`);
    const temp = await prisma.tempUpload.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: "desc" },
    });
    if (temp.length === 0) {
      logger.warn("[COMMON][deleteTempUploadById] TempNotFound");
      return errMsg.TempNotFound;
    }
    await prisma.tempUpload.deleteMany({
      where: { uploadedById: userId },
    });
    logger.info(`[COMMON][deleteTempUploadById] Success`);
    return {
      status: 200,
      message: "ลบรูปภาพชั่วคราวสําเร็จ",
    };
  },
};
