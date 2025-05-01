// src/prisma/client.ts
import { logger } from "@/utils/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
});

// Middleware สำหรับ soft delete
prisma.$use(async (params, next) => {
  if (params.model === "User") {
    // กรองเฉพาะ user ที่ยังไม่ถูกลบ
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    if (params.action === "findMany") {
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    // อัพเดทเฉพาะ user ที่ยังไม่ถูกลบ
    if (params.action === "update") {
      params.action = "updateMany";
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }
  return next(params);
});

// Optional: Log queries สำหรับ debugging
prisma.$on("query", (e) => {
  logger.debug(`[PRISMA][Query] ${e.query} ${e.params}`);
});

export { prisma };
