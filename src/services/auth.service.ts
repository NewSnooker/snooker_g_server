// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { Static } from "@sinclair/typebox";
import { userSchema, userSignInSchema } from "../schema/user.schema";
import { error } from "elysia";
import { errMsg } from "@/config/message.error";
import bcrypt from "bcrypt";
import {
  getUserByEmailAllFields,
  getUserByEmailNoPassword,
} from "./common.service";
import { logger } from "@/utils/logger";

const prisma = new PrismaClient();

const authService = {
  signUp: async (user: Static<typeof userSchema>) => {
    logger.info(`[AUTH][signUp] Start {"email": "${user.email}"}`);
    try {
      if (Object.values(user).some((v) => !v)) {
        logger.warn("[AUTH][signUp] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingUser = await getUserByEmailNoPassword(user.email);

      if (existingUser) {
        logger.warn("[AUTH][signUp] EmailExists");
        return errMsg.EmailExists;
      }

      user.password = await bcrypt.hash(user.password, 10);

      await prisma.user.create({
        data: user,
      });
      logger.info(`[AUTH][signUp] Success`);
      return {
        status: 201,
        message: "สร้างบัญชีผู้ใช้งานสําเร็จ",
      };
    } catch (err) {
      logger.error("[AUTH][signUp] Error:", err);
      throw error(500, err);
    }
  },
  signIn: async (user: Static<typeof userSignInSchema>) => {
    logger.info(`[AUTH][signIn] Start {"email": "${user.email}"}`);
    try {
      if (Object.values(user).some((v) => !v)) {
        logger.warn("[AUTH][signIn] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingUser = await getUserByEmailAllFields(user.email);

      if (!existingUser) {
        logger.warn("[AUTH][signIn] UserNotFound");
        return errMsg.UserNotFound;
      }

      const isPasswordMatch = await bcrypt.compare(
        user.password,
        existingUser.password
      );

      if (!isPasswordMatch) {
        logger.warn("[AUTH][signIn] InvalidPassword");
        return errMsg.InvalidPassword;
      }
      logger.info("[AUTH][signIn] Success");
      return {
        status: 200,
        message: "เข้าสู่ระบบสําเร็จ",
        data: {
          id: existingUser.id,
          email: existingUser.email,
          tokenVersion: existingUser.tokenVersion,
        },
      };
    } catch (err) {
      logger.error("[AUTH][signIn] Error:", err);
      throw error(500, err);
    }
  },
  signOut: async ({ auth }: any) => {
    logger.info("[AUTH][signOut] Start");
    try {
      auth.remove(); // ลบ cookie
      logger.info("[AUTH][signOut] Success");
      return {
        status: 200,
        message: "Logged out successfully",
      };
    } catch (err) {
      logger.error("[AUTH][signOut] Error:", err);
      throw error(500, err);
    }
  },
};

export { authService };
