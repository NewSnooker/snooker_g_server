// src/services/user.service.ts
import { AuthProvider, PrismaClient } from "@prisma/client";
import { Static } from "@sinclair/typebox";
import { userBodySchema, userSignInSchema } from "../schema/user.schema";
import { error } from "elysia";
import { errMsg } from "@/config/message.error";
import bcrypt from "bcrypt";
import {
  getActiveUserByEmail,
  verifyActiveUserByEmail,
} from "./common.service";
import { logger } from "@/utils/logger";
import { OAuth2Client } from "google-auth-library";
import { DEFAULT_AVATAR_URL, SALT_ROUNDS } from "@/config/constant";

const prisma = new PrismaClient();

const authService = {
  signUp: async (user: Static<typeof userBodySchema>) => {
    logger.info(`[AUTH][signUp] Start {"email": "${user.email}"}`);
    try {
      if (Object.values(user).some((v) => !v)) {
        logger.warn("[AUTH][signUp] InvalidUserData");
        return errMsg.InvalidUserData;
      }

      const existingEmail = await verifyActiveUserByEmail(user.email);

      if (existingEmail) {
        logger.warn("[AUTH][signUp] EmailExists");
        return errMsg.EmailExists;
      }

      user.password = await bcrypt.hash(user.password, SALT_ROUNDS);

      const newImage = await prisma.image.create({
        data: {
          key: "",
          name: "",
          url: DEFAULT_AVATAR_URL,
        },
      });
      await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          password: user.password,
          provider: AuthProvider.LOCAL,
          imageId: newImage.id,
          deletedAt: null,
        },
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
  signInWithGoogle: async (idToken: string) => {
    logger.info(`[AUTH][signInWithGoogle] verifying token`);

    if (!idToken) {
      logger.warn("[AUTH][signInWithGoogle] Missing idToken");
      return errMsg.InvalidUserData;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      logger.error("[AUTH][signInWithGoogle] Missing GOOGLE_CLIENT_ID");
      throw new Error(
        "Server configuration error: GOOGLE_CLIENT_ID is not set"
      );
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email_verified) {
        logger.warn("[AUTH][signInWithGoogle] Invalid Google token payload");
        return errMsg.InvalidUserData;
      }

      const { sub: googleId, email, name, picture } = payload;

      if (!email) {
        logger.warn("[AUTH][signInWithGoogle] Email is undefined");
        return errMsg.InvalidUserData;
      }

      let user = await verifyActiveUserByEmail(email);

      if (!user) {
        logger.info(`[AUTH][signInWithGoogle] Creating new user for ${email}`);
        const newImage = await prisma.image.create({
          data: {
            key: "",
            name: "",
            url: picture || DEFAULT_AVATAR_URL,
          },
        });

        user = await prisma.user.create({
          data: {
            username: name || "Unknown",
            email,
            googleId,
            provider: AuthProvider.GOOGLE,
            imageId: newImage.id,
            deletedAt: null,
          },
        });
      }

      logger.info("[AUTH][signInWithGoogle] Success");
      return {
        status: 200,
        message: "เข้าสู่ระบบด้วย Google สำเร็จ",
        data: {
          id: user.id,
          roles: user.roles,
          tokenVersion: user.tokenVersion,
        },
      };
    } catch (err) {
      logger.error("[AUTH][signInWithGoogle] Unexpected error:", err);
      return {
        status: 500,
        message: "An unexpected error occurred during Google sign-in",
      };
    }
  },
  signIn: async (user: Static<typeof userSignInSchema>) => {
    logger.info(`[AUTH][signIn] Start {"email":"${user.email}"}`);

    // 1. ตรวจสอบ input เบื้องต้น
    if (!user.email?.trim() || !user.password) {
      logger.warn("[AUTH][signIn] InvalidUserData");
      return errMsg.InvalidUserData;
    }

    try {
      // 2. หา user ในฐานข้อมูล
      const existingUser = await getActiveUserByEmail(user.email);

      if (!existingUser) {
        logger.warn("[AUTH][signIn] UserNotFound");
        return errMsg.UserNotFound;
      }

      // 3. ตรวจสอบว่า user นี้สมัครด้วย LOCAL เท่านั้น
      if (existingUser.provider !== AuthProvider.LOCAL) {
        logger.warn(
          `[AUTH][signIn] WrongProvider: expected LOCAL but got ${existingUser.provider}`
        );
        // ให้ message ทั่วไปว่าหาไม่เจอ เพื่อความปลอดภัย
        return errMsg.UserNotFound;
      }

      // 4. ตรวจสอบว่ามีรหัสผ่านหรือไม่
      if (!existingUser.password) {
        logger.error("[AUTH][signIn] MissingPasswordInDB");
        return errMsg.InvalidUserData;
      }

      // 5. เช็ครหัสผ่าน
      const isMatch = await bcrypt.compare(
        user.password,
        existingUser.password
      );
      if (!isMatch) {
        logger.warn("[AUTH][signIn] InvalidPassword");
        return errMsg.InvalidPassword;
      }

      logger.info("[AUTH][signIn] Success");
      return {
        status: 200,
        message: "เข้าสู่ระบบสำเร็จ",
        data: {
          id: existingUser.id,
          roles: existingUser.roles,
          tokenVersion: existingUser.tokenVersion,
        },
      };
    } catch (err) {
      logger.error("[AUTH][signIn] Error:", err);
      throw error(500, err);
    }
  },
  signOut: async (auth: any) => {
    logger.info("[AUTH][signOut] Start");
    try {
      auth.remove(); // ลบ cookie
      logger.info("[AUTH][signOut] Success");
      return {
        status: 200,
        message: "ออกจากระบบสําเร็จ",
      };
    } catch (err) {
      logger.error("[AUTH][signOut] Error:", err);
      throw error(500, err);
    }
  },
};

export { authService };
