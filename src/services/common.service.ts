import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const verifyActiveUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email, isActive: true, deletedAt: null },
    select: {
      id: true,
      tokenVersion: true,
      roles: true,
    },
  });
};

export const getActiveUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email, isActive: true, deletedAt: null },
  });
};
