// src/services/user.service.ts
import { PrismaClient } from "@prisma/client";
import { Static } from "@sinclair/typebox";
import { userSchema, userSignInSchema } from "../schema/user.schema";
import { error } from "elysia";
import errMsg from "../config/message.error.json";
import bcrypt from "bcrypt";
import {
  getUserByEmailAllFields,
  getUserByEmailNoPassword,
} from "./common.service";

const prisma = new PrismaClient();

const authService = {
  signUp: async (user: Static<typeof userSchema>) => {
    try {
      if (Object.values(user).some((v) => !v)) {
        throw error(400, errMsg.InvalidUserData);
      }

      const existingUser = await getUserByEmailNoPassword(user.email);

      if (existingUser) {
        throw error(409, errMsg.EmailExists);
      }

      user.password = await bcrypt.hash(user.password, 10);

      await prisma.user.create({
        data: user,
      });

      return {
        status: "success",
        message: "User created successfully.",
      };
    } catch (err) {
      throw error(500, err);
    }
  },
  signIn: async (user: Static<typeof userSignInSchema>) => {
    try {
      if (Object.values(user).some((v) => !v)) {
        throw error(400, errMsg.InvalidUserData);
      }

      const existingUser = await getUserByEmailAllFields(user.email);

      if (!existingUser) {
        throw error(404, errMsg.UserNotFound);
      }

      const isPasswordMatch = await bcrypt.compare(
        user.password,
        existingUser.password
      );

      if (!isPasswordMatch) {
        throw error(409, errMsg.InvalidPassword);
      }

      return {
        status: "success",
        message: "User signed in successfully.",
        data: {
          id: existingUser.id,
          email: existingUser.email,
          tokenVersion: existingUser.tokenVersion,
        },
      };
    } catch (err) {
      throw error(500, err);
    }
  },
};

export { authService };
