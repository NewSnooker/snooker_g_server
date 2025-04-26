import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import {
  googleSignInSchema,
  userBodySchema,
  userSignInSchema,
} from "../schema/user.schema";
import { msgSchema } from "../schema/common.schema";

export const authController = new Elysia().group(
  "/auth",
  { tags: ["Auth"] },
  (app) =>
    app
      .post(
        "/sign-up",
        async ({ body, set }) => {
          const response = await authService.signUp(body);
          set.status = response.status;
          return response;
        },
        {
          body: userBodySchema,
          response: {
            201: msgSchema,
            400: msgSchema,
            409: msgSchema,
            500: msgSchema,
          },
        }
      )
      .post(
        "/sign-in",
        async ({ body, set, cookie: { auth }, jwt }: any) => {
          const response = await authService.signIn(body);
          if (response.status === 200) {
            const value = await jwt.sign({
              id: response.data.id,
              tokenVersion: response.data.tokenVersion,
            });
            auth.set({
              value,
              maxAge: Date.now() + 1000 * 60 * 60 * 24, // 1 days
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });

            return { ...response, value };
          }
          set.status = response.status;
          return response;
        },
        {
          body: userSignInSchema,
          response: {
            200: t.Object({
              status: t.Number(),
              message: t.String(),
              data: t.Object({
                id: t.String(),
              }),
              value: t.String(),
            }),
            400: msgSchema,
            404: msgSchema,
            409: msgSchema,
            500: msgSchema,
          },
        }
      ) // เพิ่ม Google Sign-In
      .post(
        "/sign-in/google",
        async ({ body, set, cookie: { auth }, jwt }: any) => {
          const response = await authService.signInWithGoogle(body.idToken);
          if (response.status === 200 && response.data) {
            // สร้าง JWT และเซ็ต cookie เหมือนเดิม
            const token = await jwt.sign({
              id: response.data.id,
              tokenVersion: response.data.tokenVersion,
            });
            auth.set({
              value: token,
              maxAge: 60 * 60 * 24, // 1 วัน
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });
            return { ...response, value: token };
          }
          set.status = response.status;
          return response;
        },
        {
          body: googleSignInSchema,
          response: {
            200: t.Object({
              status: t.Number(),
              message: t.String(),
              data: t.Object({ id: t.String() }),
              value: t.String(),
            }),
            400: msgSchema,
            500: msgSchema,
          },
        }
      )
      .post(
        "/sign-out",
        async ({ cookie: { auth }, set }: any) => {
          const response = await authService.signOut(auth);
          set.status = response.status;
          return response;
        },
        {
          response: {
            200: msgSchema,
            500: msgSchema,
          },
        }
      )
);
