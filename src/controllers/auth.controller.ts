import { Elysia, t } from "elysia";
import { authService } from "../services/auth.service";
import { userSchema, userSignInSchema } from "../schema/user.schema";
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
          body: userSchema,
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
              secure: true,
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
              status: t.String(),
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
