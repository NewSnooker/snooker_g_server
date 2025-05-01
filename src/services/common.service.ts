import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserByEmailNoPassword = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      updatedAt: true,
      tokenVersion: true,
      roles: true,
    },
  });
};

export const getUserByEmailAllFields = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};
