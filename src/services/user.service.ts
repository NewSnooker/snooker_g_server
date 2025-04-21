// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { Static } from "@sinclair/typebox";
import { userSchema } from "../schema/user.schema";
import { error } from "elysia";
import { ObjectId } from "mongodb";
import errMsg from "../config/message.error.json";

const prisma = new PrismaClient();

const userService = {
  getAllUsersPaginated: async (page: number, limit: number) => {
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
            imageUrl: true,
            tokenVersion: true,
          },
        }),
        prisma.user.count(),
      ]);

      if (users.length === 0) {
        throw error(404, errMsg.UserNotFound);
      }

      return {
        status: "success",
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      throw error(500, err);
    }
  },

  getUserById: async (id: string) => {
    try {
      if (!id || !ObjectId.isValid(id)) {
        throw error(400, errMsg.InvalidId);
      }
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          imageUrl: true,
          tokenVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw error(404, errMsg.UserNotFound);
      }

      return {
        status: "success",
        data: user,
      };
    } catch (err) {
      throw error(500, err);
    }
  },

  updateUser: async (id: string, user: Static<typeof userSchema>) => {
    try {
      if (!id || !ObjectId.isValid(id)) {
        throw error(400, errMsg.InvalidId);
      }
      if (!user) {
        throw error(400, errMsg.InvalidUserData);
      }

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        throw error(404, errMsg.UserNotFound);
      }

      // ตรวจสอบว่ามีการเปลี่ยนอีเมลเป็นอีเมลที่มีอยู่แล้วหรือไม่
      if (user.email && user.email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (emailExists) {
          throw error(409, errMsg.EmailExists);
        }
      }

      await prisma.user.update({
        where: { id },
        data: user,
      });

      return {
        status: "success",
        message: `User with ID ${id} has been updated.`,
      };
    } catch (err) {
      throw error(500, err);
    }
  },

  deleteUser: async (id: string) => {
    try {
      if (!id || !ObjectId.isValid(id) || "") {
        throw error(400, errMsg.InvalidId);
      }

      // ตรวจสอบว่ามีผู้ใช้นี้หรือไม่ก่อนลบ
      const existingUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw error(404, errMsg.UserNotFound);
      }

      await prisma.user.delete({
        where: { id },
      });

      return {
        status: "success",
        message: `User with ID ${id} has been deleted.`,
      };
    } catch (err) {
      throw error(500, err);
    }
  },
};

export { userService };
